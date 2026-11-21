-- =====================================================================
--  CLÍNICA VETERINARIA UNIMINUTO - EXAMEN FINAL
--  Script de creación completo de la base de datos `clinica` (MySQL 8)
--
--  Conserva los nombres de tablas/columnas del proyecto base (cliente,
--  mascota, raza, medico, especializacion, cita, historia_medica,
--  anotacion_historia, formula_medica, medicamento, menu, perfil,
--  perfil_menu) y agrega las tablas de los módulos nuevos.
--  A diferencia del respaldo base, todos los tipos de las llaves
--  coinciden y se declaran las llaves foráneas (integridad referencial).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS clinica CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE clinica;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. SEGURIDAD: perfiles, menús, usuarios y sesiones
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS perfil;
CREATE TABLE perfil (
  perfil_id          INT          NOT NULL AUTO_INCREMENT,
  codigo             VARCHAR(30)  NOT NULL,
  nombre             VARCHAR(50)  NOT NULL,
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  fecha_creacion     DATETIME     NOT NULL,
  fecha_modificacion DATETIME     DEFAULT NULL,
  PRIMARY KEY (perfil_id),
  UNIQUE KEY uk_perfil_codigo (codigo)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS menu;
CREATE TABLE menu (
  menu_id            INT          NOT NULL AUTO_INCREMENT,
  code               VARCHAR(100) NOT NULL,
  title              VARCHAR(255) NOT NULL,
  url                LONGTEXT     NOT NULL,
  icon               VARCHAR(255) NOT NULL,
  orden              INT          NOT NULL DEFAULT 0,
  activo             TINYINT(1)   NOT NULL,
  fecha_creacion     DATETIME     NOT NULL,
  fecha_modificacion DATETIME     DEFAULT NULL,
  PRIMARY KEY (menu_id),
  UNIQUE KEY uk_menu_code (code)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS perfil_menu;
CREATE TABLE perfil_menu (
  perfil_menu_id INT NOT NULL AUTO_INCREMENT,
  perfil_id      INT NOT NULL,
  menu_id        INT NOT NULL,
  PRIMARY KEY (perfil_menu_id),
  UNIQUE KEY uk_perfil_menu (perfil_id, menu_id),
  CONSTRAINT fk_pm_perfil FOREIGN KEY (perfil_id) REFERENCES perfil (perfil_id),
  CONSTRAINT fk_pm_menu   FOREIGN KEY (menu_id)   REFERENCES menu (menu_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
  usuario_id         INT          NOT NULL AUTO_INCREMENT,
  username           VARCHAR(50)  NOT NULL,
  password_hash      VARCHAR(100) NOT NULL,
  nombre_completo    VARCHAR(150) NOT NULL,
  email              VARCHAR(150) DEFAULT NULL,
  perfil_id          INT          NOT NULL,
  medico_id          BIGINT       DEFAULT NULL COMMENT 'Obligatorio cuando el perfil es MEDICO',
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  ultimo_acceso      DATETIME     DEFAULT NULL,
  fecha_creacion     DATETIME     NOT NULL,
  fecha_modificacion DATETIME     DEFAULT NULL,
  PRIMARY KEY (usuario_id),
  UNIQUE KEY uk_usuario_username (username),
  UNIQUE KEY uk_usuario_medico (medico_id),
  CONSTRAINT fk_usuario_perfil FOREIGN KEY (perfil_id) REFERENCES perfil (perfil_id),
  CONSTRAINT fk_usuario_medico FOREIGN KEY (medico_id) REFERENCES medico (id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS usuario_sesion;
CREATE TABLE usuario_sesion (
  token             CHAR(64)   NOT NULL,
  usuario_id        INT        NOT NULL,
  fecha_creacion    DATETIME   NOT NULL,
  fecha_expiracion  DATETIME   NOT NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (token),
  KEY idx_sesion_usuario (usuario_id),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. MAESTROS: clientes (propietarios), razas, mascotas
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS cliente;
CREATE TABLE cliente (
  cliente_id       BIGINT       NOT NULL AUTO_INCREMENT,
  usuario_id       INT          DEFAULT NULL,
  tipo_documento   VARCHAR(10)  NOT NULL,
  numero_documento VARCHAR(20)  NOT NULL,
  nombres          VARCHAR(100) NOT NULL,
  apellidos        VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE         NOT NULL,
  genero           CHAR(1)      DEFAULT NULL,
  telefono         VARCHAR(20)  DEFAULT NULL,
  email            VARCHAR(150) DEFAULT NULL,
  direccion        TEXT,
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (cliente_id),
  UNIQUE KEY uk_cliente_documento (numero_documento),
  UNIQUE KEY uk_cliente_usuario (usuario_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS raza;
CREATE TABLE raza (
  raza_id            INT          NOT NULL AUTO_INCREMENT,
  nombre             VARCHAR(100) NOT NULL,
  especie            VARCHAR(100) NOT NULL,
  fecha_creacion     DATETIME     NOT NULL,
  fecha_modificacion DATETIME     DEFAULT NULL,
  PRIMARY KEY (raza_id),
  UNIQUE KEY uk_raza (nombre, especie)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS mascota;
CREATE TABLE mascota (
  mascota_id         INT          NOT NULL AUTO_INCREMENT,
  nombre_mascota     VARCHAR(100) NOT NULL,
  edad               INT          DEFAULT NULL,
  sexo               CHAR(1)      DEFAULT NULL,
  peso_kg            DECIMAL(6,2) DEFAULT NULL,
  fecha_registro     DATETIME     NOT NULL,
  fecha_modificacion DATETIME     DEFAULT NULL,
  cliente_id         BIGINT       NOT NULL,
  raza_id            INT          NOT NULL,
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (mascota_id),
  KEY idx_mascota_cliente (cliente_id),
  CONSTRAINT fk_mascota_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (cliente_id),
  CONSTRAINT fk_mascota_raza    FOREIGN KEY (raza_id)    REFERENCES raza (raza_id),
  CONSTRAINT ck_mascota_edad CHECK (edad IS NULL OR edad BETWEEN 0 AND 40)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. VETERINARIOS: especialidades, médicos, horarios de disponibilidad
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS especializacion;
CREATE TABLE especializacion (
  id                     BIGINT       NOT NULL AUTO_INCREMENT,
  codigo_especializacion VARCHAR(20)  NOT NULL,
  nombre                 VARCHAR(100) NOT NULL,
  descripcion            VARCHAR(500) NOT NULL,
  activo                 TINYINT(1)   NOT NULL DEFAULT 1,
  fecha_creacion         DATETIME     NOT NULL,
  fecha_modificacion     DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_especializacion_codigo (codigo_especializacion),
  UNIQUE KEY uk_especializacion_nombre (nombre)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS medico;
CREATE TABLE medico (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  tipo_documento       VARCHAR(10)  NOT NULL,
  numero_documento     VARCHAR(20)  NOT NULL,
  nombres              VARCHAR(100) NOT NULL,
  apellidos            VARCHAR(100) NOT NULL,
  telefono             VARCHAR(20)  DEFAULT NULL,
  email                VARCHAR(150) DEFAULT NULL,
  registro_profesional VARCHAR(50)  NOT NULL,
  especializacion_id   BIGINT       NOT NULL,
  estado               TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 activo, 0 inactivo',
  PRIMARY KEY (id),
  UNIQUE KEY uk_medico_documento (numero_documento),
  UNIQUE KEY uk_medico_registro (registro_profesional),
  CONSTRAINT fk_medico_especializacion FOREIGN KEY (especializacion_id) REFERENCES especializacion (id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS horario_medico;
CREATE TABLE horario_medico (
  id          BIGINT     NOT NULL AUTO_INCREMENT,
  medico_id   BIGINT     NOT NULL,
  dia_semana  TINYINT    NOT NULL COMMENT '1=lunes ... 7=domingo (ISO-8601)',
  hora_inicio TIME       NOT NULL,
  hora_fin    TIME       NOT NULL,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_horario_medico (medico_id, dia_semana),
  CONSTRAINT fk_horario_medico FOREIGN KEY (medico_id) REFERENCES medico (id),
  CONSTRAINT ck_horario_dia   CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT ck_horario_horas CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. CITAS: estados, citas y su historial
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS estado_cita;
CREATE TABLE estado_cita (
  codigo     VARCHAR(20) NOT NULL,
  nombre     VARCHAR(50) NOT NULL,
  color      VARCHAR(10) NOT NULL,
  es_final   TINYINT(1)  NOT NULL DEFAULT 0,
  orden      INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (codigo)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS cita;
CREATE TABLE cita (
  id                  BIGINT      NOT NULL AUTO_INCREMENT,
  cliente_id          BIGINT      NOT NULL,
  mascota_id          INT         NOT NULL,
  medico_id           BIGINT      NOT NULL,
  tarifa_id           BIGINT      DEFAULT NULL COMMENT 'Tipo de consulta / servicio principal',
  fecha_hora          DATETIME    NOT NULL,
  fecha_hora_fin      DATETIME    NOT NULL,
  estado              VARCHAR(20) NOT NULL,
  motivo              TEXT,
  motivo_cancelacion  VARCHAR(500) DEFAULT NULL,
  usuario_creacion_id INT         DEFAULT NULL,
  fecha_creacion      DATETIME    NOT NULL,
  fecha_modificacion  DATETIME    DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_cita_medico_fecha  (medico_id, fecha_hora),
  KEY idx_cita_mascota_fecha (mascota_id, fecha_hora),
  KEY idx_cita_estado (estado),
  CONSTRAINT fk_cita_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (cliente_id),
  CONSTRAINT fk_cita_mascota FOREIGN KEY (mascota_id) REFERENCES mascota (mascota_id),
  CONSTRAINT fk_cita_medico  FOREIGN KEY (medico_id)  REFERENCES medico (id),
  CONSTRAINT fk_cita_tarifa  FOREIGN KEY (tarifa_id)  REFERENCES tarifa (id),
  CONSTRAINT fk_cita_estado  FOREIGN KEY (estado)     REFERENCES estado_cita (codigo),
  CONSTRAINT fk_cita_usuario FOREIGN KEY (usuario_creacion_id) REFERENCES usuario (usuario_id),
  CONSTRAINT ck_cita_fechas CHECK (fecha_hora_fin > fecha_hora)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS cita_historial;
CREATE TABLE cita_historial (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  cita_id          BIGINT       NOT NULL,
  accion           VARCHAR(30)  NOT NULL COMMENT 'CREACION, EDICION, REPROGRAMACION, CAMBIO_ESTADO',
  estado_anterior  VARCHAR(20)  DEFAULT NULL,
  estado_nuevo     VARCHAR(20)  DEFAULT NULL,
  fecha_anterior   DATETIME     DEFAULT NULL,
  fecha_nueva      DATETIME     DEFAULT NULL,
  observacion      VARCHAR(500) DEFAULT NULL,
  usuario_id       INT          DEFAULT NULL,
  fecha            DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_cita_historial (cita_id),
  CONSTRAINT fk_cith_cita    FOREIGN KEY (cita_id)    REFERENCES cita (id),
  CONSTRAINT fk_cith_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. TARIFAS E IMPUESTOS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS impuesto;
CREATE TABLE impuesto (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  codigo             VARCHAR(20)  NOT NULL,
  nombre             VARCHAR(100) NOT NULL,
  tipo               VARCHAR(20)  NOT NULL COMMENT 'IVA, OTRO',
  porcentaje         DECIMAL(5,2) NOT NULL,
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  fecha_creacion     DATETIME     NOT NULL,
  fecha_modificacion DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_impuesto_codigo (codigo),
  CONSTRAINT ck_impuesto_pct CHECK (porcentaje >= 0 AND porcentaje <= 100)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS tarifa;
CREATE TABLE tarifa (
  id                 BIGINT        NOT NULL AUTO_INCREMENT,
  codigo             VARCHAR(20)   NOT NULL,
  nombre             VARCHAR(150)  NOT NULL,
  descripcion        VARCHAR(500)  DEFAULT NULL,
  tipo_servicio      VARCHAR(30)   NOT NULL COMMENT 'CONSULTA, PROCEDIMIENTO, VACUNACION, CIRUGIA, LABORATORIO, OTRO',
  especializacion_id BIGINT        DEFAULT NULL,
  valor              DECIMAL(14,2) NOT NULL,
  impuesto_id        BIGINT        NOT NULL,
  duracion_minutos   INT           NOT NULL DEFAULT 30,
  activo             TINYINT(1)    NOT NULL DEFAULT 1,
  fecha_creacion     DATETIME      NOT NULL,
  fecha_modificacion DATETIME      DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tarifa_codigo (codigo),
  CONSTRAINT fk_tarifa_especializacion FOREIGN KEY (especializacion_id) REFERENCES especializacion (id),
  CONSTRAINT fk_tarifa_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuesto (id),
  CONSTRAINT ck_tarifa_valor CHECK (valor >= 0),
  CONSTRAINT ck_tarifa_duracion CHECK (duracion_minutos BETWEEN 5 AND 480)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS tarifa_historial;
CREATE TABLE tarifa_historial (
  id                   BIGINT        NOT NULL AUTO_INCREMENT,
  tarifa_id            BIGINT        NOT NULL,
  accion               VARCHAR(20)   NOT NULL COMMENT 'CREACION, MODIFICACION, ACTIVACION, INACTIVACION',
  valor_anterior       DECIMAL(14,2) DEFAULT NULL,
  valor_nuevo          DECIMAL(14,2) DEFAULT NULL,
  impuesto_anterior    VARCHAR(20)   DEFAULT NULL,
  impuesto_nuevo       VARCHAR(20)   DEFAULT NULL,
  detalle              VARCHAR(1000) DEFAULT NULL,
  usuario_id           INT           NOT NULL,
  fecha                DATETIME      NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tarifa_historial (tarifa_id, fecha),
  CONSTRAINT fk_tarh_tarifa  FOREIGN KEY (tarifa_id)  REFERENCES tarifa (id),
  CONSTRAINT fk_tarh_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. INVENTARIO: medicamentos/productos, lotes, movimientos, cargas
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS medicamento;
CREATE TABLE medicamento (
  id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                      CHAR(8)       NOT NULL COMMENT '8 caracteres alfanuméricos',
  nombre                      VARCHAR(100)  NOT NULL,
  descripcion                 TEXT,
  presentacion                VARCHAR(100)  DEFAULT NULL,
  tipo_producto               VARCHAR(20)   NOT NULL DEFAULT 'MEDICAMENTO' COMMENT 'MEDICAMENTO, INSUMO, UTENSILIO',
  requiere_invima             TINYINT(1)    NOT NULL DEFAULT 1,
  registro_invima             VARCHAR(50)   DEFAULT NULL,
  unidad_medida               VARCHAR(30)   NOT NULL DEFAULT 'UNIDAD',
  precio_compra               DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'Último precio de compra',
  precio_venta                DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT 'Precio de venta al público',
  impuesto_id                 BIGINT        NOT NULL,
  stock_actual                INT           NOT NULL DEFAULT 0 COMMENT 'Suma de lotes activos',
  stock_minimo                INT           NOT NULL DEFAULT 0,
  fecha_compra                DATE          DEFAULT NULL COMMENT 'Fecha de la última compra',
  fecha_vence                 DATE          DEFAULT NULL COMMENT 'Vencimiento más próximo de lotes con existencia',
  fecha_ingreso               DATE          DEFAULT NULL COMMENT 'Fecha de ingreso al inventario',
  fecha_proximo_pedido        DATE          DEFAULT NULL,
  activo                      TINYINT(1)    NOT NULL DEFAULT 1,
  fecha_creacion_registro     DATETIME      NOT NULL,
  fecha_modificacion_registro DATETIME      DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_medicamento_codigo (codigo),
  UNIQUE KEY uk_medicamento_nombre (nombre),
  KEY idx_medicamento_vence (fecha_vence),
  CONSTRAINT fk_medicamento_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuesto (id),
  CONSTRAINT ck_medicamento_codigo CHECK (REGEXP_LIKE(codigo, '^[A-Za-z0-9]{8}$')),
  CONSTRAINT ck_medicamento_invima CHECK (requiere_invima = 0 OR (registro_invima IS NOT NULL AND registro_invima <> '')),
  CONSTRAINT ck_medicamento_stock  CHECK (stock_actual >= 0 AND stock_minimo >= 0),
  CONSTRAINT ck_medicamento_precio CHECK (precio_compra >= 0 AND precio_venta >= 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS lote_medicamento;
CREATE TABLE lote_medicamento (
  id                  BIGINT          NOT NULL AUTO_INCREMENT,
  medicamento_id      BIGINT UNSIGNED NOT NULL,
  numero_lote         VARCHAR(50)     NOT NULL,
  fecha_compra        DATE            NOT NULL,
  fecha_ingreso       DATE            NOT NULL,
  fecha_vencimiento   DATE            DEFAULT NULL COMMENT 'NULL para utensilios que no vencen',
  precio_compra       DECIMAL(14,2)   NOT NULL,
  cantidad_inicial    INT             NOT NULL,
  cantidad_disponible INT             NOT NULL,
  activo              TINYINT(1)      NOT NULL DEFAULT 1,
  usuario_id          INT             NOT NULL,
  fecha_creacion      DATETIME        NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lote (medicamento_id, numero_lote),
  KEY idx_lote_vencimiento (medicamento_id, fecha_vencimiento),
  CONSTRAINT fk_lote_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
  CONSTRAINT fk_lote_usuario     FOREIGN KEY (usuario_id)     REFERENCES usuario (usuario_id),
  CONSTRAINT ck_lote_cantidades CHECK (cantidad_disponible >= 0 AND cantidad_inicial > 0 AND cantidad_disponible <= cantidad_inicial),
  CONSTRAINT ck_lote_fechas CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento > fecha_compra),
  CONSTRAINT ck_lote_precio CHECK (precio_compra >= 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS carga_masiva;
CREATE TABLE carga_masiva (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  nombre_archivo       VARCHAR(255) NOT NULL,
  tipo_archivo         VARCHAR(10)  NOT NULL COMMENT 'XLSX, CSV',
  estado               VARCHAR(20)  NOT NULL COMMENT 'PREVISUALIZADA, CONFIRMADA, CANCELADA',
  total_registros      INT          NOT NULL DEFAULT 0,
  registros_validos    INT          NOT NULL DEFAULT 0,
  registros_error      INT          NOT NULL DEFAULT 0,
  registros_importados INT          NOT NULL DEFAULT 0,
  usuario_id           INT          NOT NULL,
  fecha_carga          DATETIME     NOT NULL,
  usuario_confirma_id  INT          DEFAULT NULL,
  fecha_confirmacion   DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_carga_usuario  FOREIGN KEY (usuario_id)          REFERENCES usuario (usuario_id),
  CONSTRAINT fk_carga_usuario2 FOREIGN KEY (usuario_confirma_id) REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS carga_masiva_detalle;
CREATE TABLE carga_masiva_detalle (
  id             BIGINT          NOT NULL AUTO_INCREMENT,
  carga_id       BIGINT          NOT NULL,
  fila           INT             NOT NULL,
  codigo         VARCHAR(50)     DEFAULT NULL,
  nombre         VARCHAR(255)    DEFAULT NULL,
  datos          TEXT            NOT NULL COMMENT 'Fila leída (formato clave=valor)',
  valido         TINYINT(1)      NOT NULL,
  errores        TEXT,
  estado         VARCHAR(20)     NOT NULL COMMENT 'VALIDO, ERROR, IMPORTADO, FALLIDO',
  medicamento_id BIGINT UNSIGNED DEFAULT NULL,
  lote_id        BIGINT          DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_cmd_carga (carga_id, fila),
  CONSTRAINT fk_cmd_carga       FOREIGN KEY (carga_id)       REFERENCES carga_masiva (id),
  CONSTRAINT fk_cmd_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
  CONSTRAINT fk_cmd_lote        FOREIGN KEY (lote_id)        REFERENCES lote_medicamento (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. ATENCIÓN MÉDICA: historia clínica, anotaciones, servicios prestados
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS historia_medica;
CREATE TABLE historia_medica (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  paciente_id     INT          NOT NULL COMMENT 'Mascota',
  cliente_id      BIGINT       NOT NULL,
  cita_id         BIGINT       NOT NULL,
  medico_id       BIGINT       NOT NULL,
  fecha_hora      DATETIME     NOT NULL,
  motivo          TEXT         NOT NULL,
  sintomas        TEXT,
  diagnostico     TEXT,
  observaciones   TEXT,
  recomendaciones TEXT,
  peso_kg         DECIMAL(6,2) DEFAULT NULL,
  temperatura_c   DECIMAL(4,1) DEFAULT NULL,
  estado          VARCHAR(20)  NOT NULL DEFAULT 'ABIERTA' COMMENT 'ABIERTA, CERRADA',
  fecha_creacion  DATETIME     NOT NULL,
  fecha_cierre    DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_historia_cita (cita_id),
  KEY idx_historia_mascota (paciente_id, fecha_hora),
  CONSTRAINT fk_historia_mascota FOREIGN KEY (paciente_id) REFERENCES mascota (mascota_id),
  CONSTRAINT fk_historia_cliente FOREIGN KEY (cliente_id)  REFERENCES cliente (cliente_id),
  CONSTRAINT fk_historia_cita    FOREIGN KEY (cita_id)     REFERENCES cita (id),
  CONSTRAINT fk_historia_medico  FOREIGN KEY (medico_id)   REFERENCES medico (id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS anotacion_historia;
CREATE TABLE anotacion_historia (
  id            BIGINT   NOT NULL AUTO_INCREMENT,
  historia_id   BIGINT   NOT NULL,
  medico_id     BIGINT   NOT NULL,
  cita_id       BIGINT   NOT NULL,
  fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  descripcion   TEXT     NOT NULL,
  diagnostico   TEXT,
  observaciones TEXT,
  PRIMARY KEY (id),
  CONSTRAINT fk_anot_historia FOREIGN KEY (historia_id) REFERENCES historia_medica (id),
  CONSTRAINT fk_anot_medico   FOREIGN KEY (medico_id)   REFERENCES medico (id),
  CONSTRAINT fk_anot_cita     FOREIGN KEY (cita_id)     REFERENCES cita (id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS atencion_servicio;
CREATE TABLE atencion_servicio (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  cita_id     BIGINT       NOT NULL,
  tarifa_id   BIGINT       NOT NULL,
  cantidad    INT          NOT NULL DEFAULT 1,
  observacion VARCHAR(500) DEFAULT NULL,
  usuario_id  INT          NOT NULL,
  fecha       DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_atencion_servicio (cita_id, tarifa_id) COMMENT 'Un servicio no se registra dos veces en la misma atención',
  CONSTRAINT fk_ats_cita    FOREIGN KEY (cita_id)    REFERENCES cita (id),
  CONSTRAINT fk_ats_tarifa  FOREIGN KEY (tarifa_id)  REFERENCES tarifa (id),
  CONSTRAINT fk_ats_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id),
  CONSTRAINT ck_ats_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. FÓRMULAS MÉDICAS (encabezado + detalle) e historial de estados
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS formula_medica;
CREATE TABLE formula_medica (
  id                           BIGINT      NOT NULL AUTO_INCREMENT,
  numero                       VARCHAR(20) DEFAULT NULL,
  cita_id                      BIGINT      NOT NULL,
  mascota_id                   INT         NOT NULL,
  medico_id                    BIGINT      NOT NULL,
  historia_id                  BIGINT      DEFAULT NULL,
  fecha_emision                DATE        NOT NULL,
  estado                       VARCHAR(20) NOT NULL COMMENT 'BORRADOR, CONFIRMADA, ANULADA',
  estado_despacho              VARCHAR(30) NOT NULL COMMENT 'NO_APLICA, PENDIENTE_DESPACHO, EN_PREPARACION, DESPACHO_PARCIAL, DESPACHADO, PENDIENTE_DISPONIBILIDAD, CANCELADO',
  indicaciones                 TEXT,
  usuario_id                   INT         NOT NULL,
  fecha_confirmacion           DATETIME    DEFAULT NULL,
  activo                       TINYINT(1)  NOT NULL DEFAULT 1,
  fecha_creacion_registro      DATETIME    NOT NULL,
  fecha_actualizacion_registro DATETIME    DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_formula_numero (numero),
  KEY idx_formula_despacho (estado_despacho),
  CONSTRAINT fk_formula_cita     FOREIGN KEY (cita_id)     REFERENCES cita (id),
  CONSTRAINT fk_formula_mascota  FOREIGN KEY (mascota_id)  REFERENCES mascota (mascota_id),
  CONSTRAINT fk_formula_medico   FOREIGN KEY (medico_id)   REFERENCES medico (id),
  CONSTRAINT fk_formula_historia FOREIGN KEY (historia_id) REFERENCES historia_medica (id),
  CONSTRAINT fk_formula_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS formula_medica_detalle;
CREATE TABLE formula_medica_detalle (
  id                   BIGINT          NOT NULL AUTO_INCREMENT,
  formula_id           BIGINT          NOT NULL,
  medicamento_id       BIGINT UNSIGNED NOT NULL,
  dosis                VARCHAR(100)    NOT NULL COMMENT 'Texto: 1 tableta, 2 ml ...',
  dosis_cantidad       DECIMAL(8,2)    NOT NULL COMMENT 'Unidades de inventario por toma',
  frecuencia_horas     INT             NOT NULL,
  duracion_dias        INT             NOT NULL,
  cantidad_prescrita   INT             NOT NULL,
  cantidad_despachada  INT             NOT NULL DEFAULT 0,
  via_administracion   VARCHAR(30)     NOT NULL,
  indicaciones         TEXT,
  PRIMARY KEY (id),
  UNIQUE KEY uk_formula_medicamento (formula_id, medicamento_id),
  CONSTRAINT fk_fmd_formula     FOREIGN KEY (formula_id)     REFERENCES formula_medica (id),
  CONSTRAINT fk_fmd_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
  CONSTRAINT ck_fmd_valores CHECK (dosis_cantidad > 0 AND frecuencia_horas BETWEEN 1 AND 168
                                   AND duracion_dias BETWEEN 1 AND 365 AND cantidad_prescrita > 0),
  CONSTRAINT ck_fmd_despacho CHECK (cantidad_despachada >= 0 AND cantidad_despachada <= cantidad_prescrita)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS formula_estado_historial;
CREATE TABLE formula_estado_historial (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  formula_id      BIGINT       NOT NULL,
  estado_anterior VARCHAR(30)  DEFAULT NULL,
  estado_nuevo    VARCHAR(30)  NOT NULL,
  observacion     VARCHAR(500) DEFAULT NULL,
  usuario_id      INT          NOT NULL,
  fecha           DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_feh_formula (formula_id, fecha),
  CONSTRAINT fk_feh_formula FOREIGN KEY (formula_id) REFERENCES formula_medica (id),
  CONSTRAINT fk_feh_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. DESPACHO / DISPENSACIÓN
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS despacho;
CREATE TABLE despacho (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  numero               VARCHAR(20)  DEFAULT NULL,
  formula_id           BIGINT       NOT NULL,
  clave_idempotencia   VARCHAR(64)  NOT NULL COMMENT 'Evita doble descuento por reenvío',
  estado_resultante    VARCHAR(30)  NOT NULL,
  observaciones        VARCHAR(1000) DEFAULT NULL,
  usuario_id           INT          NOT NULL,
  fecha_despacho       DATETIME     NOT NULL,
  revertido            TINYINT(1)   NOT NULL DEFAULT 0,
  motivo_reversion     VARCHAR(500) DEFAULT NULL,
  usuario_reversion_id INT          DEFAULT NULL,
  fecha_reversion      DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_despacho_numero (numero),
  UNIQUE KEY uk_despacho_idempotencia (clave_idempotencia),
  KEY idx_despacho_formula (formula_id),
  CONSTRAINT fk_desp_formula   FOREIGN KEY (formula_id)           REFERENCES formula_medica (id),
  CONSTRAINT fk_desp_usuario   FOREIGN KEY (usuario_id)           REFERENCES usuario (usuario_id),
  CONSTRAINT fk_desp_usuario_r FOREIGN KEY (usuario_reversion_id) REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS despacho_detalle;
CREATE TABLE despacho_detalle (
  id                 BIGINT          NOT NULL AUTO_INCREMENT,
  despacho_id        BIGINT          NOT NULL,
  formula_detalle_id BIGINT          NOT NULL,
  medicamento_id     BIGINT UNSIGNED NOT NULL,
  lote_id            BIGINT          NOT NULL,
  cantidad           INT             NOT NULL,
  precio_venta       DECIMAL(14,2)   NOT NULL COMMENT 'Precio vigente al despachar',
  PRIMARY KEY (id),
  KEY idx_dd_despacho (despacho_id),
  CONSTRAINT fk_dd_despacho FOREIGN KEY (despacho_id)        REFERENCES despacho (id),
  CONSTRAINT fk_dd_fdetalle FOREIGN KEY (formula_detalle_id) REFERENCES formula_medica_detalle (id),
  CONSTRAINT fk_dd_medic    FOREIGN KEY (medicamento_id)     REFERENCES medicamento (id),
  CONSTRAINT fk_dd_lote     FOREIGN KEY (lote_id)            REFERENCES lote_medicamento (id),
  CONSTRAINT ck_dd_cantidad CHECK (cantidad > 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS movimiento_inventario;
CREATE TABLE movimiento_inventario (
  id                  BIGINT          NOT NULL AUTO_INCREMENT,
  medicamento_id      BIGINT UNSIGNED NOT NULL,
  lote_id             BIGINT          DEFAULT NULL,
  tipo                VARCHAR(20)     NOT NULL COMMENT 'ENTRADA, SALIDA',
  concepto            VARCHAR(30)     NOT NULL COMMENT 'COMPRA, CARGA_MASIVA, DISPENSACION, REVERSION_DISPENSACION, AJUSTE',
  cantidad            INT             NOT NULL,
  saldo_anterior      INT             NOT NULL,
  saldo_nuevo         INT             NOT NULL,
  costo_unitario      DECIMAL(14,2)   NOT NULL DEFAULT 0,
  formula_id          BIGINT          DEFAULT NULL,
  despacho_id         BIGINT          DEFAULT NULL,
  despacho_detalle_id BIGINT          DEFAULT NULL,
  carga_id            BIGINT          DEFAULT NULL,
  observacion         VARCHAR(500)    DEFAULT NULL,
  usuario_id          INT             NOT NULL,
  fecha               DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY idx_mov_medicamento (medicamento_id, fecha),
  KEY idx_mov_fecha (fecha),
  CONSTRAINT fk_mov_medicamento FOREIGN KEY (medicamento_id)      REFERENCES medicamento (id),
  CONSTRAINT fk_mov_lote        FOREIGN KEY (lote_id)             REFERENCES lote_medicamento (id),
  CONSTRAINT fk_mov_formula     FOREIGN KEY (formula_id)          REFERENCES formula_medica (id),
  CONSTRAINT fk_mov_despacho    FOREIGN KEY (despacho_id)         REFERENCES despacho (id),
  CONSTRAINT fk_mov_ddetalle    FOREIGN KEY (despacho_detalle_id) REFERENCES despacho_detalle (id),
  CONSTRAINT fk_mov_carga       FOREIGN KEY (carga_id)            REFERENCES carga_masiva (id),
  CONSTRAINT fk_mov_usuario     FOREIGN KEY (usuario_id)          REFERENCES usuario (usuario_id),
  CONSTRAINT ck_mov_cantidad CHECK (cantidad > 0 AND saldo_anterior >= 0 AND saldo_nuevo >= 0),
  CONSTRAINT ck_mov_tipo CHECK (tipo IN ('ENTRADA','SALIDA')),
  -- Toda salida por dispensación debe estar ligada a un despacho y a una fórmula
  CONSTRAINT ck_mov_dispensacion CHECK (concepto <> 'DISPENSACION' OR (despacho_id IS NOT NULL AND formula_id IS NOT NULL))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. FACTURACIÓN Y PAGOS
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS factura;
CREATE TABLE factura (
  id                     BIGINT        NOT NULL AUTO_INCREMENT,
  numero                 VARCHAR(20)   DEFAULT NULL,
  cita_id                BIGINT        NOT NULL,
  cliente_id             BIGINT        NOT NULL,
  mascota_id             INT           NOT NULL,
  medico_id              BIGINT        NOT NULL,
  especializacion        VARCHAR(100)  NOT NULL COMMENT 'Copia histórica',
  fecha_generacion       DATETIME      NOT NULL,
  subtotal               DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_descuento        DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_impuestos        DECIMAL(14,2) NOT NULL DEFAULT 0,
  total                  DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_pagado           DECIMAL(14,2) NOT NULL DEFAULT 0,
  saldo                  DECIMAL(14,2) NOT NULL DEFAULT 0,
  estado                 VARCHAR(20)   NOT NULL COMMENT 'PENDIENTE, PAGO_PARCIAL, PAGADA, ANULADA',
  observaciones          VARCHAR(1000) DEFAULT NULL,
  usuario_id             INT           NOT NULL,
  usuario_autoriza_dcto  INT           DEFAULT NULL,
  motivo_anulacion       VARCHAR(500)  DEFAULT NULL,
  usuario_anulacion_id   INT           DEFAULT NULL,
  fecha_anulacion        DATETIME      DEFAULT NULL,
  -- Columna generada: una cita sólo puede tener UNA factura no anulada
  cita_activa_id BIGINT GENERATED ALWAYS AS (CASE WHEN estado <> 'ANULADA' THEN cita_id ELSE NULL END) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factura_numero (numero),
  UNIQUE KEY uk_factura_cita_activa (cita_activa_id),
  KEY idx_factura_fecha (fecha_generacion),
  KEY idx_factura_cliente (cliente_id),
  CONSTRAINT fk_fac_cita     FOREIGN KEY (cita_id)    REFERENCES cita (id),
  CONSTRAINT fk_fac_cliente  FOREIGN KEY (cliente_id) REFERENCES cliente (cliente_id),
  CONSTRAINT fk_fac_mascota  FOREIGN KEY (mascota_id) REFERENCES mascota (mascota_id),
  CONSTRAINT fk_fac_medico   FOREIGN KEY (medico_id)  REFERENCES medico (id),
  CONSTRAINT fk_fac_usuario  FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id),
  CONSTRAINT fk_fac_usuario2 FOREIGN KEY (usuario_autoriza_dcto) REFERENCES usuario (usuario_id),
  CONSTRAINT fk_fac_usuario3 FOREIGN KEY (usuario_anulacion_id)  REFERENCES usuario (usuario_id),
  CONSTRAINT ck_fac_valores CHECK (subtotal >= 0 AND total_descuento >= 0 AND total_impuestos >= 0
                                   AND total >= 0 AND total_pagado >= 0 AND saldo >= 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS factura_detalle;
CREATE TABLE factura_detalle (
  id                   BIGINT          NOT NULL AUTO_INCREMENT,
  factura_id           BIGINT          NOT NULL,
  tipo_item            VARCHAR(20)     NOT NULL COMMENT 'SERVICIO, PRODUCTO',
  tarifa_id            BIGINT          DEFAULT NULL,
  medicamento_id       BIGINT UNSIGNED DEFAULT NULL,
  despacho_detalle_id  BIGINT          DEFAULT NULL,
  descripcion          VARCHAR(255)    NOT NULL,
  cantidad             INT             NOT NULL,
  precio_unitario      DECIMAL(14,2)   NOT NULL,
  porcentaje_descuento DECIMAL(5,2)    NOT NULL DEFAULT 0,
  valor_descuento      DECIMAL(14,2)   NOT NULL DEFAULT 0,
  subtotal             DECIMAL(14,2)   NOT NULL COMMENT 'cantidad * precio - descuento',
  impuesto_codigo      VARCHAR(20)     NOT NULL,
  impuesto_porcentaje  DECIMAL(5,2)    NOT NULL,
  valor_impuesto       DECIMAL(14,2)   NOT NULL,
  total                DECIMAL(14,2)   NOT NULL,
  activo               TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '0 cuando la factura se anula',
  -- Un producto dispensado sólo puede estar en UNA factura vigente
  despacho_detalle_activo BIGINT GENERATED ALWAYS AS (CASE WHEN activo = 1 THEN despacho_detalle_id ELSE NULL END) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fd_servicio (factura_id, tarifa_id),
  UNIQUE KEY uk_fd_despacho (despacho_detalle_activo),
  CONSTRAINT fk_fd_factura  FOREIGN KEY (factura_id)          REFERENCES factura (id),
  CONSTRAINT fk_fd_tarifa   FOREIGN KEY (tarifa_id)           REFERENCES tarifa (id),
  CONSTRAINT fk_fd_medic    FOREIGN KEY (medicamento_id)      REFERENCES medicamento (id),
  CONSTRAINT fk_fd_ddetalle FOREIGN KEY (despacho_detalle_id) REFERENCES despacho_detalle (id),
  CONSTRAINT ck_fd_tipo CHECK ((tipo_item = 'SERVICIO' AND tarifa_id IS NOT NULL)
                            OR (tipo_item = 'PRODUCTO' AND medicamento_id IS NOT NULL AND despacho_detalle_id IS NOT NULL)),
  CONSTRAINT ck_fd_valores CHECK (cantidad > 0 AND precio_unitario >= 0 AND porcentaje_descuento BETWEEN 0 AND 100)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS pago;
CREATE TABLE pago (
  id                   BIGINT        NOT NULL AUTO_INCREMENT,
  factura_id           BIGINT        NOT NULL,
  fecha_pago           DATETIME      NOT NULL,
  valor                DECIMAL(14,2) NOT NULL,
  metodo_pago          VARCHAR(30)   NOT NULL COMMENT 'EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA',
  referencia           VARCHAR(100)  DEFAULT NULL,
  usuario_id           INT           NOT NULL,
  anulado              TINYINT(1)    NOT NULL DEFAULT 0,
  motivo_anulacion     VARCHAR(500)  DEFAULT NULL,
  usuario_anulacion_id INT           DEFAULT NULL,
  fecha_anulacion      DATETIME      DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_pago_factura (factura_id),
  KEY idx_pago_fecha (fecha_pago),
  CONSTRAINT fk_pago_factura  FOREIGN KEY (factura_id)           REFERENCES factura (id),
  CONSTRAINT fk_pago_usuario  FOREIGN KEY (usuario_id)           REFERENCES usuario (usuario_id),
  CONSTRAINT fk_pago_usuario2 FOREIGN KEY (usuario_anulacion_id) REFERENCES usuario (usuario_id),
  CONSTRAINT ck_pago_valor CHECK (valor > 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS factura_historial;
CREATE TABLE factura_historial (
  id              BIGINT        NOT NULL AUTO_INCREMENT,
  factura_id      BIGINT        NOT NULL,
  accion          VARCHAR(30)   NOT NULL COMMENT 'GENERACION, PAGO, ANULACION_PAGO, ANULACION, AGREGAR_PRODUCTOS',
  estado_anterior VARCHAR(20)   DEFAULT NULL,
  estado_nuevo    VARCHAR(20)   DEFAULT NULL,
  detalle         VARCHAR(1000) DEFAULT NULL,
  usuario_id      INT           NOT NULL,
  fecha           DATETIME      NOT NULL,
  PRIMARY KEY (id),
  KEY idx_fh_factura (factura_id),
  CONSTRAINT fk_fh_factura FOREIGN KEY (factura_id) REFERENCES factura (id),
  CONSTRAINT fk_fh_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (usuario_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
