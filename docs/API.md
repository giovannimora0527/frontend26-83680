# Documentación de la API REST

Total de endpoints: **133**.  
Base: `http://localhost:8080/clinica/v1` (en Docker también vía `http://localhost:8081/clinica/v1`).  
Swagger UI: `http://localhost:8080/clinica/v1/swagger-ui.html` · OpenAPI JSON: `/clinica/v1/v3/api-docs`.

**Autenticación:** `POST /auth/login` devuelve un token. Enviarlo en cada petición como `Authorization: Bearer <token>`. En Swagger use el botón *Authorize*. Los perfiles de la columna *Perfiles* se validan en el backend (`@RequiereRol` + `AuthInterceptor`); una petición sin token responde **401** y con un perfil no autorizado **403**.

Respuesta de escritura: `{"status":201,"message":"...","id":15}` · Error: `{"status":409,"error":"Conflict","message":"...","timestamp":"..."}`

## 00. Estado del servicio

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/clinica/test` | Verifica que el servicio esté arriba (público) | Público |

## 01. Autenticación

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| POST | `/auth/login` | Inicia sesión y devuelve el token Bearer y los menús del perfil (público) | Público |
| POST | `/auth/logout` | Cierra la sesión actual (invalida el token) | Cualquier usuario autenticado |
| GET | `/auth/sesion` | Usuario autenticado y menús de su perfil | Cualquier usuario autenticado |

## 02. Usuarios y perfiles

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/usuario/listar` | Lista los usuarios | ADMIN |
| GET | `/usuario/perfiles` | Lista los perfiles (roles) del sistema | ADMIN |
| POST | `/usuario/guardar` | Crea un usuario. Perfil MEDICO exige medicoId | ADMIN |
| PUT | `/usuario/actualizar` | Actualiza un usuario (password opcional) | ADMIN |
| PATCH | `/usuario/cambiar-estado` | Activa o inactiva un usuario | ADMIN |
| GET | `/perfil/listar` | Perfiles con usuarios activos y menús asignados | ADMIN |
| GET | `/perfil/menus` | Todos los menús (activos e inactivos) | ADMIN |
| PUT | `/perfil/menus` | Reemplaza los menús de un perfil. Body: `{ perfilId, menuIds }` | ADMIN |
| PATCH | `/perfil/cambiar-estado` | Activa o inactiva un perfil (ADMIN no se puede inactivar) | ADMIN |
| PATCH | `/perfil/menu/cambiar-estado` | Activa o inactiva un menú para todos los perfiles | ADMIN |

## 03. Clientes (propietarios)

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/cliente/listar` | Lista los clientes | ADMIN, RECEPCION, MEDICO |
| GET | `/cliente/consultar` | Consulta un cliente por id | ADMIN, RECEPCION, MEDICO |
| GET | `/cliente/buscar-por-documento` | Busca un cliente por número de documento | ADMIN, RECEPCION, MEDICO |
| POST | `/cliente/guardar` | Registra un cliente | ADMIN, RECEPCION |
| PUT | `/cliente/actualizar` | Actualiza un cliente | ADMIN, RECEPCION |
| PATCH | `/cliente/cambiar-estado` | Activa o inactiva un cliente | ADMIN, RECEPCION |

## 04. Razas

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/raza/listar` | Lista las razas | ADMIN, RECEPCION, MEDICO |
| POST | `/raza/guardar` | Registra una raza | ADMIN, RECEPCION |
| PUT | `/raza/actualizar` | Actualiza una raza | ADMIN, RECEPCION |

## 05. Mascotas (pacientes)

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/mascota/listar` | Lista las mascotas | ADMIN, RECEPCION, MEDICO |
| GET | `/mascota/listar-ordenado` | Lista las mascotas ordenadas por nombre | ADMIN, RECEPCION, MEDICO |
| GET | `/mascota/buscar-nombre` | Busca mascotas por nombre (contiene) | ADMIN, RECEPCION, MEDICO |
| GET | `/mascota/buscar-by-cliente` | Mascotas de un cliente | ADMIN, RECEPCION, MEDICO |
| GET | `/mascota/buscar-by-raza` | Mascotas de una raza | ADMIN, RECEPCION, MEDICO |
| GET | `/mascota/consultar` | Consulta una mascota | ADMIN, RECEPCION, MEDICO |
| POST | `/mascota/guardar` | Registra una mascota | ADMIN, RECEPCION |
| PUT | `/mascota/actualizar` | Actualiza una mascota | ADMIN, RECEPCION |
| PATCH | `/mascota/cambiar-estado` | Activa o inactiva una mascota | ADMIN, RECEPCION |

## 06. Especialidades

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/especializacion/listar` | Lista las especialidades (soloActivas=true para combos) | ADMIN, RECEPCION, MEDICO |
| POST | `/especializacion/crear` | Crea una especialidad (ADMIN) | ADMIN |
| PUT | `/especializacion/actualizar` | Actualiza una especialidad (ADMIN) | ADMIN |
| PATCH | `/especializacion/cambiar-estado` | Activa o inactiva una especialidad (ADMIN) | ADMIN |

