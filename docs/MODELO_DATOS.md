# Modelo de datos — Clínica Veterinaria Uniminuto

Base de datos MySQL `clinica` (InnoDB, `utf8mb4_unicode_ci`).

- **Esquema completo con datos de ejemplo:** `backend/database/clinica.sql`.
- **Cambios del examen final:** `backend/database/migracion_examen_final.sql`, en ocho secciones.
- **Cambios del segundo parcial:** `backend/database/migracion_segundo_parcial.sql`.

## Diagrama entidad-relación

GitHub y la mayoría de editores dibujan este diagrama (Mermaid). Para exportarlo como imagen, basta con
pegar el bloque en <https://mermaid.live>.

```mermaid
erDiagram
    PERFIL ||--o{ USUARIO : asigna
    PERFIL ||--o{ PERFIL_MENU : habilita
    MENU ||--o{ PERFIL_MENU : "se muestra en"

    USUARIO |o--o| MEDICO : "acceso de"
    USUARIO |o--o{ CLIENTE : "acceso de"
    ESPECIALIZACION ||--o{ MEDICO : clasifica
    MEDICO ||--o{ HORARIO_MEDICO : "atiende en"

    CLIENTE ||--o{ MASCOTA : "es propietario de"
    RAZA ||--o{ MASCOTA : clasifica

    ESTADO_CITA ||--o{ CITA : "estado de"
    MASCOTA ||--o{ CITA : agenda
    MEDICO ||--o{ CITA : atiende
    CITA ||--o{ CITA_HISTORIAL : registra

    CITA |o--o| HISTORIA_CLINICA : "genera (atención)"
    MASCOTA ||--o{ HISTORIA_CLINICA : tiene
    MEDICO ||--o{ HISTORIA_CLINICA : registra
    HISTORIA_CLINICA ||--o{ ANOTACION : contiene
    HISTORIA_CLINICA ||--o{ ATENCION_SERVICIO : "presta"
    SERVICIO ||--o{ ATENCION_SERVICIO : "tarifa de"
    ESPECIALIZACION |o--o{ SERVICIO : "tarifa por"
    SERVICIO ||--o{ SERVICIO_TARIFA_LOG : "cambios de"

    HISTORIA_CLINICA ||--o{ FORMULA_MEDICA : origina
    MEDICO ||--o{ FORMULA_MEDICA : firma
    FORMULA_MEDICA ||--|{ FORMULA_DETALLE : "medicamentos"
    FORMULA_MEDICA ||--o{ FORMULA_ESTADO_HISTORIAL : registra
    MEDICAMENTO ||--o{ FORMULA_DETALLE : prescrito

    MEDICAMENTO ||--o{ LOTE_MEDICAMENTO : "existencias en"
    MEDICAMENTO ||--o{ MOVIMIENTO_INVENTARIO : mueve
    LOTE_MEDICAMENTO ||--o{ MOVIMIENTO_INVENTARIO : afecta

    FORMULA_MEDICA ||--o{ DESPACHO : "se entrega en"
    DESPACHO ||--|{ DESPACHO_DETALLE : contiene
    FORMULA_DETALLE ||--o{ DESPACHO_DETALLE : "se dispensa"
    LOTE_MEDICAMENTO ||--o{ DESPACHO_DETALLE : "sale de"
    DESPACHO |o--o{ MOVIMIENTO_INVENTARIO : "genera salida"
    FORMULA_MEDICA |o--o{ MOVIMIENTO_INVENTARIO : referencia

    HISTORIA_CLINICA ||--o{ FACTURA : "se factura en"
    CLIENTE ||--o{ FACTURA : paga
    MASCOTA ||--o{ FACTURA : "atendida en"
    MEDICO ||--o{ FACTURA : "prestó"
    FACTURA ||--|{ FACTURA_DETALLE : lineas
    SERVICIO |o--o{ FACTURA_DETALLE : cobra
    MEDICAMENTO |o--o{ FACTURA_DETALLE : vende
    FACTURA ||--o{ PAGO : recibe

    USUARIO ||--o{ CARGA_INVENTARIO : sube
    CARGA_INVENTARIO ||--|{ CARGA_INVENTARIO_DETALLE : filas
    MEDICAMENTO |o--o{ CARGA_INVENTARIO_DETALLE : "creado por"

    MEDICO {
        bigint id PK
        varchar numero_documento UK
        varchar registro_profesional UK
        bigint especializacion_id FK
        int usuario_id FK "UK"
        tinyint activo
        int duracion_cita_min
    }
    CITA {
        bigint cita_id PK
        int mascota_id FK
        bigint medico_id FK
        datetime fecha_hora
        datetime fecha_hora_fin
        varchar estado FK
        varchar motivo_cancelacion
    }
    HORARIO_MEDICO {
        bigint horario_id PK
        bigint medico_id FK
        tinyint dia_semana "1 lunes a 7 domingo"
        time hora_inicio
        time hora_fin
    }
    HISTORIA_CLINICA {
        bigint historia_id PK
        bigint cita_id FK "UK"
        varchar motivo
        varchar sintomas
        varchar diagnostico
        varchar recomendaciones
        varchar estado "ABIERTA o CERRADA"
        datetime fecha_finalizacion
    }
    MEDICAMENTO {
        bigint id PK
        varchar codigo UK "8 caracteres"
        varchar nombre UK
        varchar tipo "MEDICAMENTO o INSUMO"
        varchar registro_invima
        decimal precio_venta
        decimal iva_porcentaje
        int stock_minimo
        date fecha_proximo_pedido
    }
    LOTE_MEDICAMENTO {
        bigint lote_id PK
        bigint medicamento_id FK
        varchar numero_lote
        date fecha_compra
        date fecha_ingreso
        date fecha_vencimiento
        int cantidad_disponible
        decimal precio_compra
    }
    MOVIMIENTO_INVENTARIO {
        bigint movimiento_id PK
        varchar tipo "ENTRADA SALIDA AJUSTE REVERSION"
        int cantidad
        int saldo_lote
        int usuario_id FK
        bigint formula_id FK
        bigint despacho_id FK
    }
    FORMULA_MEDICA {
        bigint formula_id PK
        bigint historia_id FK
        varchar estado "BORRADOR CONFIRMADA ANULADA"
        varchar estado_despacho
    }
    DESPACHO {
        bigint despacho_id PK
        bigint formula_id FK
        varchar estado "CONFIRMADO o REVERTIDO"
        int usuario_id FK
    }
    SERVICIO {
        bigint servicio_id PK
        varchar codigo UK
        varchar tipo "CONSULTA PROCEDIMIENTO LABORATORIO OTRO"
        bigint especializacion_id FK
        decimal valor
        decimal iva_porcentaje
    }
    FACTURA {
        bigint factura_id PK
        varchar numero UK "FV-000001"
        bigint historia_id FK
        decimal subtotal
        decimal descuento
        decimal iva
        decimal total
        decimal pagado
        varchar estado "PENDIENTE_PAGO PAGO_PARCIAL PAGADA ANULADA"
    }
    PAGO {
        bigint pago_id PK
        bigint factura_id FK
        decimal valor
        varchar medio
    }
```

