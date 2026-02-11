package com.almasfufa.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Main {
  private static final int DEFAULT_PORT = 8085;
  private static final Path DATA_DIR = Path.of("java_server", "data");
  private static final Path USER_FILE = DATA_DIR.resolve("users.csv");

  private static final Map<String, UserRecord> usersByEmail = new ConcurrentHashMap<>();
  private static final Map<String, SessionRecord> sessionsByToken = new ConcurrentHashMap<>();

  public static void main(String[] args) throws Exception {
    int port = DEFAULT_PORT;
    if (args.length > 0) {
      port = Integer.parseInt(args[0]);
    }

    initStorage();
    loadUsers();

    HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
    server.createContext("/api/health", new HealthHandler());
    server.createContext("/api/auth/register", new RegisterHandler());
    server.createContext("/api/auth/login", new LoginHandler());
    server.createContext("/api/auth/me", new MeHandler());

    server.setExecutor(Executors.newFixedThreadPool(8));
    server.start();

    System.out.println("ALMASFUFA Java server started on 0.0.0.0:" + port);
  }

  private static void initStorage() throws IOException {
    if (!Files.exists(DATA_DIR)) {
      Files.createDirectories(DATA_DIR);
    }
    if (!Files.exists(USER_FILE)) {
      Files.writeString(USER_FILE, "id,email,full_name,password_hash,created_at\n", StandardCharsets.UTF_8);
    }
  }

  private static void loadUsers() throws IOException {
    usersByEmail.clear();
    for (String line : Files.readAllLines(USER_FILE, StandardCharsets.UTF_8)) {
      if (line.startsWith("id,")) continue;
      if (line.isBlank()) continue;
      String[] parts = line.split(",", -1);
      if (parts.length < 5) continue;
      UserRecord user = new UserRecord(parts[0], parts[1], parts[2], parts[3], parts[4]);
      usersByEmail.put(user.email.toLowerCase(), user);
    }
  }

  private static synchronized void persistUser(UserRecord user) throws IOException {
    String row = String.join(",",
      user.id,
      user.email,
      user.fullName,
      user.passwordHash,
      user.createdAt
    ) + "\n";
    Files.writeString(USER_FILE, row, StandardCharsets.UTF_8, java.nio.file.StandardOpenOption.APPEND);
  }

  private static String readBody(HttpExchange exchange) throws IOException {
    try (InputStream in = exchange.getRequestBody()) {
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
    exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
    exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream out = exchange.getResponseBody()) {
      out.write(bytes);
    }
  }

  private static String jsonValue(String json, String key) {
    Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"([^\"]*)\"");
    Matcher m = p.matcher(json);
    return m.find() ? m.group(1).trim() : "";
  }

  private static String sha256(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder();
      for (byte b : hash) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException(e);
    }
  }

  private static class HealthHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 200, "{}");
        return;
      }
      sendJson(exchange, 200, "{\"status\":\"ok\",\"service\":\"almasfufa-java-server\"}");
    }
  }

  private static class RegisterHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }

      String body = readBody(exchange);
      String email = jsonValue(body, "email").toLowerCase();
      String fullName = jsonValue(body, "fullName");
      String password = jsonValue(body, "password");

      if (email.isBlank() || fullName.isBlank() || password.length() < 6) {
        sendJson(exchange, 400, "{\"error\":\"invalid_input\",\"message\":\"email, fullName, password(>=6) required\"}");
        return;
      }

      if (usersByEmail.containsKey(email)) {
        sendJson(exchange, 409, "{\"error\":\"email_exists\"}");
        return;
      }

      UserRecord user = new UserRecord(
        UUID.randomUUID().toString(),
        email,
        fullName,
        sha256(password),
        Instant.now().toString()
      );

      usersByEmail.put(email, user);
      persistUser(user);

      sendJson(exchange, 201,
        "{\"id\":\"" + user.id + "\",\"email\":\"" + user.email + "\",\"fullName\":\"" + user.fullName + "\"}");
    }
  }

  private static class LoginHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }

      String body = readBody(exchange);
      String email = jsonValue(body, "email").toLowerCase();
      String password = jsonValue(body, "password");

      UserRecord user = usersByEmail.get(email);
      if (user == null || !user.passwordHash.equals(sha256(password))) {
        sendJson(exchange, 401, "{\"error\":\"invalid_credentials\"}");
        return;
      }

      String token = UUID.randomUUID().toString();
      sessionsByToken.put(token, new SessionRecord(token, user.id, user.email, user.fullName, Instant.now().toString()));

      sendJson(exchange, 200,
        "{\"token\":\"" + token + "\",\"user\":{\"id\":\"" + user.id + "\",\"email\":\"" + user.email + "\",\"fullName\":\"" + user.fullName + "\"}}"
      );
    }
  }

  private static class MeHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      String auth = exchange.getRequestHeaders().getFirst("Authorization");
      if (auth == null || !auth.startsWith("Bearer ")) {
        sendJson(exchange, 401, "{\"error\":\"missing_token\"}");
        return;
      }

      String token = auth.substring("Bearer ".length());
      SessionRecord session = sessionsByToken.get(token);
      if (session == null) {
        sendJson(exchange, 401, "{\"error\":\"invalid_token\"}");
        return;
      }

      sendJson(exchange, 200,
        "{\"id\":\"" + session.userId + "\",\"email\":\"" + session.email + "\",\"fullName\":\"" + session.fullName + "\",\"issuedAt\":\"" + session.issuedAt + "\"}"
      );
    }
  }

  private record UserRecord(String id, String email, String fullName, String passwordHash, String createdAt) {}

  private record SessionRecord(String token, String userId, String email, String fullName, String issuedAt) {}
}
