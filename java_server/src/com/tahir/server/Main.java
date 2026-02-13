package com.tahir.server;

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
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.concurrent.ExecutorService;

public class Main {
  private static final int DEFAULT_PORT = 8085;
  private static final int MAX_REQUEST_BODY_BYTES = 8 * 1024;
  private static final long SESSION_TTL_SECONDS = TimeUnit.HOURS.toSeconds(8);
  private static final long CLEANUP_INTERVAL_SECONDS = TimeUnit.MINUTES.toSeconds(5);
  private static final String ENV_SESSION_TTL_SECONDS = "TAHIR_SESSION_TTL_SECONDS";
  private static final String ENV_MAX_REQUEST_BODY_BYTES = "TAHIR_MAX_REQUEST_BODY_BYTES";
  private static final String ENV_RELEASE_VERSION = "TAHIR_RELEASE_VERSION";
  private static final String ENV_LOGIN_MAX_ATTEMPTS = "TAHIR_LOGIN_MAX_ATTEMPTS";
  private static final String ENV_LOGIN_ATTEMPT_WINDOW_SECONDS = "TAHIR_LOGIN_ATTEMPT_WINDOW_SECONDS";
  private static final String ENV_LOGIN_LOCKOUT_SECONDS = "TAHIR_LOGIN_LOCKOUT_SECONDS";
  private static final int LOGIN_MAX_ATTEMPTS = 5;
  private static final long LOGIN_ATTEMPT_WINDOW_MS = TimeUnit.MINUTES.toMillis(10);
  private static final long LOGIN_LOCKOUT_MS = TimeUnit.MINUTES.toMillis(15);
  private static final Path DATA_DIR = Path.of("java_server", "data");
  private static final Path USER_FILE = DATA_DIR.resolve("users.csv");
  private static final String DEFAULT_ADMIN_EMAIL = "siddikitahir@gmail.com";
  private static final String DEFAULT_ADMIN_PASSWORD = "W@rzone786";
  private static final String ENV_ADMIN_EMAIL = "TAHIR_ADMIN_EMAIL";
  private static final String ENV_ADMIN_PASSWORD = "TAHIR_ADMIN_PASSWORD";
  private static final String ENV_DISABLE_DEFAULT_ADMIN = "TAHIR_DISABLE_DEFAULT_ADMIN";
  private static final String ENV_ALLOWED_ORIGIN = "TAHIR_ALLOWED_ORIGIN";

  private static final Map<String, UserRecord> usersByEmail = new ConcurrentHashMap<>();
  private static final Map<String, SessionRecord> sessionsByToken = new ConcurrentHashMap<>();
  private static final Map<String, FailedLoginState> failedLoginByPrincipal = new ConcurrentHashMap<>();
  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private static final AtomicLong totalRequests = new AtomicLong(0);
  private static final AtomicLong status4xxResponses = new AtomicLong(0);
  private static final AtomicLong status5xxResponses = new AtomicLong(0);
  private static final AtomicLong cumulativeResponseBytes = new AtomicLong(0);
  private static final AtomicLong housekeepingRuns = new AtomicLong(0);
  private static final AtomicLong lastHousekeepingEpochMs = new AtomicLong(0);
  private static final Instant SERVER_STARTED_AT = Instant.now();
  private static final long EFFECTIVE_SESSION_TTL_SECONDS = resolvePositiveLong(ENV_SESSION_TTL_SECONDS, SESSION_TTL_SECONDS);
  private static final int EFFECTIVE_MAX_REQUEST_BODY_BYTES = resolvePositiveInt(ENV_MAX_REQUEST_BODY_BYTES, MAX_REQUEST_BODY_BYTES);
  private static final String RELEASE_VERSION = resolveReleaseVersion();
  private static final int EFFECTIVE_LOGIN_MAX_ATTEMPTS = resolvePositiveInt(ENV_LOGIN_MAX_ATTEMPTS, LOGIN_MAX_ATTEMPTS);
  private static final long EFFECTIVE_LOGIN_ATTEMPT_WINDOW_MS = TimeUnit.SECONDS.toMillis(resolvePositiveLong(ENV_LOGIN_ATTEMPT_WINDOW_SECONDS, TimeUnit.MILLISECONDS.toSeconds(LOGIN_ATTEMPT_WINDOW_MS)));
  private static final long EFFECTIVE_LOGIN_LOCKOUT_MS = TimeUnit.SECONDS.toMillis(resolvePositiveLong(ENV_LOGIN_LOCKOUT_SECONDS, TimeUnit.MILLISECONDS.toSeconds(LOGIN_LOCKOUT_MS)));

