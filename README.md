# Clínica Veterinaria Uniminuto

Proyecto final de Programación Web Full Stack. Es un sistema para manejar una clínica veterinaria completa: clientes y mascotas, agenda de los veterinarios, atención médica con historia clínica, fórmulas, despacho de medicamentos con control de lotes, facturación con pagos y reportes en PDF y Excel.

Partimos del backend y la base de datos del segundo corte (estructura `api` → `apicontroller` → `service` → `serviceimpl` → `repository`, mismo context path y mismo manejo de errores) y sobre eso construimos los módulos que pedía el examen.

## Contenido

1. [Tecnologías](#1-tecnologías)
2. [Cómo ejecutarlo](#2-cómo-ejecutarlo)
3. [Usuarios de prueba](#3-usuarios-de-prueba)
4. [Módulos](#4-módulos)
5. [Perfiles y permisos](#5-perfiles-y-permisos)
6. [Guía de pruebas](#6-guía-de-pruebas)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Base de datos](#8-base-de-datos)
9. [API](#9-api)
10. [Decisiones de diseño](#10-decisiones-de-diseño)
11. [Problemas comunes](#11-problemas-comunes)

## 1. Tecnologías

| Capa | Herramientas |
|---|---|
| Frontend | Angular 19 (componentes standalone), Bootstrap 5.3, Bootstrap Icons, Font Awesome, FullCalendar 6, SweetAlert2 |
| Backend | Java 21, Spring Boot 4.0.4, Spring Data JPA, springdoc-openapi 3.0.2 (Swagger), Apache POI 5.3 (Excel), OpenPDF 2.0 (PDF), Commons CSV, BCrypt |
| Base de datos | MySQL 8.0 |
| Despliegue | Docker Compose con tres contenedores: MySQL, backend y nginx sirviendo el frontend |

## 2. Cómo ejecutarlo

### Opción A: Docker (la más rápida)

Solo se necesita Docker Desktop o Docker Engine con Compose v2. Desde la raíz del proyecto:

```bash
docker compose up -d --build
```

La primera vez tarda unos minutos porque compila el backend y el frontend. Cuando termine:

| Qué | Dónde |
|---|---|
| Aplicación | http://localhost:8081 |
| Swagger | http://localhost:8080/clinica/v1/swagger-ui.html |
| API | http://localhost:8080/clinica/v1 (también pasa por nginx en http://localhost:8081/clinica/v1) |
| MySQL | `localhost:3307`, base `clinica`, usuario `clinica`, clave `clinica_2026` |

MySQL corre `01_schema.sql` y `02_seed.sql` solo cuando el volumen está vacío. Para volver a los datos iniciales hay que borrar el volumen:

```bash
docker compose down -v
docker compose up -d --build
```

### Opción B: local, para desarrollo

Necesitas Java 21, Node 20 o superior y MySQL 8.

**1. Base de datos**

```bash
mysql -uroot -p < database/01_schema.sql
mysql -uroot -p < database/02_seed.sql
```

Los scripts crean la base `clinica` si no existe.

**2. Backend** (perfil `dev`, puerto 8080)

```bash
cd backend
./mvnw spring-boot:run
```

Por defecto se conecta con `root` / `1234`. Si tu MySQL tiene otra clave, usa las variables de entorno `DB_URL`, `DB_USER` y `DB_PASSWORD`:

```bash
DB_PASSWORD=miClave ./mvnw spring-boot:run
```

**3. Frontend** (puerto 4200)

```bash
cd frontend
npm install
npx ng serve
```

`proxy.conf.json` redirige `/clinica/v1` al backend en `localhost:8080`, así que no hay que configurar CORS.

### Pruebas automáticas

```bash
cd backend
./mvnw test
```

Prueban los cálculos que más se prestan para errores: cantidad formulada a partir de dosis, frecuencia y días, números en formato colombiano e internacional, fechas en varios formatos y los encabezados del archivo de carga masiva.

## 3. Usuarios de prueba

Las claves son solo para la demo y en la base están guardadas con BCrypt.

| Perfil | Usuario | Clave |
|---|---|---|
| Administrador | `admin` | `Admin2026*` |
| Recepción | `recepcion` | `Recepcion2026*` |
| Veterinario | `cperez`, `lgomez`, `arios` | `Medico2026*` |
| Despacho médico | `despacho` | `Despacho2026*` |

`cperez` es de medicina general y tiene citas hoy y mañana. `lgomez` (dermatología) y `arios` (cirugía) también tienen agenda. Las fechas de la semilla se calculan a partir del día en que se crea la base, así que siempre hay citas para hoy, lotes por vencer y lotes vencidos.

## 4. Módulos

**Clientes y mascotas.** Registro de propietarios (deben ser mayores de edad) y de sus mascotas con especie, raza, edad, sexo y peso. Desde el cliente se ven sus mascotas y su historial de facturas, y desde la mascota sus citas.

**Veterinarios y horarios.** Cada veterinario tiene una especialidad y franjas de atención por día de la semana. Esas franjas son las que se usan para validar las citas.

**Especialidades, tarifas e impuestos.** Los precios de consultas y procedimientos se configuran desde la aplicación. Cada cambio de valor o de impuesto queda en un historial con el usuario y la fecha.

**Citas.** Recepción las maneja en una lista con filtros. El veterinario tiene su propia agenda en calendario (mes, semana, día y lista), con colores por estado. En la agenda se puede:
- hacer clic en un espacio libre para agendar;
- arrastrar una cita para cambiarle la hora o estirarla para cambiar la duración, siempre con confirmación;
- consultar el detalle de cada cita.

No se permite agendar en el pasado, fuera del horario del veterinario ni encima de otra cita del mismo veterinario o de la misma mascota. Cada cambio de estado queda en la trazabilidad de la cita.

**Atención médica.** El veterinario inicia la atención desde la cita y diligencia la historia clínica: síntomas, examen, diagnóstico y tratamiento. También ve los antecedentes de la mascota, agrega servicios prestados y genera la prefactura en PDF.

**Fórmulas médicas.** Al formular, la cantidad se calcula sola con la dosis, la frecuencia y los días, y se muestra cuánto hay disponible. Cuando el veterinario confirma la fórmula, pasa a despacho. Se puede descargar en PDF.

**Inventario.** Medicamentos y productos con registro INVIMA, precios, stock mínimo y lotes con fecha de vencimiento. Arriba se muestran indicadores de agotados, bajo stock, próximos a vencer, lotes vencidos y pedidos por hacer. Todo movimiento de entrada o salida queda en el kardex con saldo anterior y nuevo.

**Carga masiva.** Recibe un archivo Excel o CSV y primero lo valida fila por fila sin guardar nada. Muestra cuáles filas están bien y cuáles tienen error, y deja descargar el informe de errores. Al confirmar, importa las filas válidas; cada fila va en su propia transacción, así que una que falle no tumba las demás. Cada cargue queda en un log.

**Despacho.** El encargado prepara la fórmula y el sistema le propone los lotes en orden FEFO (primero el que vence antes). Los lotes vencidos aparecen bloqueados. Si no hay existencias completas, la entrega queda parcial y la fórmula pendiente por disponibilidad. Un despacho se puede revertir con un motivo, y eso devuelve las unidades al inventario. Cada despacho genera un comprobante en PDF.

**Facturación y pagos.** Se facturan las atenciones terminadas con sus servicios y los productos ya dispensados. La factura acepta pagos parciales hasta quedar en cero. El administrador puede aplicar descuentos y anular pagos o facturas con un motivo; nada se borra.

**Reportes.** Ingresos por periodo, ingresos por veterinario, existencias y valorización, productos próximos a vencer, citas por periodo y otros. Todos se ven en pantalla y se descargan en PDF o Excel.

**Usuarios, perfiles y permisos.** El administrador crea usuarios y les asigna un perfil. En "Perfiles y permisos" decide qué menús ve cada perfil y puede activar o inactivar perfiles y menús.

**Detalles generales de la interfaz:**
- Las tablas largas tienen paginación (10, 25, 50 o 100 filas) y se ordenan haciendo clic en el encabezado de la columna.
- La búsqueda no distingue mayúsculas ni tildes: "maria lopez" encuentra a "María López".
- Si la sesión vence o el administrador inactiva al usuario, la aplicación vuelve al login y avisa que la sesión expiró.

## 5. Perfiles y permisos

Los menús que ve cada perfil están en la tabla `perfil_menu`, y el administrador puede cambiarlos desde la aplicación. Con la semilla quedan así:

| Módulo | Administrador | Recepción | Veterinario | Despacho |
|---|:-:|:-:|:-:|:-:|
| Clientes y mascotas | ✓ | ✓ | | |
| Gestión de citas (lista) | ✓ | ✓ | | |
| Mi agenda (calendario) | | | ✓ | |
| Historias clínicas | ✓ consulta | | ✓ | |
| Fórmulas médicas | | | ✓ | |
| Inventario | ✓ edita | | ✓ consulta | ✓ consulta |
| Despacho | | | | ✓ |
| Facturación | ✓ | ✓ | | |
| Veterinarios, especialidades y tarifas | ✓ | | | |
| Reportes | ✓ | | | |
| Usuarios, perfiles y permisos | ✓ | | | |

El menú no es la única barrera. Cada servicio del backend declara qué perfiles lo pueden usar (`@RequiereRol`), y el `AuthInterceptor` revisa el token y el perfil en cada petición. Por eso, aunque el administrador le asigne a un perfil un menú que no le corresponde, el backend sigue respondiendo 403 en los servicios que ese perfil no tiene permitidos.

Algunas reglas para no dañar el acceso:
- El perfil Administrador no se puede inactivar ni quedarse sin el menú de perfiles.
- Al inactivar un perfil, sus usuarios no pueden ingresar y las sesiones que tenían abiertas dejan de funcionar en la siguiente petición.
- Cada vez que se abre la aplicación, el frontend consulta `/auth/sesion` para traer el perfil y los menús vigentes, así que los cambios se ven sin esperar a que venza el token.

## 6. Guía de pruebas

Este es el recorrido que usamos para mostrar las evidencias del examen.

**1. Carga masiva (más de 50 registros)**
1. Entrar como `admin` → Inventario → Carga masiva.
2. Subir `database/carga_masiva_64_registros.xlsx` (o el `.csv`) → *Validar y previsualizar*.
3. Deben salir 55 filas válidas y 9 con error. Cada error está puesto a propósito: código muy corto, falta INVIMA, precio de venta menor al de compra, lote vencido, cantidad negativa, código repetido en el archivo, nombre que ya existe con otro código, impuesto que no existe y fecha de compra futura.
4. Descargar el informe de errores, confirmar la importación y revisar la pestaña *Log de cargues*.

**2. Agenda con calendario**
1. Entrar como `cperez` → Mi agenda médica.
2. Cambiar entre las vistas mes, semana, día y lista, y abrir una cita para ver su detalle.
3. Arrastrar una cita: pide confirmación antes de reprogramar.
4. Intentar agendar en un horario pasado, fuera de la disponibilidad o encima de otra cita. El sistema debe rechazarlo.
5. Con `recepcion`, el mismo módulo aparece como lista con filtros.

**3. Atención, fórmula y prefactura**
1. Como `cperez`, abrir la cita de hoy a las 16:00 (Max) → *Iniciar atención*.
2. Llenar la historia clínica y agregar un servicio.
3. Crear una fórmula nueva. La cantidad se calcula sola y se ve la disponibilidad.
4. *Confirmar y enviar a despacho* → descargar el PDF de la fórmula.
5. *Finalizar atención* → descargar la prefactura en PDF.

**4. Despacho y descuento de inventario**
1. Entrar como `despacho` → Despacho.
2. Preparar la fórmula `FM-000001` (viene en la semilla) o la que se acaba de crear. Se ven los lotes en orden FEFO, el lote vencido bloqueado y la Enrofloxacina agotada.
3. Confirmar la entrega. Si queda parcial, la fórmula pasa a pendiente por disponibilidad.
4. Descargar el comprobante en PDF.
5. En Inventario → Entradas y salidas aparece la salida con saldo anterior, saldo nuevo y la referencia al despacho.

**5. Facturación y pagos**
1. Entrar como `recepcion` → Facturación → *Atenciones por facturar* → *Facturar*.
2. Registrar un pago parcial y luego el resto, y descargar el PDF.
3. Con `admin`, probar el descuento, la anulación de un pago y la anulación de la factura.

**6. Reportes**
1. Como `admin` → Reportes, elegir uno → *Ver*.
2. Ordenar las columnas desde el encabezado y descargar en PDF y en Excel.

**7. Perfiles y permisos**
1. Como `admin` → Perfiles y permisos → Recepción. Quitarle "Facturación y pagos" y guardar.
2. Cerrar sesión y entrar con `recepcion`: ya no ve el menú, y si escribe `/inicio/facturacion` en la barra lo devuelve al inicio.
3. Abrir una ventana de incógnito (u otro navegador) e ingresar como `despacho`. Desde la ventana del admin, inactivar el perfil Despacho médico. En la siguiente acción de `despacho`, la aplicación lo devuelve al login con el aviso de sesión expirada.
4. Dejar todo como estaba.

**8. Seguridad del backend**
1. En Swagger, iniciar sesión como `despacho` y llamar `GET /factura/listar`: responde 403.
2. Llamar cualquier servicio sin token: responde 401.

## 7. Estructura del proyecto

```
.
├── backend/                 Spring Boot
│   └── src/main/java/com/uniminuto/clinica/
│       ├── api/             interfaces con las rutas y la documentación de Swagger
│       ├── apicontroller/   implementación de las interfaces (@RequiereRol por controlador)
│       ├── service/         contratos de la lógica de negocio
│       ├── serviceimpl/     lógica de negocio y transacciones
│       ├── repository/      Spring Data JPA
│       ├── entity/          tablas mapeadas
│       ├── models/          objetos de petición (Rq) y respuesta (Rs)
│       ├── security/        AuthInterceptor, @RequiereRol, contexto del usuario
│       ├── exception/       errores con su código HTTP (400, 401, 403, 404, 409)
│       └── utils/           PDF, Excel, validaciones, conversión de números y fechas
├── frontend/                Angular 19
│   └── src/app/
│       ├── core/            servicio de API, sesión, guards, interceptor, mensajes, tabla paginada
│       ├── shared/          modal, paginador, encabezado ordenable, formulario de cita, estado
│       ├── layout/          menú lateral y barra superior
│       └── pages/           un componente por módulo
├── database/                scripts SQL y archivos de prueba para la carga masiva
├── docs/                    API, modelo de datos y reglas de negocio
└── docker-compose.yml
```

Flujo de una petición:

```
Navegador → nginx (:8081) → /clinica/v1/* → Spring Boot (:8080)
              AuthInterceptor: valida el token y el perfil
              apicontroller → serviceimpl → repository → MySQL
```

Todo lo que mueve existencias (entradas de lote, carga masiva, despacho y su reversión) pasa por una sola clase, `InventarioMotor`. Esa clase bloquea el medicamento y luego el lote, siempre en ese orden, para que dos despachos al mismo tiempo no dejen saldos negativos ni se crucen entre sí.

## 8. Base de datos

| Archivo | Para qué |
|---|---|
| `01_schema.sql` | Crea las 34 tablas con llaves foráneas, restricciones CHECK e índices únicos |
| `02_seed.sql` | Perfiles, menús, usuarios, catálogos y datos de demostración |
| `03_migracion_desde_base.sql` | Opcional. Transforma la base que entregó el profesor (`menu`, `perfil`, `perfil_menu`, `medicamento`) al modelo nuevo |
| `carga_masiva_64_registros.xlsx` / `.csv` | Archivo de prueba con 55 filas válidas y 9 con error |
| `carga_masiva_54_validos.csv` | Archivo sin errores, para probar una importación completa |

Algunas reglas las garantiza la propia base y no solo el código:
- Una cita solo puede tener una factura activa (columna generada con índice único).
- Un producto dispensado se factura una sola vez.
- Las cantidades y los precios no pueden ser negativos (CHECK).
- No se puede repetir un nombre de usuario, ni el código o el nombre de un medicamento, ni el número de lote dentro del mismo producto.

El diagrama entidad-relación y la explicación de cada cambio frente a la base original están en [docs/MODELO_DATOS.md](docs/MODELO_DATOS.md).

## 9. API

Son 133 servicios bajo `/clinica/v1`, agrupados por módulo en Swagger. Para probarlos desde Swagger:
1. Llamar `POST /auth/login` con un usuario de la tabla de arriba.
2. Copiar el `token` de la respuesta.
3. Pegarlo en *Authorize*.

El listado completo con método, ruta y perfiles está en [docs/API.md](docs/API.md). Las reglas de negocio de cada módulo, y dónde se valida cada una, están en [docs/REGLAS_NEGOCIO.md](docs/REGLAS_NEGOCIO.md).

Todas las respuestas de error tienen la misma forma:

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "El horario solicitado no está dentro de la disponibilidad del veterinario (no atiende ese día).",
  "timestamp": "2026-11-19T10:42:05"
}
```

## 10. Decisiones de diseño

**Token opaco en vez de JWT.** El login genera un token aleatorio de 256 bits y lo guarda en `usuario_sesion` con su fecha de vencimiento (10 horas por defecto, configurable en `clinica.seguridad.horas-sesion`). Así cerrar sesión o inactivar un usuario invalida el token de inmediato, cosa que con un JWT sin lista negra no pasa.

**Nada se borra.** Clientes, mascotas, medicamentos, usuarios y tarifas se activan o inactivan. Facturas, pagos y despachos se anulan o revierten con un motivo. Así la trazabilidad y los reportes de periodos pasados no cambian.

**Paginación en el navegador.** Con los volúmenes de una clínica (cientos de registros, no millones), traer la lista una vez y paginar, ordenar y buscar en el navegador es más simple y se siente más rápido. Los listados con mucho volumen, como el kardex, el historial de despachos y los reportes, ya filtran por rango de fechas en el backend.

**Validar dos veces.** Los formularios validan en Angular para dar respuesta inmediata, pero la regla que manda es la del backend, y en los casos críticos también la base de datos.

## 11. Problemas comunes

| Síntoma | Causa probable |
|---|---|
| El backend no arranca y habla de `Access denied for user 'root'` | La clave de MySQL local no es `1234`. Usar `DB_PASSWORD` (ver sección 2) |
| El puerto 3307, 8080 u 8081 está ocupado | Otro servicio lo está usando. Cambiar el puerto de la izquierda en `docker-compose.yml` |
| En Docker no aparecen los datos nuevos de la semilla | El volumen ya existía. `docker compose down -v` y volver a levantar |
| "No hay conexión con el servidor" en el frontend | El backend no está corriendo, o `ng serve` se inició sin el proxy |
| El veterinario no puede agendar nada | No tiene horarios. Se registran en Gestión de médicos, con el botón del reloj |
| Las fechas salen corridas | El contenedor de MySQL y el backend usan `America/Bogota`. En local, revisar la zona horaria del servidor MySQL |