Por legibilidad, el diagrama solo detalla los atributos de las tablas principales; el detalle completo de cada
tabla está en `clinica.sql`.

## Restricciones e integridad

- **Llaves foráneas.** Todas las relaciones del diagrama son llaves foráneas reales, por lo que no se puede
  borrar un registro que otro esté usando. Los registros clínicos y contables nunca se borran: se anulan, se
  cancelan o se inactivan.
- **Unicidad.** Son únicos:
  - del producto: el código y el nombre;
  - del veterinario: el documento y el registro profesional;
  - la cita de cada historia clínica (una atención por cita);
  - el número de factura;
  - el código del servicio;
  - el par perfil/menú.
- **Validaciones `CHECK` en la base:**
  - cantidades y valores mayores que cero o no negativos;
  - IVA entre 0 y 100 %;
  - la cita termina después de empezar (`fecha_hora_fin > fecha_hora`);
  - la franja horaria termina después de empezar y el día de la semana va de 1 a 7;
  - estados válidos de cita, fórmula, despacho, factura, pago y carga;
  - en la factura, el descuento no supera el subtotal y lo pagado no supera el total.
- **Reglas que valida el backend** (no se pueden expresar con una sola restricción de la base):
  - **Citas sin cruces:** un veterinario no tiene dos citas que se crucen en el tiempo, ni una mascota dos citas
    simultáneas. Las canceladas no ocupan horario.
  - **Agenda:** no se agenda fuera del horario del veterinario ni con veterinarios inactivos.
  - **Tarifas:** solo puede haber una consulta activa por especialidad.
  - **Facturación:** una atención solo puede tener una factura vigente. Las anuladas se conservan y la
    atención puede volver a facturarse.
  - **Inventario:** nunca queda negativo.
- **Concurrencia.** Las operaciones críticas bloquean las filas que modifican (`PESSIMISTIC_WRITE`):
  - el despacho, sobre la fórmula y los lotes;
  - los pagos y la anulación, sobre la factura;
  - la generación de la factura, sobre la atención.
  Así, dos usuarios a la vez no descuentan dos veces el inventario ni facturan dos veces la misma atención.

## Justificación de los cambios

| Cambio | Motivo |
|---|---|
| `medicamento`: código, tipo, Invima, precio de venta, IVA, stock mínimo, próximo pedido, activo | Inventario funcional (1.1, 1.2). El Invima es obligatorio solo para medicamentos. |
| `lote_medicamento` (fechas de compra, ingreso y vencimiento movidas aquí) | Un mismo producto tiene varios lotes con precio de compra y vencimiento propios (1.2). |
| `movimiento_inventario` | Historial de entradas y salidas con usuario, fecha, fórmula y despacho (1.3, 5.4). |
| `perfil`, `menu`, `perfil_menu` y `usuario.perfil_id` | Menús por perfil y el perfil `DESPACHO_MEDICO` (5.1). El rol se lee de la base en cada petición. |
| `formula_detalle` y `formula_estado_historial` | Fórmulas con varios medicamentos e historial de estados (3.3, 5.5). |
| `despacho` y `despacho_detalle` | Entregas parciales por lote, reversión con motivo y trazabilidad (5.3 a 5.6). |
| `estado_cita`, `cita.fecha_hora_fin`, `cita_historial` | Calendario por rangos, colores por estado e historial; las canceladas conservan su historia (2.1 a 2.3). |
| `medico.activo`, `medico.duracion_cita_min`, `horario_medico` | No se agendan citas con veterinarios inactivos ni fuera de su disponibilidad (2.3, 2.4). |
| `especializacion.activo`, `servicio` y `servicio_tarifa_log` | Tarifas configurables sin cambiar el código, con IVA e historial de cambios (3.1). |
| `historia_clinica`: síntomas, recomendaciones y fecha de finalización; `atencion_servicio` | Atención de la cita con servicios prestados y su tarifa congelada (3.2). |
| `factura`, `factura_detalle`, `pago` | Facturas con valores congelados, IVA por línea, descuentos, pagos parciales y anulación controlada (3.4, 3.5). |
| `carga_inventario` y `carga_inventario_detalle` | Log de cargue: usuario, fecha, resultado y motivo por fila (1.4). |
