# Backend de la clínica (Spring Boot 4, Java 21).
# Etapa 1: compila el proyecto con Maven.
FROM maven:3.9-eclipse-temurin-21 AS compilacion
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# Etapa 2: imagen liviana solo con el JRE y el JAR.
FROM eclipse-temurin:21-jre
WORKDIR /app
ENV TZ=America/Bogota \
    JAVA_TOOL_OPTIONS="-Duser.timezone=America/Bogota"
COPY --from=compilacion /app/target/clinica-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
