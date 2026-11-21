# ---------- Compilación ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---------- Ejecución ----------
FROM eclipse-temurin:21-jre
ENV TZ=America/Bogota \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms256m -Xmx512m -Djava.awt.headless=true -Duser.timezone=America/Bogota"
WORKDIR /app
COPY --from=build /app/target/clinica-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