## 07. Veterinarios y horarios de disponibilidad

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/medico/listar` | Lista los veterinarios (soloActivos=true para asignar citas) | ADMIN, RECEPCION, MEDICO |
| GET | `/medico/consultar` | Consulta un veterinario | ADMIN, RECEPCION, MEDICO |
| GET | `/medico/listar-disponibles` | Veterinarios activos sin citas en el rango (ISO yyyy-MM-ddTHH:mm:ss) | ADMIN, RECEPCION, MEDICO |
| POST | `/medico/crear` | Registra un veterinario (ADMIN) | ADMIN |
| PUT | `/medico/actualizar` | Actualiza un veterinario (ADMIN) | ADMIN |
| PATCH | `/medico/cambiar-estado` | Activa o inactiva un veterinario (ADMIN). No permite inactivar con citas futuras | ADMIN |
| GET | `/medico/horarios` | Horarios de disponibilidad del veterinario | ADMIN, RECEPCION, MEDICO |
| PUT | `/medico/horarios` | Reemplaza los horarios de disponibilidad (ADMIN) | ADMIN |

## 08. Tarifas e impuestos

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/tarifa/listar` | Lista las tarifas (soloActivas=true para atención/facturación) | ADMIN, RECEPCION, MEDICO |
| GET | `/tarifa/consultar` | Consulta una tarifa | ADMIN, RECEPCION, MEDICO |
| POST | `/tarifa/crear` | Crea una tarifa (ADMIN) | ADMIN |
| PUT | `/tarifa/actualizar` | Actualiza una tarifa (ADMIN). Registra el cambio en el log de tarifas | ADMIN |
| PATCH | `/tarifa/cambiar-estado` | Activa o inactiva una tarifa (ADMIN) | ADMIN |
| GET | `/tarifa/historial` | Log (historial) de cambios de tarifas; tarifaId opcional | ADMIN |
| GET | `/tarifa/impuestos` | Lista los impuestos configurados | ADMIN, RECEPCION, MEDICO |
| POST | `/tarifa/impuestos` | Crea un impuesto (ADMIN) | ADMIN |
| PUT | `/tarifa/impuestos` | Actualiza un impuesto (ADMIN) | ADMIN |
| PATCH | `/tarifa/impuestos/cambiar-estado` | Activa o inactiva un impuesto (ADMIN) | ADMIN |

