# Segundo parcial — Clínica Veterinaria

Entrega de trabajo para revisión basada en el frontend Angular trabajado en clase, el esquema SQL suministrado y los requisitos del Segundo Parcial de Programación Web.

## Contenido

- `frontend/`: aplicación Angular con módulos de fórmulas médicas, citas e historias clínicas/anotaciones conectados a la API REST.
- `backend/`: API Spring Boot con controladores, servicios, repositorios JDBC, DTO y manejo global de errores.
- `database/clinica_base_sin_credenciales.sql`: base original de trabajo sin filas de sesiones ni usuarios que contuvieran material de autenticación.
- `database/migracion_parcial.sql`: columnas adicionales e índices que exige el segundo parcial.
- `docs/ENDPOINTS_Y_REGLAS.md`: contratos de API, reglas implementadas y decisiones de datos.
- `docs/GUIA_SUSTENTACION.md`: recorrido técnico sugerido para explicar la solución.

## Importante antes de ejecutar

El modelo de datos que se suministró originalmente no contenía todos los campos de historias clínicas, anotaciones y fórmulas requeridos. Por eso la migración es parte de la entrega. Debe aplicarse después de importar el SQL base y una sola vez.

El código fuente está preparado para uso local, pero esta ejecución del entorno de trabajo no dispone de Maven ni pudo descargar paquetes npm, por lo que **no se pudo certificar aquí una compilación completa**. Antes de subir esta versión final a GitHub, abre los proyectos en tu equipo, compila y ejecuta las pruebas indicadas más abajo. No presentes como probado un flujo que no hayas ejecutado.

## 1. Preparar MySQL

1. En MySQL Workbench, crea/selecciona la base `clinica`.
2. Importa `database/clinica_base_sin_credenciales.sql`.
3. Ejecuta completo `database/migracion_parcial.sql` una sola vez.
4. La base de trabajo original incluye operaciones `DROP TABLE`; revisa el script y no lo ejecutes sobre una base que contenga datos que debas conservar.

La migración añade los campos que el esquema previo no tenía para frecuencia, duración, fecha de emisión, inactivación lógica de fórmula, vínculo de historia con cita/veterinario, fecha de consulta, diagnóstico y observaciones. El campo `fecha_creacion_registro` continúa siendo la fecha de auditoría del registro. Las filas históricas reciben una fecha de emisión inicial que nunca queda antes de su cita; esta regla está explicada dentro del SQL.

## 2. Ejecutar backend

Requisitos: JDK 21 y Maven 3.9 o compatible.

En PowerShell, desde la carpeta `backend`:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "TU_CLAVE_MYSQL"
mvn spring-boot:run
```

Si MySQL no tiene contraseña, puedes dejar `DB_PASSWORD` vacío. La API escucha en `http://localhost:8080/clinica/v1`. Si tienes una clave con caracteres especiales, asígnala directamente a la variable de entorno; no la guardes en el repositorio.

## 3. Ejecutar frontend

Requisitos: Node.js LTS/npm compatibles con Angular 19. Desde `frontend`:

```powershell
npm install
npm start
```

Abre la URL que indica Angular, normalmente `http://localhost:4200`. El archivo `src/environments/environment.ts` define la base de la API como `http://localhost:8080/clinica/v1`.

## 4. Flujos mínimos para probar

1. Abre **Fórmulas médicas** y confirma que la tabla carga los registros de MySQL. Crea una fórmula con fecha de emisión igual o posterior a la cita; luego prueba una fecha anterior (debe responder HTTP 400).
2. Abre **Citas médicas**. Selecciona un cliente y comprueba que el combo de mascotas solo muestra sus mascotas. Crea una cita futura.
3. Intenta crear dos citas del mismo veterinario con 15 minutos o menos de separación, o dos citas de la misma mascota en ese margen. La API debe rechazar el cruce.
4. Prueba los estados Pendiente, Confirmada, Atendida, Cancelada y Programada. Las citas canceladas y atendidas no se pueden editar por la operación normal `PUT`.
5. Marca una cita como Atendida. En **Historias clínicas**, registra una historia usando esa cita. El combo solo muestra citas atendidas de la mascota seleccionada y que todavía no tengan historia.
6. En “Ver historial”, agrega una anotación, filtra el histórico, abre el detalle y prueba editarla.
7. Detén el backend y confirma que Angular muestra un mensaje de conexión claro, luego vuelve a iniciarlo.

## Estado de la entrega

- Interfaz: módulos principales conectados a los contratos de API de Spring Boot.
- Backend: endpoints REST, validaciones de entrada, reglas de negocio, capas y manejo de errores implementados en código fuente.
- Base de datos: incluye SQL base y migración requeridos.
- **Pendiente de tu validación local**: confirmar compilación real, disponibilidad de la conexión MySQL y ejecución manual de los flujos anteriores. Tras validar, haz commit y push en tu rama del repositorio del profesor.


## Referencia visual del docente
La pantalla Gestión de citas fue ajustada para aproximarse a la captura de referencia: fondo claro, tabla blanca con filas alternas, estados con badges y botones Ver/Editar. Consulta `docs/REFERENCIA_VISUAL_Y_INTEGRACION.md` para la decisión sobre el ZIP del compañero y las verificaciones pendientes.
