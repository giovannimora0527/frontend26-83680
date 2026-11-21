-- =====================================================================
--  MIGRACIÓN DESDE LA BASE ENTREGADA (opcional)
--  Para quien ya tiene la BD del segundo corte: transforma las tablas
--  cuya estructura original se conoce (medicamento - enunciado del examen;
--  menu, perfil, perfil_menu - respaldo entregado). Las tablas nuevas se
--  crean con 01_schema.sql (sección correspondiente).
--  Para una instalación limpia NO se usa: basta con 01_schema + 02_seed.
-- =====================================================================
USE clinica;

-- 1. medicamento: código de 8 caracteres, tipo de producto, INVIMA, precios,
--    existencias consolidadas, stock mínimo, fechas de ingreso y próximo pedido.
ALTER TABLE medicamento
  ADD COLUMN codigo CHAR(8) NULL AFTER id,
  ADD COLUMN tipo_producto VARCHAR(20) NOT NULL DEFAULT 'MEDICAMENTO' AFTER presentacion,
  ADD COLUMN requiere_invima TINYINT(1) NOT NULL DEFAULT 1 AFTER tipo_producto,
  ADD COLUMN registro_invima VARCHAR(50) NULL AFTER requiere_invima,
  ADD COLUMN unidad_medida VARCHAR(30) NOT NULL DEFAULT 'UNIDAD' AFTER registro_invima,
  ADD COLUMN precio_compra DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER unidad_medida,
  ADD COLUMN precio_venta DECIMAL(14,2) NOT NULL DEFAULT 0 AFTER precio_compra,
  ADD COLUMN impuesto_id BIGINT NULL AFTER precio_venta,
  ADD COLUMN stock_actual INT NOT NULL DEFAULT 0 AFTER impuesto_id,
  ADD COLUMN stock_minimo INT NOT NULL DEFAULT 0 AFTER stock_actual,
  ADD COLUMN fecha_ingreso DATE NULL AFTER fecha_vence,
  ADD COLUMN fecha_proximo_pedido DATE NULL AFTER fecha_ingreso,
  ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER fecha_proximo_pedido,
  MODIFY fecha_compra DATE NULL,
  MODIFY fecha_vence DATE NULL;

-- Código provisional para registros existentes (MED + id con ceros) y registro INVIMA pendiente
UPDATE medicamento SET codigo = CONCAT('MED', LPAD(id, 5, '0')) WHERE codigo IS NULL;
UPDATE medicamento SET registro_invima = 'PENDIENTE' WHERE registro_invima IS NULL AND requiere_invima = 1;
UPDATE medicamento SET impuesto_id = (SELECT id FROM impuesto WHERE codigo = 'IVA19') WHERE impuesto_id IS NULL;

ALTER TABLE medicamento
  MODIFY codigo CHAR(8) NOT NULL,
  MODIFY impuesto_id BIGINT NOT NULL,
  DROP INDEX id,
  ADD UNIQUE KEY uk_medicamento_codigo (codigo),
  ADD CONSTRAINT fk_medicamento_impuesto FOREIGN KEY (impuesto_id) REFERENCES impuesto (id),
  ADD CONSTRAINT ck_medicamento_codigo CHECK (REGEXP_LIKE(codigo, '^[A-Za-z0-9]{8}$')),
  ADD CONSTRAINT ck_medicamento_invima CHECK (requiere_invima = 0 OR (registro_invima IS NOT NULL AND registro_invima <> '')),
  ADD CONSTRAINT ck_medicamento_stock CHECK (stock_actual >= 0 AND stock_minimo >= 0);

-- Las existencias reales de los medicamentos existentes se ingresan después como lotes
-- (compra o carga masiva), porque la tabla original no guardaba cantidades.

-- 2. perfil: código técnico usado por el backend para autorizar
ALTER TABLE perfil ADD COLUMN codigo VARCHAR(30) NULL AFTER perfil_id;
UPDATE perfil SET codigo = CASE perfil_id WHEN 1 THEN 'ADMIN' WHEN 2 THEN 'RECEPCION' WHEN 3 THEN 'MEDICO' END;
INSERT INTO perfil (perfil_id, codigo, nombre, activo, fecha_creacion) VALUES (4, 'DESPACHO_MEDICO', 'Despacho médico', 1, NOW());
ALTER TABLE perfil MODIFY codigo VARCHAR(30) NOT NULL, ADD UNIQUE KEY uk_perfil_codigo (codigo);

-- 3. menu: orden de presentación + menús nuevos
ALTER TABLE menu ADD COLUMN orden INT NOT NULL DEFAULT 0 AFTER icon, ADD UNIQUE KEY uk_menu_code (code);
INSERT INTO menu (menu_id, code, title, url, icon, orden, activo, fecha_creacion) VALUES
 (10, 'agenda',      'Mi agenda médica',         '/inicio/agenda',      'bi bi-calendar-week',             21, 1, NOW()),
 (11, 'facturacion', 'Facturación y pagos',      '/inicio/facturacion', 'fa-solid fa-file-invoice-dollar', 60, 1, NOW()),
 (12, 'reportes',    'Reportes',                 '/inicio/reportes',    'fa-solid fa-chart-line',          90, 1, NOW()),
 (13, 'despacho',    'Despacho de medicamentos', '/inicio/despacho',    'fa-solid fa-truck-medical',       55, 1, NOW()),
 (14, 'perfiles',    'Perfiles y permisos',      '/inicio/perfiles',    'bi bi-shield-lock',               96, 1, NOW());

-- 4. perfil_menu: integridad referencial y sin duplicados; se reasignan menús por perfil
DELETE FROM perfil_menu;
ALTER TABLE perfil_menu
  ADD UNIQUE KEY uk_perfil_menu (perfil_id, menu_id),
  ADD CONSTRAINT fk_pm_perfil FOREIGN KEY (perfil_id) REFERENCES perfil (perfil_id),
  ADD CONSTRAINT fk_pm_menu   FOREIGN KEY (menu_id)   REFERENCES menu (menu_id);
INSERT INTO perfil_menu (perfil_id, menu_id) VALUES
 (1,1),(1,2),(1,3),(1,5),(1,6),(1,7),(1,8),(1,9),(1,11),(1,12),(1,14),
 (2,1),(2,2),(2,6),(2,11),
 (3,10),(3,5),(3,4),(3,7),
 (4,7),(4,13);
