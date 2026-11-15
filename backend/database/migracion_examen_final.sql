-- =====================================================================
-- Migración del examen final (Clínica Veterinaria)
-- Se aplica sobre el esquema resultante de migracion_segundo_parcial.sql.
-- Cada sección corresponde a una etapa del desarrollo.
-- =====================================================================

USE clinica;

-- ---------------------------------------------------------------------
-- Autenticación y roles: cada veterinario se enlaza con su usuario de
-- acceso (máximo uno por usuario), para identificar al médico autenticado.
-- ---------------------------------------------------------------------
ALTER TABLE medico
    ADD COLUMN usuario_id INT NULL AFTER especializacion_id,
    ADD CONSTRAINT uk_medico_usuario UNIQUE (usuario_id),
    ADD CONSTRAINT fk_medico_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id);

-- ---------------------------------------------------------------------
-- Inventario: el medicamento pasa a ser el producto (medicamento o insumo)
-- y las existencias se manejan por lote, porque un mismo producto puede
-- tener varios lotes con distinto precio de compra y vencimiento.
-- La cantidad disponible es la suma de sus lotes vigentes: no se guarda
-- un total aparte que pueda quedar inconsistente.
-- ---------------------------------------------------------------------
ALTER TABLE medicamento
    ADD COLUMN codigo CHAR(8) NULL AFTER id,
    ADD COLUMN tipo VARCHAR(12) NOT NULL DEFAULT 'MEDICAMENTO' AFTER presentacion,
    ADD COLUMN registro_invima VARCHAR(30) NULL AFTER tipo,
    ADD COLUMN precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER registro_invima,
    ADD COLUMN stock_minimo INT NOT NULL DEFAULT 0 AFTER precio_venta,
    ADD COLUMN fecha_proximo_pedido DATE NULL AFTER stock_minimo,
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER fecha_proximo_pedido;

UPDATE medicamento SET codigo = CONCAT('MED', LPAD(id, 5, '0'));

ALTER TABLE medicamento
    MODIFY codigo CHAR(8) NOT NULL,
    MODIFY nombre VARCHAR(100) NOT NULL,
    ADD CONSTRAINT uk_medicamento_codigo UNIQUE (codigo),
    ADD CONSTRAINT uk_medicamento_nombre UNIQUE (nombre),
    ADD CONSTRAINT ck_medicamento_precio CHECK (precio_venta >= 0),
    ADD CONSTRAINT ck_medicamento_stock CHECK (stock_minimo >= 0),
    ADD CONSTRAINT ck_medicamento_tipo CHECK (tipo IN ('MEDICAMENTO', 'INSUMO'));

