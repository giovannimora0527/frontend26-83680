# Credenciales de prueba por rol

Usuarios creados automáticamente al arrancar el backend con el perfil `dev`
(`DatosPruebaRunner`), solo si todavía no existen. No son credenciales reales.
Las claves se configuran en `backend/src/main/resources/application-dev.properties`.

| Rol | Usuario | Contraseña | Módulos en el menú |
|---|---|---|---|
| Administrador (`ADMIN`) | `admin` | `Admin.Prueba1` | Todos, incluido Perfiles y Menús |
| Recepción (`RECEPCIONISTA`) | `secretaria` | `Secretaria.Prueba1` | Citas, clientes, mascotas |
| Médico (`VETERINARIO`) | `veterinario` | `Veterinario.Prueba1` | Citas, historias, fórmulas, medicamentos |
| Despacho médico (`DESPACHO_MEDICO`) | `despacho` | `Despacho.Prueba1` | Medicamentos |

El usuario `veterinario` se enlaza con el primer médico que no tenga usuario.
Los menús de cada perfil se administran en la pantalla "Perfiles y Menús".