  public static void main(String[] args) throws Exception {
    int port = parsePort(args);

    Thread.setDefaultUncaughtExceptionHandler((thread, throwable) ->
      logProcessError("uncaught_exception", thread.getName(), throwable)
    );

    initStorage();
    loadUsers();
    ensureDefaultAdminAccount();

    HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
    server.createContext("/api/health", new SafeHandler("health", new HealthHandler()));
    server.createContext("/api/auth/register", new SafeHandler("register", new RegisterHandler()));
    server.createContext("/api/auth/login", new SafeHandler("login", new LoginHandler()));
    server.createContext("/api/auth/me", new SafeHandler("me", new MeHandler()));
    server.createContext("/api/auth/logout", new SafeHandler("logout", new LogoutHandler()));
    server.createContext("/api/auth/change-password", new SafeHandler("change-password", new ChangePasswordHandler()));

    ExecutorService requestExecutor = Executors.newFixedThreadPool(8);
    server.setExecutor(requestExecutor);
    server.start();

    ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
    runHousekeeping();
    cleanupExecutor.scheduleAtFixedRate(
      Main::runHousekeeping,
      CLEANUP_INTERVAL_SECONDS,
      CLEANUP_INTERVAL_SECONDS,
      TimeUnit.SECONDS
    );

    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      sessionsByToken.clear();
      failedLoginByPrincipal.clear();
      cleanupExecutor.shutdownNow();
      requestExecutor.shutdownNow();
      server.stop(1);
    }));

    System.out.println("Tahir ERP Java server started on 0.0.0.0:" + port);
  }

  private static void initStorage() throws IOException {
    if (!Files.exists(DATA_DIR)) {
      Files.createDirectories(DATA_DIR);
    }
    if (!Files.exists(USER_FILE)) {
      Files.writeString(USER_FILE, "id,email,full_name,password_hash,created_at\n", StandardCharsets.UTF_8);
    }
  }

  private static void runHousekeeping() {
    cleanupExpiredSessions();
    cleanupExpiredLoginRateLimits();
    housekeepingRuns.incrementAndGet();
    lastHousekeepingEpochMs.set(System.currentTimeMillis());
  }

  private static int resolvePositiveInt(String envKey, int fallback) {
    String raw = System.getenv(envKey);
    if (raw == null || raw.isBlank()) {
      return fallback;
    }
    try {
      int parsed = Integer.parseInt(raw.trim());
      return parsed > 0 ? parsed : fallback;
    } catch (NumberFormatException ignored) {
      return fallback;
    }
  }

  private static long resolvePositiveLong(String envKey, long fallback) {
    String raw = System.getenv(envKey);
    if (raw == null || raw.isBlank()) {
      return fallback;
    }
    try {
      long parsed = Long.parseLong(raw.trim());
      return parsed > 0 ? parsed : fallback;
    } catch (NumberFormatException ignored) {
      return fallback;
    }
  }

  private static String resolveReleaseVersion() {
    String version = System.getenv(ENV_RELEASE_VERSION);
    return version == null || version.isBlank() ? "dev" : version.trim();
  }


  private static long loginRetryAfterSeconds(String principal) {
    FailedLoginState state = failedLoginByPrincipal.get(principal);
    if (state == null) {
      return 0;
    }
    long remainingMs = state.lockedUntilMs - System.currentTimeMillis();
    if (remainingMs <= 0) {
      return 0;
    }
    return Math.max(1, TimeUnit.MILLISECONDS.toSeconds(remainingMs));
  }

  private static void loadUsers() throws IOException {
    usersByEmail.clear();
    for (String line : Files.readAllLines(USER_FILE, StandardCharsets.UTF_8)) {
      if (line.startsWith("id,")) continue;
      if (line.isBlank()) continue;
      String[] parts = parseCsvRow(line);
      if (parts.length < 5) continue;
      UserRecord user = new UserRecord(parts[0], parts[1], parts[2], parts[3], parts[4]);
      usersByEmail.put(user.email.toLowerCase(), user);
    }
  }

  private static synchronized void persistUser(UserRecord user) throws IOException {
    String row = String.join(",",
      toCsvField(user.id),
      toCsvField(user.email),
      toCsvField(user.fullName),
      toCsvField(user.passwordHash),
      toCsvField(user.createdAt)
    ) + "\n";
    Files.writeString(USER_FILE, row, StandardCharsets.UTF_8, java.nio.file.StandardOpenOption.APPEND);
  }

  private static void ensureDefaultAdminAccount() throws IOException {
    if (isEnvFlagEnabled(ENV_DISABLE_DEFAULT_ADMIN)) {
      return;
    }

    String adminEmail = normalizeSeedAdminEmail();
    if (adminEmail.isBlank() || usersByEmail.containsKey(adminEmail)) {
      return;
    }
    String adminPassword = resolveSeedAdminPassword();
    if (!isStrongPassword(adminPassword)) {
      return;
    }

    UserRecord admin = new UserRecord(
      UUID.randomUUID().toString(),
      adminEmail,
      "Tahir Admin",
      sha256(adminPassword),
      Instant.now().toString()
    );
    usersByEmail.put(adminEmail, admin);
    persistUser(admin);
  }

  private static boolean isEnvFlagEnabled(String envKey) {
    String value = System.getenv(envKey);
    if (value == null) {
      return false;
    }
    String normalized = value.trim().toLowerCase();
    return "1".equals(normalized) || "true".equals(normalized) || "yes".equals(normalized);
  }

  private static String normalizeSeedAdminEmail() {
    String envEmail = System.getenv(ENV_ADMIN_EMAIL);
    String candidate = envEmail == null || envEmail.isBlank() ? DEFAULT_ADMIN_EMAIL : envEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.matcher(candidate).matches() || candidate.length() > 254) {
      return "";
    }
    return candidate;
  }

  private static String resolveSeedAdminPassword() {
    String envPassword = System.getenv(ENV_ADMIN_PASSWORD);
    return envPassword == null || envPassword.isBlank() ? DEFAULT_ADMIN_PASSWORD : envPassword;
  }

  private static boolean isStrongPassword(String password) {
    if (password == null || password.length() < 8 || password.length() > 128) {
      return false;
    }
    boolean hasUpper = false;
    boolean hasLower = false;
    boolean hasDigit = false;
    boolean hasSpecial = false;
    for (int i = 0; i < password.length(); i++) {
      char c = password.charAt(i);
      if (Character.isUpperCase(c)) hasUpper = true;
      else if (Character.isLowerCase(c)) hasLower = true;
      else if (Character.isDigit(c)) hasDigit = true;
      else hasSpecial = true;
    }
    return hasUpper && hasLower && hasDigit && hasSpecial;
  }

  private static String toCsvField(String value) {
    String normalized = value == null ? "" : value;
    String escaped = normalized.replace("\"", "\"\"");
    return "\"" + escaped + "\"";
  }

  private static String[] parseCsvRow(String row) {
    List<String> fields = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean inQuotes = false;

    for (int i = 0; i < row.length(); i++) {
      char c = row.charAt(i);
      if (c == '"') {
        if (inQuotes && i + 1 < row.length() && row.charAt(i + 1) == '"') {
          current.append('"');
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c == ',' && !inQuotes) {
        fields.add(current.toString());
        current.setLength(0);
      } else {
        current.append(c);
      }
    }

    fields.add(current.toString());
    return fields.toArray(new String[0]);
  }

  private static String readBody(HttpExchange exchange) throws IOException {
    String contentLengthHeader = exchange.getRequestHeaders().getFirst("Content-Length");
    if (contentLengthHeader != null) {
      try {
        int contentLength = Integer.parseInt(contentLengthHeader);
        if (contentLength > EFFECTIVE_MAX_REQUEST_BODY_BYTES) {
          throw new IOException("Request body too large");
        }
      } catch (NumberFormatException ignored) {
        // fallback to actual byte length check below
      }
    }
    try (InputStream in = exchange.getRequestBody()) {
      byte[] bytes = in.readAllBytes();
      if (bytes.length > EFFECTIVE_MAX_REQUEST_BODY_BYTES) {
        throw new IOException("Request body too large");
      }
      return new String(bytes, StandardCharsets.UTF_8);
    }
  }

  private static boolean requireJsonContentType(HttpExchange exchange) throws IOException {
    String contentType = exchange.getRequestHeaders().getFirst("Content-Type");
    if (contentType == null) {
      sendJson(exchange, 415, "{\"error\":\"unsupported_media_type\",\"message\":\"Content-Type must be application/json\"}");
      return false;
    }
    String normalized = contentType.trim().toLowerCase();
    if (!normalized.startsWith("application/json")) {
      sendJson(exchange, 415, "{\"error\":\"unsupported_media_type\",\"message\":\"Content-Type must be application/json\"}");
      return false;
    }
    return true;
  }

  private static String readBodyOrRespond(HttpExchange exchange) throws IOException {
    try {
      return readBody(exchange);
    } catch (IOException e) {
      sendJson(exchange, 413, "{\"error\":\"payload_too_large\"}");
      return null;
    }
  }

  private static boolean handleCorsPreflight(HttpExchange exchange) throws IOException {
    if (!"OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
      return false;
    }
    sendJson(exchange, 200, "{}");
    return true;
  }

  private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
    String allowedOrigin = resolveAllowedOrigin();
    String requestId = ensureRequestId(exchange);
    exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", allowedOrigin);
    exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    exchange.getResponseHeaders().set("X-Request-Id", requestId);
    exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    recordResponseMetrics(status, bytes.length);
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream out = exchange.getResponseBody()) {
      out.write(bytes);
    }
    logRequest(exchange, status, requestId);
  }

  private static void sendJsonWithHeaders(HttpExchange exchange, int status, String body, Map<String, String> extraHeaders) throws IOException {
    if (extraHeaders != null) {
      for (Map.Entry<String, String> entry : extraHeaders.entrySet()) {
        exchange.getResponseHeaders().set(entry.getKey(), entry.getValue());
      }
    }
    sendJson(exchange, status, body);
  }

  private static String resolveAllowedOrigin() {
    String configured = System.getenv(ENV_ALLOWED_ORIGIN);
    return configured == null || configured.isBlank() ? "*" : configured.trim();
  }

  private static String ensureRequestId(HttpExchange exchange) {
    String incoming = exchange.getRequestHeaders().getFirst("X-Request-Id");
    if (incoming == null || incoming.isBlank()) {
      return UUID.randomUUID().toString();
    }
    return incoming.trim();
  }

  private static void recordResponseMetrics(int status, int responseBytes) {
    totalRequests.incrementAndGet();
    cumulativeResponseBytes.addAndGet(Math.max(0, responseBytes));
    if (status >= 400 && status < 500) {
      status4xxResponses.incrementAndGet();
    } else if (status >= 500) {
      status5xxResponses.incrementAndGet();
    }
  }

  private static void logRequest(HttpExchange exchange, int status, String requestId) {
    String method = exchange.getRequestMethod();
    String path = exchange.getRequestURI().getPath();
    String remote = String.valueOf(exchange.getRemoteAddress());
    String event = "{" +
      "\"ts\":\"" + Instant.now() + "\"," +
      "\"requestId\":\"" + jsonEscape(requestId) + "\"," +
      "\"method\":\"" + jsonEscape(method) + "\"," +
      "\"path\":\"" + jsonEscape(path) + "\"," +
      "\"status\":" + status + "," +
      "\"remote\":\"" + jsonEscape(remote) + "\"" +
      "}";
    System.out.println(event);
  }

  private static void logServerError(String eventName, HttpExchange exchange, Throwable throwable) {
    String path = exchange == null ? "unknown" : String.valueOf(exchange.getRequestURI().getPath());
    String method = exchange == null ? "unknown" : String.valueOf(exchange.getRequestMethod());
    String remote = exchange == null ? "unknown" : String.valueOf(exchange.getRemoteAddress());
    logError(eventName, path, method, remote, throwable);
  }

  private static void logProcessError(String eventName, String threadName, Throwable throwable) {
    logError(eventName, "process", threadName, "n/a", throwable);
  }

  private static void logError(String eventName, String path, String method, String remote, Throwable throwable) {
    String throwableType = throwable == null ? "Unknown" : throwable.getClass().getSimpleName();
    String message = throwable == null ? "" : String.valueOf(throwable.getMessage());
    String event = "{" +
      "\"ts\":\"" + Instant.now() + "\"," +
      "\"event\":\"" + jsonEscape(eventName) + "\"," +
      "\"path\":\"" + jsonEscape(path) + "\"," +
      "\"method\":\"" + jsonEscape(method) + "\"," +
      "\"remote\":\"" + jsonEscape(remote) + "\"," +
      "\"errorType\":\"" + jsonEscape(throwableType) + "\"," +
      "\"errorMessage\":\"" + jsonEscape(message) + "\"" +
      "}";
    System.err.println(event);
  }

  private static String jsonValue(String json, String key) {
    Pattern p = Pattern.compile("\\\"" + Pattern.quote(key) + "\\\"\\s*:\\s*\\\"((?:\\\\.|[^\\\"\\\\])*)\\\"");
    Matcher m = p.matcher(json);
    if (!m.find()) {
      return "";
    }
    return jsonUnescape(m.group(1)).trim();
  }

  private static String jsonUnescape(String value) {
    StringBuilder out = new StringBuilder(value.length());
    for (int i = 0; i < value.length(); i++) {
      char c = value.charAt(i);
      if (c == '\\' && i + 1 < value.length()) {
        char next = value.charAt(i + 1);
        switch (next) {
          case '"' -> out.append('"');
          case '\\' -> out.append('\\');
          case 'n' -> out.append('\n');
          case 'r' -> out.append('\r');
          case 't' -> out.append('\t');
          default -> out.append(next);
        }
        i++;
      } else {
        out.append(c);
      }
    }
    return out.toString();
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

  private static int parsePort(String[] args) {
    if (args.length == 0) {
      String envPort = System.getenv("PORT");
      if (envPort == null || envPort.isBlank()) {
        return DEFAULT_PORT;
      }
      return parsePortValue(envPort);
    }
    return parsePortValue(args[0]);
  }

  private static int parsePortValue(String raw) {
    try {
      int parsed = Integer.parseInt(raw);
      if (parsed < 1 || parsed > 65535) {
        return DEFAULT_PORT;
      }
      return parsed;
    } catch (NumberFormatException ignored) {
      return DEFAULT_PORT;
    }
  }

  private static String jsonEscape(String value) {
    if (value == null) {
      return "";
    }
    return value
      .replace("\\", "\\\\")
      .replace("\"", "\\\"")
      .replace("\n", "\\n")
      .replace("\r", "\\r");
  }

  private static class SafeHandler implements HttpHandler {
    private final String name;
    private final HttpHandler delegate;

    private SafeHandler(String name, HttpHandler delegate) {
      this.name = name;
      this.delegate = delegate;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
      try {
        delegate.handle(exchange);
      } catch (IOException ioException) {
        logServerError("io_exception_" + name, exchange, ioException);
        throw ioException;
      } catch (Exception exception) {
        logServerError("handler_exception_" + name, exchange, exception);
        sendJson(exchange, 500, "{\"error\":\"internal_server_error\"}");
      }
    }
  }

  private static String extractBearerToken(HttpExchange exchange) {
    String auth = exchange.getRequestHeaders().getFirst("Authorization");
    if (auth == null) {
      return "";
    }
    String trimmed = auth.trim();
    if (!trimmed.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) {
      return "";
    }
    return trimmed.substring("Bearer ".length()).trim();
  }

  private static class HealthHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (handleCorsPreflight(exchange)) {
        return;
      }
      if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }
      cleanupExpiredSessions();
      cleanupExpiredLoginRateLimits();
      long uptimeSec = Math.max(0, TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis() - SERVER_STARTED_AT.toEpochMilli()));
      sendJson(exchange, 200, "{\"status\":\"ok\",\"service\":\"tahir-erp-java-server\",\"version\":\"" + jsonEscape(RELEASE_VERSION) + "\",\"uptimeSec\":" + uptimeSec + ",\"activeSessions\":" + sessionsByToken.size() + ",\"registeredUsers\":" + usersByEmail.size() + ",\"loginRateLimitedPrincipals\":" + failedLoginByPrincipal.size() + ",\"metrics\":{\"totalRequests\":" + totalRequests.get() + ",\"responses4xx\":" + status4xxResponses.get() + ",\"responses5xx\":" + status5xxResponses.get() + ",\"avgResponseBytes\":" + (totalRequests.get() == 0 ? 0 : (cumulativeResponseBytes.get() / totalRequests.get())) + "},\"housekeeping\":{\"runs\":" + housekeepingRuns.get() + ",\"lastRunEpochMs\":" + lastHousekeepingEpochMs.get() + "},\"config\":{\"sessionTtlSec\":" + EFFECTIVE_SESSION_TTL_SECONDS + ",\"maxRequestBodyBytes\":" + EFFECTIVE_MAX_REQUEST_BODY_BYTES + ",\"loginMaxAttempts\":" + EFFECTIVE_LOGIN_MAX_ATTEMPTS + ",\"loginAttemptWindowSec\":" + TimeUnit.MILLISECONDS.toSeconds(EFFECTIVE_LOGIN_ATTEMPT_WINDOW_MS) + ",\"loginLockoutSec\":" + TimeUnit.MILLISECONDS.toSeconds(EFFECTIVE_LOGIN_LOCKOUT_MS) + "}}");
    }
  }

  private static class RegisterHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (handleCorsPreflight(exchange)) {
        return;
      }
      if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }

      cleanupExpiredSessions();
      cleanupExpiredLoginRateLimits();
      if (!requireJsonContentType(exchange)) {
        return;
      }
      String body = readBodyOrRespond(exchange);
      if (body == null) {
        return;
      }
      String email = jsonValue(body, "email").toLowerCase();
      String fullName = jsonValue(body, "fullName");
      String password = jsonValue(body, "password");

      if (
        email.isBlank() ||
        fullName.isBlank() ||
        !isStrongPassword(password) ||
        fullName.length() > 120 ||
        email.length() > 254 ||
        !EMAIL_PATTERN.matcher(email).matches()
      ) {
        sendJson(exchange, 400, "{\"error\":\"invalid_input\",\"message\":\"email, fullName, and strong password are required\"}");
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
        "{\"id\":\"" + user.id + "\",\"email\":\"" + jsonEscape(user.email) + "\",\"fullName\":\"" + jsonEscape(user.fullName) + "\"}");
    }
  }

  private static class LoginHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (handleCorsPreflight(exchange)) {
        return;
      }
      if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }

      cleanupExpiredSessions();
      cleanupExpiredLoginRateLimits();
      if (!requireJsonContentType(exchange)) {
        return;
      }
      String body = readBodyOrRespond(exchange);
      if (body == null) {
        return;
      }
      String email = jsonValue(body, "email").toLowerCase();
      String password = jsonValue(body, "password");
      String principal = email + "|" + exchange.getRemoteAddress();

      if (isLoginRateLimited(principal)) {
        long retryAfterSeconds = loginRetryAfterSeconds(principal);
        sendJsonWithHeaders(exchange, 429, "{\"error\":\"too_many_attempts\",\"message\":\"Temporarily locked after repeated failed login attempts\"}", Map.of("Retry-After", String.valueOf(retryAfterSeconds)));
        return;
      }

      UserRecord user = usersByEmail.get(email);
      if (user == null || !user.passwordHash.equals(sha256(password))) {
        registerFailedLogin(principal);
        sendJson(exchange, 401, "{\"error\":\"invalid_credentials\"}");
        return;
      }

      clearFailedLogin(principal);

      String token = UUID.randomUUID().toString();
      sessionsByToken.put(token, new SessionRecord(token, user.id, user.email, user.fullName, Instant.now().toString()));

      sendJson(exchange, 200,
        "{\"token\":\"" + token + "\",\"user\":{\"id\":\"" + user.id + "\",\"email\":\"" + jsonEscape(user.email) + "\",\"fullName\":\"" + jsonEscape(user.fullName) + "\"}}"
      );
    }
  }

  private static class MeHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (handleCorsPreflight(exchange)) {
        return;
      }
      if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }

      cleanupExpiredSessions();
      String token = extractBearerToken(exchange);
      if (token.isBlank()) {
        sendJson(exchange, 401, "{\"error\":\"missing_token\"}");
        return;
      }
      SessionRecord session = sessionsByToken.get(token);
      if (session == null) {
        sendJson(exchange, 401, "{\"error\":\"invalid_token\"}");
        return;
      }

      sendJson(exchange, 200,
        "{\"id\":\"" + session.userId + "\",\"email\":\"" + jsonEscape(session.email) + "\",\"fullName\":\"" + jsonEscape(session.fullName) + "\",\"issuedAt\":\"" + session.issuedAt + "\"}"
      );
    }
  }

  private static class LogoutHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (handleCorsPreflight(exchange)) {
        return;
      }
      if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }

      String token = extractBearerToken(exchange);
      if (token.isBlank()) {
        sendJson(exchange, 401, "{\"error\":\"missing_token\"}");
        return;
      }
      sessionsByToken.remove(token);
      sendJson(exchange, 200, "{\"status\":\"logged_out\"}");
    }
  }

  private static class ChangePasswordHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
      if (handleCorsPreflight(exchange)) {
        return;
      }
      if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
        sendJson(exchange, 405, "{\"error\":\"method_not_allowed\"}");
        return;
      }

      cleanupExpiredSessions();
      String token = extractBearerToken(exchange);
      if (token.isBlank()) {
        sendJson(exchange, 401, "{\"error\":\"missing_token\"}");
        return;
      }

      SessionRecord session = sessionsByToken.get(token);
      if (session == null) {
        sendJson(exchange, 401, "{\"error\":\"invalid_token\"}");
        return;
      }

      if (!requireJsonContentType(exchange)) {
        return;
      }
      String body = readBodyOrRespond(exchange);
      if (body == null) {
        return;
      }

      String currentPassword = jsonValue(body, "currentPassword");
      String newPassword = jsonValue(body, "newPassword");
      if (currentPassword.isBlank() || !isStrongPassword(newPassword)) {
        sendJson(exchange, 400, "{\"error\":\"invalid_input\",\"message\":\"currentPassword and strong newPassword are required\"}");
        return;
      }

      UserRecord user = usersByEmail.get(session.email.toLowerCase());
      if (user == null || !user.passwordHash.equals(sha256(currentPassword))) {
        sendJson(exchange, 401, "{\"error\":\"invalid_credentials\"}");
        return;
      }

      UserRecord updated = new UserRecord(user.id, user.email, user.fullName, sha256(newPassword), user.createdAt);
      usersByEmail.put(user.email.toLowerCase(), updated);
      rewriteUsersCsv();

      sendJson(exchange, 200, "{\"status\":\"password_updated\"}");
    }
  }

  private static synchronized void rewriteUsersCsv() throws IOException {
    StringBuilder data = new StringBuilder("id,email,full_name,password_hash,created_at\n");
    for (UserRecord user : usersByEmail.values()) {
      data.append(String.join(",",
        toCsvField(user.id),
        toCsvField(user.email),
        toCsvField(user.fullName),
        toCsvField(user.passwordHash),
        toCsvField(user.createdAt)
      )).append("\n");
    }
    Files.writeString(USER_FILE, data.toString(), StandardCharsets.UTF_8);
  }

  private static void cleanupExpiredSessions() {
    Instant now = Instant.now();
    sessionsByToken.entrySet().removeIf(entry -> {
      SessionRecord session = entry.getValue();
      Instant issuedAt;
      try {
        issuedAt = Instant.parse(session.issuedAt);
      } catch (Exception ignored) {
        return true;
      }
      return issuedAt.plusSeconds(EFFECTIVE_SESSION_TTL_SECONDS).isBefore(now);
    });
  }

  private static boolean isLoginRateLimited(String principal) {
    FailedLoginState state = failedLoginByPrincipal.get(principal);
    if (state == null) {
      return false;
    }
    long now = System.currentTimeMillis();
    if (state.lockedUntilMs > now) {
      return true;
    }
    if (state.windowStartMs + EFFECTIVE_LOGIN_ATTEMPT_WINDOW_MS < now) {
      failedLoginByPrincipal.remove(principal);
      return false;
    }
    return false;
  }

  private static void cleanupExpiredLoginRateLimits() {
    long now = System.currentTimeMillis();
    failedLoginByPrincipal.entrySet().removeIf(entry -> {
      FailedLoginState state = entry.getValue();
      return state.lockedUntilMs <= now && state.windowStartMs + EFFECTIVE_LOGIN_ATTEMPT_WINDOW_MS < now;
    });
  }

  private static void registerFailedLogin(String principal) {
    long now = System.currentTimeMillis();
    failedLoginByPrincipal.compute(principal, (_key, prev) -> {
      if (prev == null || prev.windowStartMs + EFFECTIVE_LOGIN_ATTEMPT_WINDOW_MS < now) {
        return new FailedLoginState(1, now, 0);
      }
      int nextAttempts = prev.attempts + 1;
      long lockedUntil = nextAttempts >= EFFECTIVE_LOGIN_MAX_ATTEMPTS ? now + EFFECTIVE_LOGIN_LOCKOUT_MS : prev.lockedUntilMs;
      return new FailedLoginState(nextAttempts, prev.windowStartMs, lockedUntil);
    });
  }

  private static void clearFailedLogin(String principal) {
    failedLoginByPrincipal.remove(principal);
  }

  private record UserRecord(String id, String email, String fullName, String passwordHash, String createdAt) {}

  private record SessionRecord(String token, String userId, String email, String fullName, String issuedAt) {}

  private record FailedLoginState(int attempts, long windowStartMs, long lockedUntilMs) {}
}