## 09. Inventario de medicamentos y productos

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/medicamento/listar` | Lista el inventario. filtro: TODOS, DISPONIBLES, AGOTADOS, BAJO_STOCK, PROXIMOS_VENCER, VENCIDOS, INACTIVOS | ADMIN, DESPACHO_MEDICO, MEDICO |
| GET | `/medicamento/consultar` | Consulta un producto con sus indicadores de inventario | ADMIN, DESPACHO_MEDICO, MEDICO |
| GET | `/medicamento/alertas` | Alertas: agotados, bajo stock, próximos a vencer, con lotes vencidos, pedidos pendientes | ADMIN, DESPACHO_MEDICO, MEDICO |
| POST | `/medicamento/crear` | Registra un producto (opcional lote inicial) - ADMIN | ADMIN |
| PUT | `/medicamento/actualizar` | Edita datos y precios de un producto (no las cantidades) - ADMIN | ADMIN |
| PATCH | `/medicamento/cambiar-estado` | Activa o inactiva un producto - ADMIN | ADMIN |
| GET | `/medicamento/lotes` | Lotes del producto (soloConExistencia=true ordena FEFO) | ADMIN, DESPACHO_MEDICO, MEDICO |
| POST | `/medicamento/lotes` | Ingresa un lote (entrada por compra) - ADMIN | ADMIN |
| GET | `/medicamento/movimientos` | Historial de entradas y salidas (kardex). medicamentoId y tipo opcionales | ADMIN, DESPACHO_MEDICO |
| GET | `/medicamento/carga-masiva/plantilla` | Descarga la plantilla Excel de carga masiva - ADMIN | ADMIN |
| POST | `/medicamento/carga-masiva/previsualizar` | Sube un .xlsx/.csv, valida y devuelve la vista previa (no afecta inventario) - ADMIN | ADMIN |
| POST | `/medicamento/carga-masiva/confirmar` | Confirma la importación de los registros válidos - ADMIN | ADMIN |
| POST | `/medicamento/carga-masiva/cancelar` | Cancela una carga en vista previa - ADMIN | ADMIN |
| GET | `/medicamento/carga-masiva/detalle` | Detalle (filas) de una carga - ADMIN | ADMIN |
| GET | `/medicamento/carga-masiva/historial` | Log de cargues: fecha, usuario, totales - ADMIN | ADMIN |
| GET | `/medicamento/carga-masiva/errores` | Informe de errores (Excel) con fila y motivo del rechazo - ADMIN | ADMIN |

## 10. Citas médicas y calendario

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/cita/listar` | Lista citas (módulo de recepción). Filtros opcionales: fechas, veterinario, estado | ADMIN, RECEPCION |
| GET | `/cita/listar-rango` | Citas en un rango de fecha-hora (ISO) | ADMIN, RECEPCION |
| GET | `/cita/agenda` | Calendario: citas del veterinario autenticado (perfil MEDICO) entre inicio y fin | MEDICO |
| GET | `/cita/consultar` | Consulta una cita | ADMIN, RECEPCION, MEDICO |
| GET | `/cita/listar-por-mascota` | Historial de citas de una mascota | ADMIN, RECEPCION, MEDICO |
| GET | `/cita/historial` | Trazabilidad de una cita (creación, cambios de estado, reprogramaciones) | ADMIN, RECEPCION, MEDICO |
| GET | `/cita/estados` | Catálogo de estados de cita con su color | ADMIN, RECEPCION, MEDICO |
| GET | `/cita/resumen-estados` | Conteo de citas por estado (MEDICO: sólo las suyas) | ADMIN, RECEPCION, MEDICO |
| POST | `/cita/crear` | Registra una cita (valida horario, superposición y estado del veterinario) | ADMIN, RECEPCION, MEDICO |
| PUT | `/cita/actualizar` | Edita una cita (no aplica a atendidas, canceladas o en atención) | ADMIN, RECEPCION, MEDICO |
| PATCH | `/cita/reprogramar` | Cambia fecha/hora (arrastrar y soltar en el calendario) | ADMIN, RECEPCION, MEDICO |
| PATCH | `/cita/cambiar-estado` | Cambia el estado: PENDIENTE, PROGRAMADA, CONFIRMADA o CANCELADA (con motivo) | ADMIN, RECEPCION, MEDICO |
| PATCH | `/cita/reactivar` | Reactiva una cita cancelada (vuelve a validar el horario) | ADMIN, RECEPCION, MEDICO |
| GET | `/cita/reporte-excel` | Reporte Excel de citas del veterinario entre fechas (MEDICO: las propias) | ADMIN, RECEPCION, MEDICO |
| GET | `/cita/reporte-pdf` | Reporte PDF de citas del veterinario entre fechas | ADMIN, RECEPCION, MEDICO |

## 11. Atención médica

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/atencion/cita` | Datos de la atención: cita, mascota, propietario, historia, servicios, fórmulas y antecedentes | MEDICO |
| POST | `/atencion/iniciar` | Inicia la atención (cita EN_ATENCION + historia ABIERTA) - MEDICO de la cita | MEDICO |
| PUT | `/atencion/historia` | Guarda motivo, síntomas, diagnóstico, observaciones y recomendaciones | MEDICO |
| POST | `/atencion/servicio` | Agrega un servicio prestado (tarifa). No admite el mismo servicio dos veces | MEDICO |
| DELETE | `/atencion/servicio` | Retira un servicio mientras la atención está abierta | MEDICO |
| POST | `/atencion/finalizar` | Finaliza la atención: historia CERRADA y cita ATENDIDA | MEDICO |
| GET | `/atencion/prefactura` | Prefactura PDF con servicios prestados y medicamentos formulados | MEDICO, ADMIN, RECEPCION |

## 12. Historias clínicas

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/historia-clinica/listar` | Lista historias clínicas con anotaciones (soloPropias=true para el veterinario) | MEDICO, ADMIN |
| GET | `/historia-clinica/por-mascota` | Antecedentes médicos de una mascota | MEDICO, ADMIN |
| GET | `/historia-clinica/consultar` | Consulta una historia clínica | MEDICO, ADMIN |
| POST | `/historia-clinica/anotacion` | Agrega una anotación de evolución (MEDICO) | MEDICO |

