-- =====================================================================
-- Script de base de datos - Clínica veterinaria (MySQL 8)
-- Esquema derivado de las entidades JPA del backend (ddl-auto=none).
-- Incluye llaves foráneas reales para impedir información huérfana
-- y datos de ejemplo para probar el flujo completo.
-- =====================================================================
CREATE DATABASE IF NOT EXISTS clinica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinica;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS formula_medica, anotacion_historia, historia_clinica, cita, mascota,
    medicamento, `Medico`, especializacion, raza, cliente;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE cliente (
    cliente_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT NULL,
    tipo_documento   VARCHAR(255) NOT NULL,
    numero_documento VARCHAR(255) NOT NULL,
    nombres          VARCHAR(255) NOT NULL,
    apellidos        VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero           VARCHAR(255) NULL,
    telefono         VARCHAR(255) NULL,
    direccion        VARCHAR(255) NULL,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_cliente_documento (tipo_documento, numero_documento)
);

CREATE TABLE raza (
    raza_id            INT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(100) NOT NULL,
    especie            VARCHAR(100) NOT NULL,
    fecha_creacion     DATETIME NOT NULL,
    fecha_modificacion DATETIME NULL
);

CREATE TABLE mascota (
    mascota_id         INT AUTO_INCREMENT PRIMARY KEY,
    nombre_mascota     VARCHAR(100) NOT NULL,
    edad               INT NOT NULL,
    raza_id            INT NOT NULL,
    cliente_id         BIGINT NOT NULL,
    fecha_registro     DATETIME NOT NULL,
    fecha_modificacion DATETIME NULL,
    CONSTRAINT fk_mascota_raza    FOREIGN KEY (raza_id)    REFERENCES raza (raza_id),
    CONSTRAINT fk_mascota_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (cliente_id)
);

CREATE TABLE especializacion (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre                 VARCHAR(100) NOT NULL UNIQUE,
    descripcion            VARCHAR(255) NULL,
    codigo_especializacion VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE `Medico` (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento      VARCHAR(10)  NOT NULL,
    numero_documento    VARCHAR(20)  NOT NULL,
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    telefono            VARCHAR(20)  NULL,
    registro_profesional VARCHAR(50) NOT NULL,
    especializacion_id  BIGINT NOT NULL,
    CONSTRAINT fk_medico_especializacion FOREIGN KEY (especializacion_id) REFERENCES especializacion (id)
);

CREATE TABLE medicamento (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre                      VARCHAR(255) NULL,
    descripcion                 VARCHAR(255) NULL,
    presentacion                VARCHAR(255) NULL,
    fecha_compra                DATE NULL,
    fecha_vence                 DATE NULL,
    fecha_creacion_registro     DATETIME NULL,
    fecha_modificacion_registro DATETIME NULL
);

CREATE TABLE cita (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    mascota_id INT NOT NULL,
    medico_id  BIGINT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    motivo     TEXT NULL,
    estado     VARCHAR(50) NULL,
    CONSTRAINT fk_cita_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (cliente_id),
    CONSTRAINT fk_cita_mascota FOREIGN KEY (mascota_id) REFERENCES mascota (mascota_id),
    CONSTRAINT fk_cita_medico  FOREIGN KEY (medico_id)  REFERENCES `Medico` (id),
    KEY idx_cita_fecha (fecha_hora),
    KEY idx_cita_medico_fecha (medico_id, fecha_hora)
);

CREATE TABLE historia_clinica (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id      BIGINT NOT NULL,
    mascota_id      INT NOT NULL,
    cita_id         BIGINT NOT NULL,
    medico_id       BIGINT NOT NULL,
    fecha_hora      DATETIME NOT NULL,
    motivo_consulta TEXT NOT NULL,
    diagnostico     TEXT NOT NULL,
    observaciones   TEXT NULL,
    estado          VARCHAR(20) NOT NULL,
    fecha_creacion  DATETIME NOT NULL,
    CONSTRAINT fk_historia_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (cliente_id),
    CONSTRAINT fk_historia_mascota FOREIGN KEY (mascota_id) REFERENCES mascota (mascota_id),
    CONSTRAINT fk_historia_cita    FOREIGN KEY (cita_id)    REFERENCES cita (id),
    CONSTRAINT fk_historia_medico  FOREIGN KEY (medico_id)  REFERENCES `Medico` (id),
    UNIQUE KEY uq_historia_cita (cita_id)   -- una historia por cita atendida
);

CREATE TABLE anotacion_historia (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    historia_id           BIGINT NOT NULL,
    medico_id             BIGINT NOT NULL,
    fecha                 DATETIME NOT NULL,
    descripcion           VARCHAR(255) NOT NULL,
    observacion           TEXT NULL,
    diagnostico_evolucion TEXT NULL,
    CONSTRAINT fk_anotacion_historia FOREIGN KEY (historia_id) REFERENCES historia_clinica (id),
    CONSTRAINT fk_anotacion_medico   FOREIGN KEY (medico_id)   REFERENCES `Medico` (id)
);

CREATE TABLE formula_medica (
    id                         BIGINT AUTO_INCREMENT PRIMARY KEY,
    cita_id                    BIGINT NOT NULL,
    historia_id                BIGINT NULL,
    mascota_id                 INT NULL,
    medico_id                  BIGINT NULL,
    medicamento_id             BIGINT NOT NULL,
    fecha_emision              DATETIME NULL,
    dosis                      VARCHAR(255) NOT NULL,
    frecuencia                 VARCHAR(100) NULL,
    duracion_dias              INT NULL,
    indicaciones               VARCHAR(255) NULL,
    fecha_creacion_registro    DATETIME NOT NULL,
    fecha_actualizacion_registro DATETIME NULL,
    activa                     BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_formula_cita        FOREIGN KEY (cita_id)        REFERENCES cita (id),
    CONSTRAINT fk_formula_historia    FOREIGN KEY (historia_id)    REFERENCES historia_clinica (id),
    CONSTRAINT fk_formula_mascota     FOREIGN KEY (mascota_id)     REFERENCES mascota (mascota_id),
    CONSTRAINT fk_formula_medico      FOREIGN KEY (medico_id)      REFERENCES `Medico` (id),
    CONSTRAINT fk_formula_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id)
);

