FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

COPY java_server/src ./java_server/src

RUN mkdir -p /app/java_server/out \
  && javac -d /app/java_server/out $(find /app/java_server/src -type f -name '*.java')

EXPOSE 8085
CMD ["java", "-cp", "/app/java_server/out", "com.tahir.server.Main", "8085"]