## 13. Fórmulas médicas

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/formula-medica/listar` | Lista fórmulas (MEDICO: las propias) | MEDICO, ADMIN |
| GET | `/formula-medica/consultar` | Detalle de una fórmula | MEDICO, ADMIN |
| GET | `/formula-medica/por-cita` | Fórmulas de una cita | MEDICO |
| GET | `/formula-medica/historial` | Historial de estados de la fórmula (formulación y despacho) | MEDICO, ADMIN |
| POST | `/formula-medica/guardar` | Crea una fórmula en BORRADOR durante la atención (calcula cantidades y advierte faltantes) | MEDICO |
| PUT | `/formula-medica/actualizar` | Edita una fórmula en BORRADOR | MEDICO |
| POST | `/formula-medica/confirmar` | Confirma la fórmula y la envía a despacho (PENDIENTE_DESPACHO) | MEDICO |
| PATCH | `/formula-medica/anular` | Anula una fórmula sin dispensaciones (no se elimina) | MEDICO |
| GET | `/formula-medica/pdf` | Imprime la fórmula en PDF | MEDICO, ADMIN, DESPACHO_MEDICO |

## 14. Facturación y pagos

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/factura/citas-por-facturar` | Citas atendidas sin factura vigente | ADMIN, RECEPCION |
| GET | `/factura/calcular` | Vista previa de la factura de una cita (no se guarda) | ADMIN, RECEPCION |
| POST | `/factura/generar` | Genera la factura de una cita atendida (descuento sólo ADMIN) | ADMIN, RECEPCION |
| POST | `/factura/agregar-dispensados` | Agrega a una factura pendiente los productos dispensados después de generarla | ADMIN, RECEPCION |
| POST | `/factura/pago` | Registra un pago (parcial o total) | ADMIN, RECEPCION |
| PATCH | `/factura/pago/anular` | Anula un pago con motivo (ADMIN) | ADMIN |
| PATCH | `/factura/anular` | Anula una factura sin pagos vigentes (ADMIN). Conserva los registros | ADMIN |
| GET | `/factura/listar` | Lista facturas: por fechas/estado, o historial por propietario (clienteId) o mascota (mascotaId) | ADMIN, RECEPCION |
| GET | `/factura/consultar` | Detalle de una factura con pagos | ADMIN, RECEPCION |
| GET | `/factura/historial` | Trazabilidad de la factura | ADMIN, RECEPCION |
| GET | `/factura/pdf` | Factura en PDF | ADMIN, RECEPCION |

## 15. Reportes administrativos y contables

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/reporte/catalogo` | Catálogo de reportes y filtros que admite cada uno | ADMIN |
| GET | `/reporte/{codigo}` | Vista previa del reporte (mismo contenido que el PDF/Excel) | ADMIN |
| GET | `/reporte/{codigo}/pdf` | Descarga el reporte en PDF | ADMIN |
| GET | `/reporte/{codigo}/excel` | Descarga el reporte en Excel (.xlsx) | ADMIN |

## 16. Despacho y dispensación de medicamentos

| Método | Ruta | Descripción | Perfiles |
|---|---|---|---|
| GET | `/despacho/pendientes` | Fórmulas pendientes de despacho. Búsqueda por número, propietario, mascota, fecha o estado | DESPACHO_MEDICO |
| POST | `/despacho/preparar` | Prepara el despacho (EN_PREPARACION): existencias, lotes, vencidos y sugerencia FEFO | DESPACHO_MEDICO |
| POST | `/despacho/confirmar` | Confirma la entrega: descuenta inventario por lote en una transacción y genera movimientos | DESPACHO_MEDICO |
| PATCH | `/despacho/pendiente-disponibilidad` | Marca la fórmula como pendiente por disponibilidad | DESPACHO_MEDICO |
| PATCH | `/despacho/cancelar` | Cancela el despacho de una fórmula (procedimiento autorizado con motivo) | DESPACHO_MEDICO |
| PATCH | `/despacho/revertir` | Revierte una dispensación confirmada (devuelve unidades al lote con trazabilidad) | DESPACHO_MEDICO |
| GET | `/despacho/consultar` | Detalle de un despacho | DESPACHO_MEDICO, ADMIN |
| GET | `/despacho/historial` | Log de despachos de fórmulas (filtro por fechas y texto) | DESPACHO_MEDICO, ADMIN |
| GET | `/despacho/por-formula` | Despachos de una fórmula | DESPACHO_MEDICO, ADMIN |
| GET | `/despacho/estados` | Historial de estados de despacho de una fórmula con usuario responsable | DESPACHO_MEDICO, ADMIN |
| GET | `/despacho/por-medicamento` | Dispensaciones de un medicamento y su movimiento de inventario | DESPACHO_MEDICO, ADMIN |
| GET | `/despacho/comprobante` | Comprobante de despacho en PDF | DESPACHO_MEDICO, ADMIN |
| GET | `/despacho/formula-pdf` | Fórmula en PDF (consulta, sin modificar) | DESPACHO_MEDICO |

