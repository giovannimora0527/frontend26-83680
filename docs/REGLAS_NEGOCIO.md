# Reglas de negocio implementadas

Todas se validan en el **backend** (servicios + restricciones de BD). El frontend repite las validaciones de formulario para dar retroalimentación inmediata. Errores: 400 (datos inválidos), 401 (sin sesión), 403 (perfil sin permiso), 404 (inexistente), 409 (regla de negocio / conflicto).

## Seguridad y perfiles

| Perfil | Menús | Puede |
|---|---|---|
| ADMIN | Citas (lista), clientes, mascotas, veterinarios, especialidades y tarifas, inventario, historias (lectura), facturación, reportes, usuarios | Todo lo administrativo; único que autoriza descuentos, anula pagos/facturas, edita inventario y hace carga masiva |
| RECEPCION | Citas (lista), clientes, mascotas, facturación | Agendar, facturar, registrar pagos |
| MEDICO | **Mi agenda médica (calendario)**, historias, fórmulas, inventario (consulta) | Gestionar sus citas, atender, formular, prefactura |
| DESPACHO_MEDICO | Inventario (consulta), despacho | Sólo consulta de inventario y operaciones de despacho |

- El menú se obtiene del backend según el perfil (`perfil_menu`): el médico ve el módulo nuevo de calendario y la recepción/administración el módulo de citas existente.
- El administrador cambia los menús de cada perfil en "Perfiles y permisos". El frontend solo deja entrar a las rutas que están entre esos menús, y al abrir la aplicación consulta `/auth/sesion` para tomar los cambios sin esperar a que venza el token. El perfil Administrador no se puede inactivar ni quedarse sin ese módulo. Al inactivar un perfil, sus usuarios no pueden ingresar y sus sesiones abiertas dejan de funcionar.
- Cada endpoint declara sus perfiles con `@RequiereRol`; el `AuthInterceptor` valida el token y el perfil en cada petición. Ocultar la opción en el menú no es la única barrera.
- Contraseñas con BCrypt; sesiones con token aleatorio de 256 bits, expiración (10 h) y cierre/revocación al cambiar contraseña o inactivar.

## 1. Inventario

- Código de 8 caracteres alfanuméricos, único y no editable (identifica los movimientos). Nombre único.
- Registro INVIMA obligatorio para `MEDICAMENTO` (y para insumos/utensilios marcados como que lo requieren); opcional para utensilios.
- Precio de venta >= precio de compra; precios, cantidades y stock mínimo no negativos.
- Las cantidades **no se editan manualmente**: entran por lote (compra o carga masiva) y salen por dispensación.
- Lote: fecha de compra no futura; vencimiento obligatorio para medicamentos, posterior a la compra y a hoy (no se ingresan lotes vencidos).
- Indicadores: **agotado** (sin existencia vigente), **bajo stock** (vigente <= mínimo), **próximo a vencer** (<= 30 días), **con lotes vencidos**, **pedido pendiente** (fecha de próximo pedido alcanzada). El stock vencido se muestra aparte y no es dispensable.
- Toda modificación de existencias pasa por `InventarioMotor`: exige transacción, bloquea medicamento y lote (`SELECT ... FOR UPDATE`, orden fijo para evitar interbloqueos), registra el movimiento con saldo anterior/nuevo y rechaza saldos negativos.

### Carga masiva (.xlsx / .csv)
1. Valida estructura (16 encabezados obligatorios, en cualquier orden y sin importar tildes/mayúsculas).
2. Valida cada fila: obligatorios, formato del código, tipo, INVIMA, precios, impuesto existente, cantidad entera > 0, fechas (compra no futura, vencimiento > compra y > hoy).
3. Duplicados: mismo código+lote repetido en el archivo; código con otro nombre (en archivo o BD); nombre con otro código; lote ya registrado. Si el código ya existe con el mismo nombre, la fila es un **lote nuevo** del producto existente.
4. Guarda la **vista previa** (no toca el inventario) con filas válidas y con error; el informe de errores (Excel) indica fila y motivo.
5. Al confirmar, cada fila válida se importa en su propia transacción (`REQUIRES_NEW`): un error en una fila no afecta a las demás; la fila fallida queda marcada con el motivo.
6. Queda registrado quién cargó, cuándo, quién confirmó, totales y resultado (log de cargue).

## 2. Citas y calendario

- Cada cita queda ligada a mascota, propietario (de la mascota) y veterinario.
- Un veterinario no tiene dos citas superpuestas; una mascota tampoco (comparación de intervalos `[inicio, fin)`; las canceladas liberan el horario).
- No se asignan citas a veterinarios inactivos ni fuera de sus **horarios de disponibilidad** (`horario_medico`), ni en fechas/horas pasadas. La cita empieza y termina el mismo día (10 min a 8 h).
- La asignación bloquea el registro del veterinario para que dos usuarios no tomen el mismo horario a la vez.
- Estados: PENDIENTE, PROGRAMADA, CONFIRMADA, EN ATENCIÓN, ATENDIDA (finalizada), CANCELADA. Cancelar exige motivo; las canceladas conservan su historial y pueden reactivarse (se revalida el horario).
- Atendidas, canceladas y en atención no se editan ni se reprograman.
- Un MEDICO sólo ve y modifica su propia agenda. El calendario permite arrastrar (reprogramar) y redimensionar (cambiar duración); si el backend rechaza el cambio, el evento vuelve a su lugar.
- Reporte Excel/PDF de las citas del médico con filtro de fecha inicial y final; conteo por estado.

