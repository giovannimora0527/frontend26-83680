# Endpoints y reglas de negocio

Base URL local: `http://localhost:8080/clinica/v1`

## Fórmulas médicas

| Método | Ruta | Función |
|---|---|---|
| GET | `/formulas-medicas` | Lista las fórmulas activas por fecha de emisión descendente. |
| GET | `/formulas-medicas/{id}` | Consulta detalle completo. |
| POST | `/formulas-medicas` | Registra fórmula y retorna HTTP 201. |
| PUT | `/formulas-medicas/{id}` | Actualiza los campos permitidos. |
| PATCH | `/formulas-medicas/{id}/inactivar` | Inactivación lógica, sin eliminación física. |

Campos de escritura: `citaId`, `medicamentoId`, `fechaEmision` (`yyyy-MM-dd'T'HH:mm:ss`), `dosis`, `frecuencia`, `duracionTratamiento`, `indicaciones`.

Reglas verificadas: la cita y el medicamento existen; el cliente está activo; la mascota pertenece al cliente de la cita; existe el veterinario de la cita; fecha de emisión no anterior a la consulta; dosis, frecuencia y duración son obligatorias.

## Citas

| Método | Ruta | Función |
|---|---|---|
| GET | `/citas` | Lista todas las citas por fecha/hora descendente. |
| GET | `/citas?fechaInicial=YYYY-MM-DD&fechaFinal=YYYY-MM-DD` | Lista citas del rango inclusive. Deben enviarse las dos fechas. |
| GET | `/citas/{id}` | Consulta una cita. |
| POST | `/citas` | Crea una cita y retorna HTTP 201. |
| PUT | `/citas/{id}` | Actualiza una cita editable. |

Estados aceptados (se normalizan a minúsculas al guardar): `Pendiente`, `Confirmada`, `Atendida`, `Cancelada`, `Programada`.

Reglas: cliente activo; mascota existente y perteneciente al cliente; veterinario existente; creación en fecha no pasada; no hay otra cita activa del mismo veterinario ni de la misma mascota dentro de ±15 minutos; no se edita una cita cancelada o atendida por el `PUT` normal; no se marca como atendida una cita futura. Las citas canceladas no producen conflicto de agenda.

## Historias clínicas y anotaciones

| Método | Ruta | Función |
|---|---|---|
| GET | `/historias-clinicas` | Lista historias por fecha de consulta descendente. |
| GET | `/historias-clinicas?fechaInicial=YYYY-MM-DD&fechaFinal=YYYY-MM-DD` | Filtra historias por rango inclusive. |
| GET | `/historias-clinicas/{id}` | Consulta detalle. |
| POST | `/historias-clinicas` | Crea historia relacionada con una cita atendida. |
| GET | `/historias-clinicas/{id}/anotaciones` | Obtiene el histórico por fecha descendente. |
| POST | `/historias-clinicas/{id}/anotaciones` | Agrega una anotación al histórico. |
| GET | `/anotaciones-historia` | Lista anotaciones y permite filtrar por fechas. |
| GET | `/anotaciones-historia/{id}` | Consulta detalle de anotación. |
| POST | `/anotaciones-historia` | Crea anotación por endpoint general. |
| PUT | `/anotaciones-historia/{id}` | Actualiza anotación. |

Reglas: cliente, mascota, cita y veterinario deben existir y corresponder; solo se crea historia a partir de una cita atendida; una cita puede tener como máximo una historia; anotación asociada a historia y veterinario existente; fecha de anotación no anterior a la consulta. El detalle de historia incluye el histórico de anotaciones.

## Catálogos de apoyo

| Método | Ruta | Función |
|---|---|---|
| GET | `/clientes` | Clientes activos. |
| GET | `/clientes/{id}` | Detalle de cliente. |
| GET | `/mascotas?clienteId={id}` | Mascotas de un cliente para combo dependiente. |
| GET | `/mascotas/{id}` | Detalle de mascota. |
| GET | `/medicos` | Veterinarios. |
| GET | `/medicamentos` | Medicamentos. |

## Códigos HTTP principales

- `200 OK`: consulta o actualización correcta.
- `201 Created`: registro nuevo.
- `204 No Content`: inactivación lógica correcta.
- `400 Bad Request`: validación de campos o regla de negocio incorrecta.
- `404 Not Found`: recurso inexistente.
- `409 Conflict`: choque de agenda, cita no editable, registro duplicado o violación de integridad.
- `503 Service Unavailable`: fallo al acceder a la base de datos.
- `500 Internal Server Error`: error no esperado, con mensaje genérico para evitar filtrar detalles técnicos.

## Decisiones técnicas relevantes

- Backend: Spring Boot, `JdbcTemplate` y MySQL. Controlador atiende HTTP; servicio concentra reglas; repositorio ejecuta SQL; DTO delimita las entradas y respuestas.
- Frontend: Angular 19 y servicio `ClinicApiService` como punto único de consumo REST. Los listados aplican filtros, ordenamiento y paginación en el navegador sobre los datos devueltos por la API.
- Las reglas críticas se vuelven a verificar en Spring Boot y no dependen solo de los controles del formulario.
- La base original no declaraba claves foráneas y los tipos de IDs varían entre tablas; se valida la coherencia en servicios para no modificar a ciegas el modelo existente. La migración agrega índices y una restricción única para impedir más de una historia por cita.
- El enunciado no define un endpoint de eliminación. Para fórmulas se ofrece `PATCH /inactivar`, que conserva el registro clínico.
