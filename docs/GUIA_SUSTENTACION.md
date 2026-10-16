# Guía breve para la sustentación

## Recorrido de la arquitectura

1. **Controller**: recibe las peticiones HTTP y devuelve DTO o códigos HTTP. Ejemplos: `FormulaMedicaController`, `CitaController`, `HistoriaClinicaController`.
2. **Service**: concentra las reglas de negocio. Ejemplos: `CitaService` comprueba estados, fechas, pertenencia de mascotas y cruces de agenda; `FormulaMedicaService` comprueba las relaciones y la fecha de emisión.
3. **Repository**: ejecuta SQL con `JdbcTemplate`. La consulta puede combinar una tabla con sus catálogos para devolver los nombres que necesita la interfaz.
4. **DTO**: define exactamente qué recibe el backend y qué datos devuelve sin entregar la fila de base de datos directamente.
5. **GlobalExceptionHandler**: transforma errores de validación, negocio y ausencia de registros en una estructura JSON consistente.

## Ejemplo para explicar una petición

Al guardar una cita, Angular llama a `ClinicApiService.crearCita`. `CitaController` recibe el JSON y lo valida con Jakarta Validation. `CitaService` comprueba cliente, mascota, veterinario, fecha, estado y agenda. Si hay un cruce dentro de ±15 minutos responde con `409 Conflict`; en caso válido `CitaRepository` inserta el registro y devuelve el identificador. El controlador responde `201 Created`.

## Preguntas que debes poder responder

- ¿Por qué hay Controller, Service y Repository separados?
- ¿Por qué el backend vuelve a validar las relaciones aunque el combo Angular filtre mascotas?
- ¿Cómo se evita que una mascota tenga dos citas simultáneas?
- ¿Por qué una fórmula se inactiva y no se borra físicamente?
- ¿Por qué una historia solo se registra desde una cita atendida?
- ¿Qué diferencias hay entre `400`, `404` y `409`?
- ¿Qué columnas se agregaron con `migracion_parcial.sql` y qué limitaciones tenía el esquema original?
- ¿Cómo probarías el error cuando el backend está apagado?

## No afirmar sin probar

Antes de sustentar, compila ambos proyectos, levanta MySQL, aplica la migración y ejecuta los flujos de `README.md`. Si alguno falla, corrige o declara esa limitación de forma honesta: la comprensión del código también forma parte de la evaluación.