## 3. Atención, fórmulas y facturación

- Sólo el veterinario de la cita la atiende. La atención se inicia el día de la cita: crea la historia (ABIERTA) y registra el servicio principal (tipo de consulta).
- Finalizar exige diagnóstico, al menos un servicio y que no haya fórmulas en borrador; cierra la historia (no editable) y deja la cita ATENDIDA. Las anotaciones posteriores son adendas que no modifican la historia.
- No se registra dos veces el mismo servicio en una atención.
- Fórmula: borrador → confirmada (pasa a despacho como PENDIENTE DESPACHO). Cantidad sugerida = dosis por toma × ⌈días × 24 / frecuencia⌉. Se valida medicamento activo, sin repetidos, vía permitida; si no hay existencias suficientes se advierte (quedará pendiente por disponibilidad). **Formular no descuenta inventario.**
- Una fórmula con dispensaciones no se anula (primero se revierte el despacho).
- Prefactura PDF al finalizar: servicios prestados + medicamentos formulados con tarifas vigentes.
- Factura: sólo citas ATENDIDAS; una factura vigente por cita (índice único en BD); productos = sólo lo efectivamente dispensado y cada uno una vez; valores, impuestos y especialidad se copian (no cambian si después se modifica la tarifa); impuesto por línea según la configuración del servicio o producto.
- Cálculo: bruto = cantidad × precio; descuento = bruto × %; base = bruto − descuento; impuesto = base × % (redondeo al peso); total = base + impuesto.
- Descuentos sólo autorizados por ADMIN (queda registrado quién autorizó).
- Pagos: > 0 y <= saldo; referencia obligatoria si no es efectivo. Estados: PENDIENTE, PAGO PARCIAL, PAGADA, ANULADA (recalculados desde los pagos vigentes).
- Anulación controlada (ADMIN, con motivo): primero se anulan los pagos; la factura conserva sus registros y la cita puede facturarse de nuevo. Toda operación queda en `factura_historial`.
- Productos dispensados después de facturar se pueden agregar a la factura mientras esté pendiente.

## 4. Reportes

- Rango de fechas y filtros según el reporte; vista previa antes de exportar; PDF y Excel con encabezado, fecha de generación, usuario y totales; sólo ADMIN.
- Los ingresos excluyen facturas y pagos anulados; "facturado" se toma de facturas y "recaudado" de pagos aplicados, por lo que los reportes cuadran con la operación.

## 5. Despacho (perfil DESPACHO_MEDICO) - reglas obligatorias

| # | Regla | Implementación |
|---|---|---|
| 1 | Sólo DESPACHO_MEDICO gestiona despachos | `@RequiereRol(DESPACHO_MEDICO)` en el controlador |
| 2 | El veterinario crea y confirma la fórmula | Endpoints de fórmula sólo para MEDICO dueño de la cita |
| 3 | Despacho no modifica dosis, indicaciones ni cantidades prescritas | El despacho sólo envía lote y cantidad entregada; la fórmula es de lectura |
| 4 | El inventario sólo se descuenta al confirmar | Preparar sólo consulta; el descuento ocurre en `/despacho/confirmar` |
| 5 | No se dispensan vencidos | Validación en servicio y en `InventarioMotor`; lotes vencidos bloqueados en la interfaz |
| 6 | No más que lo disponible | Validación por lote con bloqueo pesimista + `CHECK` de saldo |
| 7 | Entregas parciales | Estados DESPACHO PARCIAL / PENDIENTE POR DISPONIBILIDAD |
| 8 | Cada salida ligada a despacho y fórmula | Columnas `despacho_id`, `formula_id`, `despacho_detalle_id` + `CHECK` en BD |
| 9 | No descontar dos veces | `clave_idempotencia` única por confirmación + no superar lo pendiente |
| 10 | Usuario, fecha y hora en todo | `usuario_id`/fechas en despacho, movimientos e historial de estados |
| 11 | No eliminar dispensaciones; reversión trazable | `/despacho/revertir` con motivo: devuelve unidades al mismo lote (movimiento de entrada) y marca el despacho; bloqueada si ya se facturó |
| 12 | Permisos en el backend | Interceptor + anotaciones, no sólo el menú |

- Selección de lotes FEFO: se sugiere primero el lote vigente que vence antes.
- La confirmación es una única transacción: si algo falla, no queda inventario parcialmente actualizado.
- Comprobante de despacho en PDF (lotes, cantidades, saldo de la fórmula y firmas).
