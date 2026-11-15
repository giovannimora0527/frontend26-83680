# Clínica Veterinaria Uniminuto

Sistema web full stack para la gestión administrativa, médica y financiera de una clínica veterinaria:
- inventario con lotes y carga masiva;
- citas con calendario;
- atención médica y fórmulas;
- despacho de medicamentos;
- tarifas y facturación;
- reportes en PDF y Excel.

Proyecto del examen final de Programación Web Full Stack (Ingeniería de Sistemas, Uniminuto).

## Inicio rápido

```bash
docker compose up --build
```

- Aplicación: <http://localhost:4200>
- API y Swagger: <http://localhost:8080/clinica/v1/swagger-ui.html>
- Usuarios de prueba por rol: [docs/CREDENCIALES_PRUEBA.md](docs/CREDENCIALES_PRUEBA.md)

Para ejecutarlo sin Docker, siga [docs/DOCUMENTACION_TECNICA.md](docs/DOCUMENTACION_TECNICA.md).

## Documentación

| Documento | Contenido |
|---|---|
| [Documentación técnica](docs/DOCUMENTACION_TECNICA.md) | Instalación, arquitectura, servicios de la API, reglas de negocio y evidencias |
| [Modelo de datos](docs/MODELO_DATOS.md) | Diagrama entidad-relación, restricciones y justificación de los cambios |
| [Credenciales de prueba](docs/CREDENCIALES_PRUEBA.md) | Usuarios por rol (no son credenciales reales) |
| `backend/database/` | Script completo (`clinica.sql`), migraciones y archivo de ejemplo de carga masiva |

## Estructura

```text
├── src/                 Frontend Angular 19
├── backend/             Backend Spring Boot 4 (Java 21) y scripts SQL
├── docker/              Configuración de Nginx
├── docs/                Documentación técnica
├── Dockerfile           Imagen del frontend
└── docker-compose.yml   MySQL + backend + frontend
```

## Créditos

La interfaz parte de la plantilla gratuita [Datta Able Angular](https://github.com/codedthemes/datta-able-free-angular-admin-template)
(licencia MIT, ver `LICENSE`).
