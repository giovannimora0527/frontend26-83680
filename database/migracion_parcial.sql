-- Ejecutar UNA SOLA VEZ despues de importar clinica_base_sin_credenciales.sql.
-- La migracion amplia el modelo para cubrir los campos requeridos por el segundo parcial.
USE clinica;

ALTER TABLE formula_medica
  ADD COLUMN frecuencia VARCHAR(100) NULL,
  ADD COLUMN duracion_tratamiento VARCHAR(100) NULL,
  ADD COLUMN fecha_emision DATETIME NULL,
  ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

-- El esquema previo no separaba fecha de emision y fecha de creacion del registro.
-- Se conserva fecha_creacion_registro como auditoria; la fecha de emision historica se
-- inicializa en la fecha mas tardia entre creacion y consulta asociada para no dejar
-- la formula antes de la consulta en los registros preexistentes.
UPDATE formula_medica f
LEFT JOIN cita c ON c.id = f.cita_id
SET f.fecha_emision = CASE
  WHEN c.fecha_hora IS NOT NULL AND f.fecha_creacion_registro < c.fecha_hora THEN c.fecha_hora
  ELSE f.fecha_creacion_registro
END
WHERE f.fecha_emision IS NULL;

ALTER TABLE historia_medica
  ADD COLUMN cita_id BIGINT UNSIGNED NULL,
  ADD COLUMN medico_id BIGINT UNSIGNED NULL,
  ADD COLUMN fecha_hora DATETIME NULL,
  ADD COLUMN motivo_consulta TEXT NULL,
  ADD COLUMN diagnostico TEXT NULL,
  ADD COLUMN observaciones TEXT NULL;

ALTER TABLE anotacion_historia
  ADD COLUMN observacion TEXT NULL,
  ADD COLUMN diagnostico TEXT NULL;

-- Una cita puede originar como maximo una historia clinica.
CREATE UNIQUE INDEX uq_historia_medica_cita ON historia_medica (cita_id);

-- Indices que ayudan a los filtros y ordenamientos principales.
CREATE INDEX idx_cita_fecha_hora ON cita (fecha_hora);
CREATE INDEX idx_formula_emision_activo ON formula_medica (activo, fecha_emision);
CREATE INDEX idx_anotacion_historia_fecha ON anotacion_historia (historia_id, fecha);