CREATE TABLE lote_medicamento (
    lote_id             BIGINT        NOT NULL AUTO_INCREMENT,
    medicamento_id      BIGINT        NOT NULL,
    numero_lote         VARCHAR(40)   NOT NULL,
    fecha_compra        DATE          NOT NULL,
    fecha_ingreso       DATE          NOT NULL,
    fecha_vencimiento   DATE          NULL,
    cantidad_inicial    INT           NOT NULL,
    cantidad_disponible INT           NOT NULL,
    precio_compra       DECIMAL(12,2) NOT NULL,
    fecha_creacion      DATETIME      NOT NULL,
    PRIMARY KEY (lote_id),
    CONSTRAINT uk_lote_medicamento_numero UNIQUE (medicamento_id, numero_lote),
    KEY idx_lote_vencimiento (fecha_vencimiento),
    CONSTRAINT fk_lote_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
    CONSTRAINT ck_lote_cantidad CHECK (cantidad_disponible >= 0),
    CONSTRAINT ck_lote_cantidad_inicial CHECK (cantidad_inicial >= 0),
    CONSTRAINT ck_lote_precio CHECK (precio_compra >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Las fechas de compra y vencimiento existentes se conservan como un lote
-- sin existencias: la tabla original no registraba cantidades ni precios.
INSERT INTO lote_medicamento
    (medicamento_id, numero_lote, fecha_compra, fecha_ingreso, fecha_vencimiento,
     cantidad_inicial, cantidad_disponible, precio_compra, fecha_creacion)
SELECT id, 'INICIAL', fecha_compra, fecha_compra, fecha_vence, 0, 0, 0, NOW()
FROM medicamento
WHERE fecha_compra IS NOT NULL;

ALTER TABLE medicamento
    DROP COLUMN fecha_compra,
    DROP COLUMN fecha_vence;

CREATE TABLE movimiento_inventario (
    movimiento_id  BIGINT       NOT NULL AUTO_INCREMENT,
    medicamento_id BIGINT       NOT NULL,
    lote_id        BIGINT       NOT NULL,
    tipo           VARCHAR(15)  NOT NULL,
    cantidad       INT          NOT NULL,
    saldo_lote     INT          NOT NULL,
    fecha          DATETIME     NOT NULL,
    usuario_id     INT          NOT NULL,
    referencia     VARCHAR(100) NOT NULL,
    observacion    VARCHAR(255) NULL,
    formula_id     BIGINT       NULL,
    PRIMARY KEY (movimiento_id),
    KEY idx_movimiento_medicamento (medicamento_id, fecha),
    CONSTRAINT fk_movimiento_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
    CONSTRAINT fk_movimiento_lote FOREIGN KEY (lote_id) REFERENCES lote_medicamento (lote_id),
    CONSTRAINT fk_movimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_movimiento_formula FOREIGN KEY (formula_id) REFERENCES formula_medica (formula_id),
    CONSTRAINT ck_movimiento_cantidad CHECK (cantidad > 0),
    CONSTRAINT ck_movimiento_saldo CHECK (saldo_lote >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Perfiles y menús administrados desde la base de datos (estructura
-- entregada por el docente), con estos ajustes:
--   * perfil.codigo: identificador estable que usa la seguridad del backend,
--     para que renombrar un perfil no cambie sus permisos.
--   * usuario.perfil_id reemplaza a usuario.rol: enlaza cada usuario con su perfil.
--   * Perfil DESPACHO_MEDICO exigido por el examen y menús de razas y perfiles.
--   * Llaves foráneas y unicidad en perfil_menu.
-- ---------------------------------------------------------------------
CREATE TABLE menu (
    menu_id            INT          NOT NULL AUTO_INCREMENT,
    code               VARCHAR(100) NOT NULL,
    title              VARCHAR(255) NOT NULL,
    url                VARCHAR(255) NOT NULL,
    icon               VARCHAR(255) NOT NULL,
    activo             TINYINT(1)   NOT NULL,
    fecha_creacion     DATETIME     NOT NULL,
    fecha_modificacion DATETIME     NULL,
    PRIMARY KEY (menu_id),
    CONSTRAINT uk_menu_code UNIQUE (code),
    CONSTRAINT uk_menu_url UNIQUE (url)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO menu (menu_id, code, title, url, icon, activo, fecha_creacion) VALUES
    (1, 'cita', 'Gestión de citas', '/inicio/citas', 'fa-solid fa-calendar', 1, '2026-01-01 00:00:00'),
    (2, 'clientes', 'Gestión de clientes', '/inicio/clientes', 'fa-solid fa-user-check', 1, '2026-01-01 00:00:00'),
    (3, 'especializaciones', 'Gestión de Especializaciones', '/inicio/especializaciones', 'fa-solid fa-user-graduate', 1, '2026-01-01 00:00:00'),
    (4, 'formulas', 'Gestión de Formulas', '/inicio/formulas', 'fa-solid fa-clipboard-list', 1, '2026-01-01 00:00:00'),
    (5, 'historias', 'Gestión de Historias', '/inicio/historias', 'fa-solid fa-book-medical', 1, '2026-01-01 00:00:00'),
    (6, 'mascotas', 'Gestión de Mascotas', '/inicio/mascotas', 'fa-solid fa-paw', 1, '2026-01-01 00:00:00'),
    (7, 'medicamentos', 'Gestión de Medicamentos', '/inicio/medicamentos', 'fa-solid fa-capsules', 1, '2026-01-01 00:00:00'),
    (8, 'medicos', 'Gestión de Medicos', '/inicio/medicos', 'fa-solid fa-user-doctor', 1, '2026-01-01 00:00:00'),
    (9, 'usuarios', 'Gestión de Usuarios', '/inicio/usuarios', 'fa-solid fa-users', 1, '2026-01-01 00:00:00'),
    (10, 'razas', 'Gestión de Razas', '/inicio/razas', 'fa-solid fa-dog', 1, NOW()),
    (11, 'perfiles', 'Perfiles y Menús', '/inicio/perfiles', 'fa-solid fa-user-shield', 1, NOW());

CREATE TABLE perfil (
    perfil_id          INT         NOT NULL AUTO_INCREMENT,
    codigo             VARCHAR(20) NOT NULL,
    nombre             VARCHAR(50) NOT NULL,
    activo             TINYINT(1)  NOT NULL,
    fecha_creacion     DATETIME    NOT NULL,
    fecha_modificacion DATETIME    NULL,
    PRIMARY KEY (perfil_id),
    CONSTRAINT uk_perfil_codigo UNIQUE (codigo),
    CONSTRAINT uk_perfil_nombre UNIQUE (nombre)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO perfil (perfil_id, codigo, nombre, activo, fecha_creacion) VALUES
    (1, 'ADMIN', 'Administrador', 1, '2026-01-01 00:00:00'),
    (2, 'RECEPCIONISTA', 'Recepcion', 1, '2026-01-01 00:00:00'),
    (3, 'VETERINARIO', 'Medico', 1, '2026-01-01 00:00:00'),
    (4, 'DESPACHO_MEDICO', 'Despacho Medico', 1, NOW());

CREATE TABLE perfil_menu (
    perfil_menu_id INT NOT NULL AUTO_INCREMENT,
    perfil_id      INT NOT NULL,
    menu_id        INT NOT NULL,
    PRIMARY KEY (perfil_menu_id),
    CONSTRAINT uk_perfil_menu UNIQUE (perfil_id, menu_id),
    CONSTRAINT fk_perfil_menu_perfil FOREIGN KEY (perfil_id) REFERENCES perfil (perfil_id),
    CONSTRAINT fk_perfil_menu_menu FOREIGN KEY (menu_id) REFERENCES menu (menu_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO perfil_menu (perfil_id, menu_id) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11),
    (2, 1), (2, 2), (2, 6),
    (3, 1), (3, 4), (3, 5), (3, 7),
    (4, 7);

ALTER TABLE usuario
    ADD COLUMN perfil_id INT NULL AFTER password_hash;

UPDATE usuario u JOIN perfil p ON p.codigo = u.rol SET u.perfil_id = p.perfil_id;

ALTER TABLE usuario
    MODIFY perfil_id INT NOT NULL,
    ADD CONSTRAINT fk_usuario_perfil FOREIGN KEY (perfil_id) REFERENCES perfil (perfil_id),
    DROP COLUMN rol;

-- ---------------------------------------------------------------------
-- Fórmulas con varios medicamentos y despacho de medicamentos.
--   * formula_medica queda como encabezado; cada medicamento es una línea
--     de formula_detalle con dosis, frecuencia, duración, cantidad y vía.
--   * Estados de la fórmula: BORRADOR (editable por el veterinario),
--     CONFIRMADA (pasa a despacho) y ANULADA. El estado del despacho se
--     lleva aparte, con su historial de cambios.
--   * Un despacho es una entrega confirmada: sus líneas indican el lote
--     usado, y cada salida de inventario queda enlazada a fórmula y despacho.
-- ---------------------------------------------------------------------
CREATE TABLE formula_detalle (
    detalle_id         BIGINT        NOT NULL AUTO_INCREMENT,
    formula_id         BIGINT        NOT NULL,
    medicamento_id     BIGINT        NOT NULL,
    dosis              DECIMAL(10,2) NOT NULL,
    unidad_dosis       VARCHAR(20)   NOT NULL,
    frecuencia_horas   INT           NOT NULL,
    duracion_dias      INT           NOT NULL,
    cantidad_prescrita INT           NOT NULL,
    via_administracion VARCHAR(20)   NULL,
    indicaciones       VARCHAR(1000) NOT NULL,
    PRIMARY KEY (detalle_id),
    CONSTRAINT uk_formula_detalle_medicamento UNIQUE (formula_id, medicamento_id),
    CONSTRAINT fk_formula_detalle_formula FOREIGN KEY (formula_id) REFERENCES formula_medica (formula_id),
    CONSTRAINT fk_formula_detalle_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
    CONSTRAINT ck_formula_detalle_dosis CHECK (dosis > 0),
    CONSTRAINT ck_formula_detalle_frecuencia CHECK (frecuencia_horas BETWEEN 1 AND 168),
    CONSTRAINT ck_formula_detalle_duracion CHECK (duracion_dias BETWEEN 1 AND 365),
    CONSTRAINT ck_formula_detalle_cantidad CHECK (cantidad_prescrita > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Las fórmulas existentes (un medicamento cada una) pasan a ser su primera
-- línea. La cantidad se estima como el número de tomas del tratamiento y la
-- vía queda sin registrar, porque el modelo anterior no las guardaba.
INSERT INTO formula_detalle
    (formula_id, medicamento_id, dosis, unidad_dosis, frecuencia_horas, duracion_dias,
     cantidad_prescrita, via_administracion, indicaciones)
SELECT formula_id, medicamento_id, dosis, unidad_dosis, frecuencia_horas, duracion_dias,
       CEILING(24 / frecuencia_horas) * duracion_dias, NULL, indicaciones
FROM formula_medica;

ALTER TABLE formula_medica
    DROP FOREIGN KEY fk_formula_medicamento,
    DROP CHECK ck_formula_dosis,
    DROP CHECK ck_formula_frecuencia,
    DROP CHECK ck_formula_duracion;

ALTER TABLE formula_medica
    DROP COLUMN medicamento_id,
    DROP COLUMN dosis,
    DROP COLUMN unidad_dosis,
    DROP COLUMN frecuencia_horas,
    DROP COLUMN duracion_dias,
    DROP COLUMN indicaciones,
    ADD COLUMN observaciones VARCHAR(1000) NULL AFTER fecha_emision,
    MODIFY estado VARCHAR(12) NOT NULL,
    ADD COLUMN estado_despacho VARCHAR(25) NULL AFTER estado,
    ADD COLUMN fecha_confirmacion DATETIME NULL AFTER estado_despacho;

UPDATE formula_medica
-- estado_despacho va primero: MySQL evalúa el SET de izquierda a derecha.
SET estado_despacho = CASE estado WHEN 'ACTIVA' THEN 'PENDIENTE_DESPACHO' ELSE 'CANCELADO' END,
    estado = CASE estado WHEN 'ACTIVA' THEN 'CONFIRMADA' ELSE 'ANULADA' END,
    fecha_confirmacion = fecha_creacion;

ALTER TABLE formula_medica
    ADD CONSTRAINT ck_formula_estado CHECK (estado IN ('BORRADOR', 'CONFIRMADA', 'ANULADA'));

CREATE TABLE formula_estado_historial (
    historial_id    BIGINT       NOT NULL AUTO_INCREMENT,
    formula_id      BIGINT       NOT NULL,
    estado_anterior VARCHAR(25)  NULL,
    estado_nuevo    VARCHAR(25)  NOT NULL,
    usuario_id      INT          NOT NULL,
    fecha           DATETIME     NOT NULL,
    observacion     VARCHAR(255) NULL,
    PRIMARY KEY (historial_id),
    KEY idx_historial_formula (formula_id, fecha),
    CONSTRAINT fk_historial_formula FOREIGN KEY (formula_id) REFERENCES formula_medica (formula_id),
    CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE despacho (
    despacho_id          BIGINT       NOT NULL AUTO_INCREMENT,
    formula_id           BIGINT       NOT NULL,
    usuario_id           INT          NOT NULL,
    estado               VARCHAR(12)  NOT NULL,
    fecha                DATETIME     NOT NULL,
    observacion          VARCHAR(255) NULL,
    usuario_reversion_id INT          NULL,
    fecha_reversion      DATETIME     NULL,
    motivo_reversion     VARCHAR(255) NULL,
    PRIMARY KEY (despacho_id),
    KEY idx_despacho_fecha (fecha),
    CONSTRAINT fk_despacho_formula FOREIGN KEY (formula_id) REFERENCES formula_medica (formula_id),
    CONSTRAINT fk_despacho_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_despacho_usuario_reversion FOREIGN KEY (usuario_reversion_id) REFERENCES usuario (id),
    CONSTRAINT ck_despacho_estado CHECK (estado IN ('CONFIRMADO', 'REVERTIDO'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE despacho_detalle (
    detalle_id         BIGINT NOT NULL AUTO_INCREMENT,
    despacho_id        BIGINT NOT NULL,
    formula_detalle_id BIGINT NOT NULL,
    lote_id            BIGINT NOT NULL,
    cantidad           INT    NOT NULL,
    PRIMARY KEY (detalle_id),
    CONSTRAINT uk_despacho_detalle_lote UNIQUE (despacho_id, formula_detalle_id, lote_id),
    CONSTRAINT fk_despacho_detalle_despacho FOREIGN KEY (despacho_id) REFERENCES despacho (despacho_id),
    CONSTRAINT fk_despacho_detalle_linea FOREIGN KEY (formula_detalle_id) REFERENCES formula_detalle (detalle_id),
    CONSTRAINT fk_despacho_detalle_lote FOREIGN KEY (lote_id) REFERENCES lote_medicamento (lote_id),
    CONSTRAINT ck_despacho_detalle_cantidad CHECK (cantidad > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE movimiento_inventario
    ADD COLUMN despacho_id BIGINT NULL AFTER formula_id,
    ADD CONSTRAINT fk_movimiento_despacho FOREIGN KEY (despacho_id) REFERENCES despacho (despacho_id);

-- Menú del módulo de despacho, asignado al perfil Despacho Medico.
INSERT INTO menu (menu_id, code, title, url, icon, activo, fecha_creacion) VALUES
    (12, 'despacho', 'Despacho de Medicamentos', '/inicio/despacho', 'fa-solid fa-truck-medical', 1, NOW());

INSERT INTO perfil_menu (perfil_id, menu_id)
SELECT perfil_id, 12 FROM perfil WHERE codigo = 'DESPACHO_MEDICO';

-- =====================================================================
-- 5. Citas con calendario (requerimiento 2)
--    - Catálogo de estados de la cita (con color para el calendario).
--    - Médicos activos / inactivos y duración por defecto de su consulta.
--    - Hora de fin en cada cita: el solapamiento se valida por rangos.
--    - Horarios de disponibilidad semanales de cada veterinario.
--    - Historial de cambios de la cita (creación, reprogramación, estados).
--    - Menú "Mi calendario" para el perfil Medico; secretaria y
--      administrador conservan el módulo de citas ya desarrollado.
-- =====================================================================

CREATE TABLE estado_cita (
    codigo      VARCHAR(20)  NOT NULL,
    nombre      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(200) NULL,
    color       VARCHAR(7)   NOT NULL,
    es_final    TINYINT(1)   NOT NULL DEFAULT 0,
    orden       INT          NOT NULL,
    PRIMARY KEY (codigo)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO estado_cita (codigo, nombre, descripcion, color, es_final, orden) VALUES
    ('PENDIENTE',  'Pendiente',  'Solicitada; falta confirmar con el propietario', '#f4c22b', 0, 1),
    ('PROGRAMADA', 'Programada', 'Agendada en el calendario del veterinario',      '#04a9f5', 0, 2),
    ('CONFIRMADA', 'Confirmada', 'El propietario confirmó la asistencia',          '#1de9b6', 0, 3),
    ('ATENDIDA',   'Finalizada', 'La consulta se realizó',                         '#6c757d', 1, 4),
    ('CANCELADA',  'Cancelada',  'Se canceló; se conserva en el historial',        '#f44236', 1, 5);

ALTER TABLE cita
    ADD CONSTRAINT fk_cita_estado FOREIGN KEY (estado) REFERENCES estado_cita (codigo);

ALTER TABLE medico
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER usuario_id,
    ADD COLUMN duracion_cita_min INT NOT NULL DEFAULT 30 AFTER activo,
    ADD CONSTRAINT ck_medico_duracion CHECK (duracion_cita_min BETWEEN 10 AND 240);

ALTER TABLE cita
    ADD COLUMN fecha_hora_fin DATETIME NULL AFTER fecha_hora,
    ADD COLUMN motivo_cancelacion VARCHAR(255) NULL AFTER estado;

UPDATE cita SET fecha_hora_fin = DATE_ADD(fecha_hora, INTERVAL 30 MINUTE) WHERE fecha_hora_fin IS NULL;

ALTER TABLE cita
    MODIFY COLUMN fecha_hora_fin DATETIME NOT NULL,
    ADD CONSTRAINT ck_cita_rango CHECK (fecha_hora_fin > fecha_hora),
    ADD INDEX idx_cita_medico_rango (medico_id, fecha_hora, fecha_hora_fin);

CREATE TABLE horario_medico (
    horario_id     BIGINT     NOT NULL AUTO_INCREMENT,
    medico_id      BIGINT     NOT NULL,
    dia_semana     TINYINT    NOT NULL COMMENT '1 = lunes ... 7 = domingo (ISO 8601)',
    hora_inicio    TIME       NOT NULL,
    hora_fin       TIME       NOT NULL,
    activo         TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME   NOT NULL,
    PRIMARY KEY (horario_id),
    CONSTRAINT fk_horario_medico FOREIGN KEY (medico_id) REFERENCES medico (id),
    CONSTRAINT ck_horario_dia CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT ck_horario_rango CHECK (hora_fin > hora_inicio),
    CONSTRAINT uk_horario_inicio UNIQUE (medico_id, dia_semana, hora_inicio)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Horario inicial de todos los veterinarios: lunes a viernes 7:00-12:00 y
-- 14:00-18:00; sábado 8:00-12:00 (el administrador lo ajusta en Médicos).
INSERT INTO horario_medico (medico_id, dia_semana, hora_inicio, hora_fin, activo, fecha_creacion)
SELECT m.id, d.dia, h.inicio, h.fin, 1, NOW()
FROM medico m
CROSS JOIN (SELECT 1 dia UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) d
CROSS JOIN (SELECT '07:00:00' inicio, '12:00:00' fin UNION ALL SELECT '14:00:00', '18:00:00') h;

INSERT INTO horario_medico (medico_id, dia_semana, hora_inicio, hora_fin, activo, fecha_creacion)
SELECT id, 6, '08:00:00', '12:00:00', 1, NOW() FROM medico;

CREATE TABLE cita_historial (
    historial_id    BIGINT       NOT NULL AUTO_INCREMENT,
    cita_id         BIGINT       NOT NULL,
    fecha           DATETIME     NOT NULL,
    usuario_id      INT          NULL,
    accion          VARCHAR(20)  NOT NULL,
    estado_anterior VARCHAR(20)  NULL,
    estado_nuevo    VARCHAR(20)  NULL,
    inicio_anterior DATETIME     NULL,
    inicio_nuevo    DATETIME     NULL,
    observacion     VARCHAR(500) NULL,
    PRIMARY KEY (historial_id),
    INDEX idx_cita_historial (cita_id, fecha),
    CONSTRAINT fk_cita_historial_cita FOREIGN KEY (cita_id) REFERENCES cita (cita_id),
    CONSTRAINT fk_cita_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT ck_cita_historial_accion CHECK (accion IN ('CREADA', 'EDITADA', 'REPROGRAMADA', 'ESTADO', 'REACTIVADA'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Las citas existentes quedan con su registro de creación.
INSERT INTO cita_historial (cita_id, fecha, usuario_id, accion, estado_nuevo, inicio_nuevo, observacion)
SELECT cita_id, fecha_creacion, NULL, 'CREADA', estado, fecha_hora, 'Registro anterior al historial de citas'
FROM cita;

-- Menú "Mi calendario": el veterinario lo usa en lugar de "Gestión de citas".
INSERT INTO menu (menu_id, code, title, url, icon, activo, fecha_creacion) VALUES
    (13, 'calendario', 'Mi calendario', '/inicio/calendario', 'fa-solid fa-calendar-days', 1, NOW());

DELETE pm FROM perfil_menu pm JOIN perfil p ON p.perfil_id = pm.perfil_id
WHERE p.codigo = 'VETERINARIO' AND pm.menu_id = 1;

INSERT INTO perfil_menu (perfil_id, menu_id)
SELECT perfil_id, 13 FROM perfil WHERE codigo = 'VETERINARIO';

-- =====================================================================
-- 6. Atención médica, tarifas y facturación (requerimiento 3)
--    - Especialidades activas / inactivas.
--    - Servicios con tarifa e IVA configurables y log de cambios.
--    - IVA de los productos del inventario.
--    - Atención: síntomas, recomendaciones y servicios prestados en la
--      historia clínica de la cita (con el valor de la tarifa congelado).
--    - Facturas (una por atención), detalle, pagos y anulación controlada.
-- =====================================================================

ALTER TABLE especializacion
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER codigo_especializacion;

ALTER TABLE medicamento
    ADD COLUMN iva_porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 0 AFTER precio_venta,
    ADD CONSTRAINT ck_medicamento_iva CHECK (iva_porcentaje BETWEEN 0 AND 100);

CREATE TABLE servicio (
    servicio_id         BIGINT        NOT NULL AUTO_INCREMENT,
    codigo              VARCHAR(20)   NOT NULL,
    nombre              VARCHAR(150)  NOT NULL,
    descripcion         VARCHAR(500)  NULL,
    tipo                VARCHAR(20)   NOT NULL,
    especializacion_id  BIGINT        NULL COMMENT 'NULL = aplica a cualquier especialidad',
    valor               DECIMAL(12, 2) NOT NULL,
    iva_porcentaje      DECIMAL(5, 2)  NOT NULL DEFAULT 0,
    activo              TINYINT(1)    NOT NULL DEFAULT 1,
    fecha_creacion      DATETIME      NOT NULL,
    fecha_modificacion  DATETIME      NULL,
    PRIMARY KEY (servicio_id),
    CONSTRAINT uk_servicio_codigo UNIQUE (codigo),
    CONSTRAINT fk_servicio_especializacion FOREIGN KEY (especializacion_id) REFERENCES especializacion (id),
    CONSTRAINT ck_servicio_tipo CHECK (tipo IN ('CONSULTA', 'PROCEDIMIENTO', 'LABORATORIO', 'OTRO')),
    CONSTRAINT ck_servicio_valor CHECK (valor >= 0),
    CONSTRAINT ck_servicio_iva CHECK (iva_porcentaje BETWEEN 0 AND 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE servicio_tarifa_log (
    log_id          BIGINT         NOT NULL AUTO_INCREMENT,
    servicio_id     BIGINT         NOT NULL,
    fecha           DATETIME       NOT NULL,
    usuario_id      INT            NULL,
    accion          VARCHAR(20)    NOT NULL,
    valor_anterior  DECIMAL(12, 2) NULL,
    valor_nuevo     DECIMAL(12, 2) NULL,
    iva_anterior    DECIMAL(5, 2)  NULL,
    iva_nuevo       DECIMAL(5, 2)  NULL,
    observacion     VARCHAR(255)   NULL,
    PRIMARY KEY (log_id),
    INDEX idx_tarifa_log (servicio_id, fecha),
    CONSTRAINT fk_tarifa_log_servicio FOREIGN KEY (servicio_id) REFERENCES servicio (servicio_id),
    CONSTRAINT fk_tarifa_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT ck_tarifa_log_accion CHECK (accion IN ('CREADO', 'MODIFICADO', 'ACTIVADO', 'INACTIVADO'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Tarifas iniciales: una consulta por especialidad y algunos procedimientos generales.
INSERT INTO servicio (codigo, nombre, descripcion, tipo, especializacion_id, valor, iva_porcentaje, activo, fecha_creacion)
SELECT CONCAT('CON-', codigo_especializacion), CONCAT('Consulta de ', nombre), 'Valor de la consulta de la especialidad',
       'CONSULTA', id,
       CASE codigo_especializacion WHEN 'MG' THEN 60000 WHEN 'ODO' THEN 80000 WHEN 'DER' THEN 85000 ELSE 95000 END,
       0, 1, NOW()
FROM especializacion;

INSERT INTO servicio (codigo, nombre, descripcion, tipo, especializacion_id, valor, iva_porcentaje, activo, fecha_creacion) VALUES
    ('PRO-VAC', 'Aplicación de vacuna', 'Aplicación de una dosis de vacuna (sin el biológico)', 'PROCEDIMIENTO', NULL, 25000, 0, 1, NOW()),
    ('PRO-CUR', 'Curación de herida', 'Limpieza y curación de herida superficial', 'PROCEDIMIENTO', NULL, 35000, 0, 1, NOW()),
    ('PRO-DES', 'Desparasitación', 'Administración de antiparasitario', 'PROCEDIMIENTO', NULL, 20000, 0, 1, NOW()),
    ('LAB-HEM', 'Hemograma', 'Cuadro hemático completo', 'LABORATORIO', NULL, 45000, 0, 1, NOW()),
    ('OTR-BAN', 'Baño medicado', 'Baño con champú terapéutico', 'OTRO', NULL, 40000, 19, 1, NOW());

INSERT INTO servicio_tarifa_log (servicio_id, fecha, usuario_id, accion, valor_nuevo, iva_nuevo, observacion)
SELECT servicio_id, NOW(), NULL, 'CREADO', valor, iva_porcentaje, 'Tarifa inicial'
FROM servicio;

-- Atención médica sobre la historia clínica de la cita.
ALTER TABLE historia_clinica
    MODIFY COLUMN diagnostico VARCHAR(1000) NULL,
    ADD COLUMN sintomas VARCHAR(1000) NULL AFTER motivo,
    ADD COLUMN recomendaciones VARCHAR(1000) NULL AFTER observaciones,
    ADD COLUMN fecha_finalizacion DATETIME NULL AFTER estado;

UPDATE historia_clinica SET fecha_finalizacion = fecha_creacion WHERE estado = 'CERRADA';

CREATE TABLE atencion_servicio (
    atencion_servicio_id BIGINT         NOT NULL AUTO_INCREMENT,
    historia_id          BIGINT         NOT NULL,
    servicio_id          BIGINT         NOT NULL,
    cantidad             INT            NOT NULL DEFAULT 1,
    valor_unitario       DECIMAL(12, 2) NOT NULL COMMENT 'Tarifa vigente al registrar el servicio',
    iva_porcentaje       DECIMAL(5, 2)  NOT NULL,
    observacion          VARCHAR(255)   NULL,
    fecha_creacion       DATETIME       NOT NULL,
    PRIMARY KEY (atencion_servicio_id),
    CONSTRAINT uk_atencion_servicio UNIQUE (historia_id, servicio_id),
    CONSTRAINT fk_atencion_servicio_historia FOREIGN KEY (historia_id) REFERENCES historia_clinica (historia_id),
    CONSTRAINT fk_atencion_servicio_servicio FOREIGN KEY (servicio_id) REFERENCES servicio (servicio_id),
    CONSTRAINT ck_atencion_servicio_cantidad CHECK (cantidad BETWEEN 1 AND 100)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE factura (
    factura_id            BIGINT         NOT NULL AUTO_INCREMENT,
    numero                VARCHAR(20)    NOT NULL,
    historia_id           BIGINT         NOT NULL,
    cliente_id            BIGINT         NOT NULL,
    mascota_id            INT            NOT NULL,
    medico_id             BIGINT         NOT NULL,
    especialidad          VARCHAR(100)   NOT NULL,
    fecha                 DATETIME       NOT NULL,
    subtotal              DECIMAL(14, 2) NOT NULL,
    descuento             DECIMAL(14, 2) NOT NULL DEFAULT 0,
    motivo_descuento      VARCHAR(255)   NULL,
    iva                   DECIMAL(14, 2) NOT NULL,
    total                 DECIMAL(14, 2) NOT NULL,
    pagado                DECIMAL(14, 2) NOT NULL DEFAULT 0,
    estado                VARCHAR(20)    NOT NULL,
    usuario_id            INT            NOT NULL,
    usuario_anulacion_id  INT            NULL,
    fecha_anulacion       DATETIME       NULL,
    motivo_anulacion      VARCHAR(255)   NULL,
    PRIMARY KEY (factura_id),
    CONSTRAINT uk_factura_numero UNIQUE (numero),
    INDEX idx_factura_historia (historia_id),
    INDEX idx_factura_cliente (cliente_id, fecha),
    INDEX idx_factura_mascota (mascota_id, fecha),
    INDEX idx_factura_fecha (fecha),
    CONSTRAINT fk_factura_historia FOREIGN KEY (historia_id) REFERENCES historia_clinica (historia_id),
    CONSTRAINT fk_factura_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (cliente_id),
    CONSTRAINT fk_factura_mascota FOREIGN KEY (mascota_id) REFERENCES mascota (mascota_id),
    CONSTRAINT fk_factura_medico FOREIGN KEY (medico_id) REFERENCES medico (id),
    CONSTRAINT fk_factura_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT fk_factura_usuario_anulacion FOREIGN KEY (usuario_anulacion_id) REFERENCES usuario (id),
    CONSTRAINT ck_factura_estado CHECK (estado IN ('PENDIENTE_PAGO', 'PAGO_PARCIAL', 'PAGADA', 'ANULADA')),
    CONSTRAINT ck_factura_valores CHECK (subtotal >= 0 AND descuento >= 0 AND descuento <= subtotal
        AND iva >= 0 AND total >= 0 AND pagado >= 0 AND pagado <= total)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE factura_detalle (
    detalle_id      BIGINT         NOT NULL AUTO_INCREMENT,
    factura_id      BIGINT         NOT NULL,
    tipo            VARCHAR(20)    NOT NULL,
    servicio_id     BIGINT         NULL,
    medicamento_id  BIGINT         NULL,
    descripcion     VARCHAR(200)   NOT NULL,
    cantidad        INT            NOT NULL,
    valor_unitario  DECIMAL(12, 2) NOT NULL,
    iva_porcentaje  DECIMAL(5, 2)  NOT NULL,
    subtotal        DECIMAL(14, 2) NOT NULL,
    descuento       DECIMAL(14, 2) NOT NULL DEFAULT 0,
    iva             DECIMAL(14, 2) NOT NULL,
    total           DECIMAL(14, 2) NOT NULL,
    PRIMARY KEY (detalle_id),
    CONSTRAINT fk_factura_detalle_factura FOREIGN KEY (factura_id) REFERENCES factura (factura_id),
    CONSTRAINT fk_factura_detalle_servicio FOREIGN KEY (servicio_id) REFERENCES servicio (servicio_id),
    CONSTRAINT fk_factura_detalle_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
    CONSTRAINT ck_factura_detalle_tipo CHECK (tipo IN ('SERVICIO', 'MEDICAMENTO')),
    CONSTRAINT ck_factura_detalle_cantidad CHECK (cantidad > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE pago (
    pago_id     BIGINT         NOT NULL AUTO_INCREMENT,
    factura_id  BIGINT         NOT NULL,
    fecha       DATETIME       NOT NULL,
    valor       DECIMAL(14, 2) NOT NULL,
    medio       VARCHAR(20)    NOT NULL,
    referencia  VARCHAR(100)   NULL,
    usuario_id  INT            NOT NULL,
    PRIMARY KEY (pago_id),
    INDEX idx_pago_factura (factura_id, fecha),
    CONSTRAINT fk_pago_factura FOREIGN KEY (factura_id) REFERENCES factura (factura_id),
    CONSTRAINT fk_pago_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT ck_pago_valor CHECK (valor > 0),
    CONSTRAINT ck_pago_medio CHECK (medio IN ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Menús: tarifas (administrador), atención (veterinario) y facturación (administrador y recepción).
INSERT INTO menu (menu_id, code, title, url, icon, activo, fecha_creacion) VALUES
    (14, 'tarifas', 'Tarifas y Servicios', '/inicio/tarifas', 'fa-solid fa-tags', 1, NOW()),
    (15, 'atencion', 'Atención Médica', '/inicio/atencion', 'fa-solid fa-stethoscope', 1, NOW()),
    (16, 'facturacion', 'Facturación', '/inicio/facturacion', 'fa-solid fa-file-invoice-dollar', 1, NOW());

INSERT INTO perfil_menu (perfil_id, menu_id)
SELECT perfil_id, 14 FROM perfil WHERE codigo = 'ADMIN'
UNION ALL SELECT perfil_id, 15 FROM perfil WHERE codigo = 'VETERINARIO'
UNION ALL SELECT perfil_id, 16 FROM perfil WHERE codigo IN ('ADMIN', 'RECEPCIONISTA');


-- =====================================================================
-- 7. Reportes administrativos y contables (requerimiento 4)
--    Menú para administración (todos los reportes) y recepción (gestión médica).
-- =====================================================================
INSERT INTO menu (menu_id, code, title, url, icon, activo, fecha_creacion) VALUES
    (17, 'reportes', 'Reportes', '/inicio/reportes', 'fa-solid fa-chart-column', 1, NOW());

INSERT INTO perfil_menu (perfil_id, menu_id)
SELECT perfil_id, 17 FROM perfil WHERE codigo IN ('ADMIN', 'RECEPCIONISTA');

-- =====================================================================
-- 8. Carga masiva de inventario (requerimiento 1.4)
--    Cada archivo queda registrado con su usuario, fecha, totales y el
--    resultado de cada fila (log de cargue). La importación se hace fila
--    por fila en transacciones independientes.
-- =====================================================================
CREATE TABLE carga_inventario (
    carga_id            BIGINT       NOT NULL AUTO_INCREMENT,
    archivo             VARCHAR(200) NOT NULL,
    formato             VARCHAR(10)  NOT NULL,
    usuario_id          INT          NOT NULL,
    fecha               DATETIME     NOT NULL,
    estado              VARCHAR(20)  NOT NULL,
    total_filas         INT          NOT NULL,
    filas_validas       INT          NOT NULL,
    filas_error         INT          NOT NULL,
    filas_importadas    INT          NOT NULL DEFAULT 0,
    fecha_confirmacion  DATETIME     NULL,
    PRIMARY KEY (carga_id),
    INDEX idx_carga_fecha (fecha),
    CONSTRAINT fk_carga_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    CONSTRAINT ck_carga_formato CHECK (formato IN ('XLSX', 'CSV')),
    CONSTRAINT ck_carga_estado CHECK (estado IN ('VALIDADA', 'CONFIRMADA', 'DESCARTADA'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE carga_inventario_detalle (
    detalle_id         BIGINT        NOT NULL AUTO_INCREMENT,
    carga_id           BIGINT        NOT NULL,
    fila               INT           NOT NULL,
    codigo             VARCHAR(50)   NULL,
    nombre             VARCHAR(150)  NULL,
    tipo               VARCHAR(30)   NULL,
    presentacion       VARCHAR(150)  NULL,
    descripcion        VARCHAR(500)  NULL,
    registro_invima    VARCHAR(50)   NULL,
    precio_venta       VARCHAR(30)   NULL,
    iva                VARCHAR(30)   NULL,
    stock_minimo       VARCHAR(30)   NULL,
    numero_lote        VARCHAR(50)   NULL,
    fecha_compra       VARCHAR(30)   NULL,
    fecha_vencimiento  VARCHAR(30)   NULL,
    cantidad           VARCHAR(30)   NULL,
    precio_compra      VARCHAR(30)   NULL,
    estado             VARCHAR(20)   NOT NULL,
    mensaje            VARCHAR(1000) NULL,
    medicamento_id     BIGINT        NULL,
    PRIMARY KEY (detalle_id),
    INDEX idx_carga_detalle (carga_id, fila),
    CONSTRAINT fk_carga_detalle_carga FOREIGN KEY (carga_id) REFERENCES carga_inventario (carga_id),
    CONSTRAINT fk_carga_detalle_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
    CONSTRAINT ck_carga_detalle_estado CHECK (estado IN ('VALIDA', 'ERROR', 'IMPORTADA', 'FALLIDA'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
