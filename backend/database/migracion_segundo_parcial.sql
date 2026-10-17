-- =====================================================================
-- Migración del segundo parcial (Clínica Veterinaria)
-- Ajusta el esquema existente a los requerimientos del enunciado:
--   * Historia clínica: "observaciones" (antes "tratamiento") y "estado".
--   * Anotación: descripción, observación y diagnóstico/evolución.
--   * Fórmulas médicas (tabla nueva, asociada a la historia clínica).
--   * Usuarios del sistema (tabla nueva) y su relación con cliente.
--   * Restricciones de unicidad para evitar duplicados.
-- Ejecutar una sola vez sobre la base "clinica".
-- =====================================================================

USE clinica;

-- ---------------------------------------------------------------------
-- Historia clínica
-- ---------------------------------------------------------------------
ALTER TABLE historia_clinica
    RENAME COLUMN tratamiento TO observaciones;

ALTER TABLE historia_clinica
    ADD COLUMN estado VARCHAR(10) NOT NULL DEFAULT 'ABIERTA' AFTER observaciones;

-- ---------------------------------------------------------------------
-- Anotaciones: el texto libre pasa a ser la descripción y se agregan
-- observación y diagnóstico/evolución.
-- ---------------------------------------------------------------------
ALTER TABLE anotacion
    RENAME COLUMN texto TO descripcion;

ALTER TABLE anotacion
    ADD COLUMN observacion VARCHAR(1000) NULL AFTER descripcion,
    ADD COLUMN diagnostico VARCHAR(1000) NOT NULL DEFAULT 'Sin registrar' AFTER observacion;

ALTER TABLE anotacion
    ALTER COLUMN diagnostico DROP DEFAULT;

-- ---------------------------------------------------------------------
-- Unicidad: un documento por cliente y una raza por especie.
-- ---------------------------------------------------------------------
ALTER TABLE cliente
    ADD CONSTRAINT uk_cliente_documento UNIQUE (tipo_documento, numero_documento);

ALTER TABLE raza
    ADD CONSTRAINT uk_raza_nombre_especie UNIQUE (nombre, especie);

-- ---------------------------------------------------------------------
-- Usuarios del sistema. La contraseña se guarda como hash PBKDF2, nunca
-- en texto plano.
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id                 INT          NOT NULL AUTO_INCREMENT,
    username           VARCHAR(30)  NOT NULL,
    email              VARCHAR(120) NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    rol                VARCHAR(20)  NOT NULL,
    activo             TINYINT(1)   NOT NULL DEFAULT 1,
    fecha_creacion     DATETIME     NOT NULL,
    fecha_modificacion DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_usuario_username UNIQUE (username),
    CONSTRAINT uk_usuario_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE cliente
    ADD CONSTRAINT fk_cliente_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id);

-- ---------------------------------------------------------------------
-- Fórmulas médicas. La mascota se obtiene de la historia clínica (no se
-- duplica) y la fórmula nunca se borra: se inactiva.
-- ---------------------------------------------------------------------
CREATE TABLE formula_medica (
    formula_id         BIGINT        NOT NULL AUTO_INCREMENT,
    historia_id        BIGINT        NOT NULL,
    medico_id          BIGINT        NOT NULL,
    medicamento_id     BIGINT        NOT NULL,
    fecha_emision      DATE          NOT NULL,
    dosis              DECIMAL(10,2) NOT NULL,
    unidad_dosis       VARCHAR(20)   NOT NULL,
    frecuencia_horas   INT           NOT NULL,
    duracion_dias      INT           NOT NULL,
    indicaciones       VARCHAR(1000) NOT NULL,
    estado             VARCHAR(10)   NOT NULL DEFAULT 'ACTIVA',
    fecha_creacion     DATETIME      NOT NULL,
    fecha_modificacion DATETIME      NULL,
    PRIMARY KEY (formula_id),
    KEY idx_formula_historia (historia_id),
    KEY idx_formula_creacion (fecha_creacion),
    CONSTRAINT fk_formula_historia FOREIGN KEY (historia_id) REFERENCES historia_clinica (historia_id),
    CONSTRAINT fk_formula_medico FOREIGN KEY (medico_id) REFERENCES medico (id),
    CONSTRAINT fk_formula_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
    CONSTRAINT ck_formula_dosis CHECK (dosis > 0),
    CONSTRAINT ck_formula_frecuencia CHECK (frecuencia_horas BETWEEN 1 AND 168),
    CONSTRAINT ck_formula_duracion CHECK (duracion_dias BETWEEN 1 AND 365)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Médicos y mascotas: evitar duplicados.
--   * Un documento y un registro profesional por veterinario.
--   * Un cliente no puede tener dos mascotas con el mismo nombre.
-- ---------------------------------------------------------------------
ALTER TABLE medico
    ADD CONSTRAINT uk_medico_documento UNIQUE (tipo_documento, numero_documento),
    ADD CONSTRAINT uk_medico_registro UNIQUE (registro_profesional);

ALTER TABLE mascota
    ADD CONSTRAINT uk_mascota_cliente_nombre UNIQUE (cliente_id, nombre_mascota);
