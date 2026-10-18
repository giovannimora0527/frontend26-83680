# backend2026-80869
Backend para una clínica veterinaria (Spring Boot 4, Java 21, MySQL).

## Ejecutar
1. Crear la base de datos con `database/clinica.sql` (esquema + datos de ejemplo).
2. Ajustar usuario y contraseña en `src/main/resources/application-dev.properties`.
3. `./mvnw spring-boot:run` → API en `http://localhost:8080/clinica/v1`.

## Endpoints principales
| Recurso | Endpoints |
|---|---|
| Cliente | `GET /cliente/listar`, `GET /cliente/obtener/{id}` |
| Mascota | `GET /mascota/listar`, `GET /mascota/listar-by-cliente?clienteId=`, `GET /mascota/obtener/{id}`, `POST /mascota/guardar`, `POST /mascota/actualizar` |
| Médico / Medicamento | `GET /medico/listar`, `GET /medicamento/listar` |
| Cita | `GET /cita/listar`, `GET /cita/obtener/{id}`, `POST /cita/crear`, `PUT /cita/actualizar/{id}`, `PATCH /cita/cambiar-estado/{id}`, `PATCH /cita/reactivar/{id}` |
| Historia clínica | `GET /historia/listar`, `GET /historia/obtener/{id}`, `POST /historia/crear`, `PATCH /historia/cerrar/{id}` |
| Anotación | `GET /anotacion/listar`, `GET /anotacion/obtener/{id}`, `POST /anotacion/crear` |
| Fórmula | `GET /formula/listar`, `GET /formula/obtener/{id}`, `POST /formula/crear`, `PUT /formula/actualizar/{id}`, `PATCH /formula/inactivar/{id}` |

Más detalle en el documento técnico entregado con el parcial.
