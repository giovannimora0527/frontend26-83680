# Credenciales de prueba por rol

Usuarios creados automáticamente al arrancar el backend con el perfil `dev`
(`DatosPruebaRunner`), solo si todavía no existen. No son credenciales reales.
Las claves se configuran en `backend/src/main/resources/application-dev.properties`.

| Rol | Usuario | Contraseña | Módulos en el menú |
|---|---|---|---|
| Administrador (`ADMIN`) | `admin` | `Admin.Prueba1` | Todos: usuarios, perfiles y menús, catálogos, citas, inventario y carga masiva, tarifas, facturación (descuentos y anulación) y todos los reportes |
| Recepción (`RECEPCIONISTA`) | `secretaria` | `Secretaria.Prueba1` | Citas (módulo de gestión), clientes, mascotas, facturación y pagos, reportes de gestión médica |
| Médico (`VETERINARIO`) | `veterinario` | `Veterinario.Prueba1` | Mi calendario, atención médica, historias, fórmulas, medicamentos (consulta) |
| Despacho médico (`DESPACHO_MEDICO`) | `despacho` | `Despacho.Prueba1` | Despacho de medicamentos, medicamentos (consulta) |

El usuario `veterinario` se enlaza con el primer médico que no tenga usuario.
Los menús de cada perfil se administran en la pantalla "Perfiles y Menús".

Los permisos también se validan en el backend (`config/SeguridadConfig`): aunque
alguien llame un servicio directamente, recibe 403 si su perfil no lo tiene.
Para probar la API en Swagger (`/clinica/v1/swagger-ui.html`): ejecutar
`POST /auth/login` con uno de estos usuarios, copiar el token y pegarlo en "Authorize".