-- ---------------------------- Datos de ejemplo ----------------------------
INSERT INTO cliente (usuario_id, tipo_documento, numero_documento, nombres, apellidos, fecha_nacimiento, genero, telefono, direccion, activo) VALUES
 (NULL,'CC','1010101010','Laura','Gómez Pérez','1990-04-12','F','3001112233','Calle 10 # 5-20',TRUE),
 (NULL,'CC','2020202020','Carlos','Ramírez Soto','1985-09-30','M','3012223344','Carrera 7 # 45-10',TRUE),
 (NULL,'CE','3030303030','Marta','Quintero Ruiz','1978-01-22','F','3023334455','Av. 68 # 12-34',TRUE);

INSERT INTO raza (nombre, especie, fecha_creacion) VALUES
 ('Labrador','Perro',NOW()), ('Criollo','Gato',NOW()), ('Siamés','Gato',NOW()), ('Beagle','Perro',NOW());

INSERT INTO mascota (nombre_mascota, edad, raza_id, cliente_id, fecha_registro) VALUES
 ('Rocky',4,1,1,NOW()), ('Misu',2,2,1,NOW()), ('Luna',6,3,2,NOW()), ('Toby',1,4,3,NOW());

INSERT INTO especializacion (nombre, descripcion, codigo_especializacion) VALUES
 ('Medicina general','Atención primaria de pequeñas especies','MG'),
 ('Dermatología','Enfermedades de la piel','DER');

INSERT INTO `Medico` (tipo_documento, numero_documento, nombres, apellidos, telefono, registro_profesional, especializacion_id) VALUES
 ('CC','7001','Andrea','Torres Mejía','3101112233','MV-1001',1),
 ('CC','7002','Felipe','Duarte Lara','3112223344','MV-1002',2);

INSERT INTO medicamento (nombre, descripcion, presentacion, fecha_compra, fecha_vence, fecha_creacion_registro) VALUES
 ('Amoxicilina','Antibiótico de amplio espectro','Tabletas 250 mg','2026-01-10','2028-01-10',NOW()),
 ('Meloxicam','Antiinflamatorio','Suspensión oral 1.5 mg/ml','2026-02-05','2028-02-05',NOW()),
 ('Ivermectina','Antiparasitario','Solución inyectable 1%','2026-03-01','2028-03-01',NOW());
