-- =====================================================================
--  DATOS INICIALES Y DE PRUEBA
--  Las fechas de citas y lotes se calculan con CURDATE() para que la
--  demostración siempre tenga citas próximas, lotes por vencer, etc.
--  Los valores de tarifas e impuestos son de ejemplo y se configuran
--  desde el módulo "Especialidades y tarifas".
-- =====================================================================
USE clinica;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------- Perfiles
INSERT INTO perfil (perfil_id, codigo, nombre, activo, fecha_creacion) VALUES
 (1, 'ADMIN',           'Administrador',   1, '2026-01-01 00:00:00'),
 (2, 'RECEPCION',       'Recepcion',       1, '2026-01-01 00:00:00'),
 (3, 'MEDICO',          'Medico',          1, '2026-01-01 00:00:00'),
 (4, 'DESPACHO_MEDICO', 'Despacho médico', 1, '2026-01-01 00:00:00');

-- ---------------------------------------------------------------- Menús
-- Se conservan los 9 menús del respaldo base (mismo id, code y url)
INSERT INTO menu (menu_id, code, title, url, icon, orden, activo, fecha_creacion) VALUES
 (1,  'cita',              'Gestión de citas',             '/inicio/citas',             'bi bi-calendar',                     20, 1, '2026-01-01 00:00:00'),
 (2,  'clientes',          'Gestión de clientes',          '/inicio/clientes',          'bi bi-person-check',                 10, 1, '2026-01-01 00:00:00'),
 (3,  'especializaciones', 'Especialidades y tarifas',     '/inicio/especializaciones', 'fa-solid fa-user-graduate',          80, 1, '2026-01-01 00:00:00'),
 (4,  'formulas',          'Fórmulas médicas',             '/inicio/formulas',          'fa-solid fa-clipboard-list',         40, 1, '2026-01-01 00:00:00'),
 (5,  'historias',         'Historias clínicas',           '/inicio/historias',         'fa-solid fa-book-medical',           35, 1, '2026-01-01 00:00:00'),
 (6,  'mascotas',          'Gestión de mascotas',          '/inicio/mascotas',          'fa-solid fa-paw',                    15, 1, '2026-01-01 00:00:00'),
 (7,  'medicamentos',      'Inventario de medicamentos',   '/inicio/medicamentos',      'fa-solid fa-capsules',               50, 1, '2026-01-01 00:00:00'),
 (8,  'medicos',           'Gestión de médicos',           '/inicio/medicos',           'fa-solid fa-user-doctor',            70, 1, '2026-01-01 00:00:00'),
 (9,  'usuarios',          'Gestión de usuarios',          '/inicio/usuarios',          'feather icon-users',                 95, 1, '2026-01-01 00:00:00'),
 (10, 'agenda',            'Mi agenda médica',             '/inicio/agenda',            'bi bi-calendar-week',                21, 1, '2026-01-01 00:00:00'),
 (11, 'facturacion',       'Facturación y pagos',          '/inicio/facturacion',       'fa-solid fa-file-invoice-dollar',    60, 1, '2026-01-01 00:00:00'),
 (12, 'reportes',          'Reportes',                     '/inicio/reportes',          'fa-solid fa-chart-line',             90, 1, '2026-01-01 00:00:00'),
 (13, 'despacho',          'Despacho de medicamentos',     '/inicio/despacho',          'fa-solid fa-truck-medical',          55, 1, '2026-01-01 00:00:00'),
 (14, 'perfiles',          'Perfiles y permisos',          '/inicio/perfiles',          'bi bi-shield-lock',                  96, 1, '2026-01-01 00:00:00');

-- ADMIN
INSERT INTO perfil_menu (perfil_id, menu_id) VALUES
 (1,1),(1,2),(1,3),(1,5),(1,6),(1,7),(1,8),(1,9),(1,11),(1,12),(1,14);
-- RECEPCION (secretaria): módulo de citas ya desarrollado
INSERT INTO perfil_menu (perfil_id, menu_id) VALUES (2,1),(2,2),(2,6),(2,11);
-- MEDICO: agenda con calendario (nuevo), historias, fórmulas, consulta de inventario
INSERT INTO perfil_menu (perfil_id, menu_id) VALUES (3,10),(3,5),(3,4),(3,7);
-- DESPACHO_MEDICO: sólo inventario (consulta) y despacho
INSERT INTO perfil_menu (perfil_id, menu_id) VALUES (4,7),(4,13);

-- ---------------------------------------------------------------- Impuestos
INSERT INTO impuesto (id, codigo, nombre, tipo, porcentaje, activo, fecha_creacion) VALUES
 (1, 'IVA19',    'IVA general 19%',  'IVA', 19.00, 1, NOW()),
 (2, 'IVA5',     'IVA reducido 5%',  'IVA',  5.00, 1, NOW()),
 (3, 'EXCLUIDO', 'Excluido de IVA',  'IVA',  0.00, 1, NOW());

-- ---------------------------------------------------------------- Especialidades
INSERT INTO especializacion (id, codigo_especializacion, nombre, descripcion, activo, fecha_creacion) VALUES
 (1, 'MEDGEN', 'Medicina general',        'Consulta y control general de mascotas', 1, NOW()),
 (2, 'DERMA',  'Dermatología',            'Enfermedades de piel, pelo y uñas',      1, NOW()),
 (3, 'CIRUG',  'Cirugía',                 'Procedimientos quirúrgicos',             1, NOW()),
 (4, 'ODONT',  'Odontología veterinaria', 'Salud oral y dental',                    1, NOW());

-- ---------------------------------------------------------------- Tarifas
INSERT INTO tarifa (id, codigo, nombre, descripcion, tipo_servicio, especializacion_id, valor, impuesto_id, duracion_minutos, activo, fecha_creacion) VALUES
 (1, 'CONS-GEN',  'Consulta medicina general',  'Consulta de control o primera vez', 'CONSULTA',      1,  60000, 1, 30, 1, NOW()),
 (2, 'CONS-DER',  'Consulta dermatología',      'Valoración dermatológica',          'CONSULTA',      2,  90000, 1, 30, 1, NOW()),
 (3, 'CONS-CIR',  'Valoración prequirúrgica',   'Valoración por cirugía',            'CONSULTA',      3, 100000, 1, 45, 1, NOW()),
 (4, 'CONS-ODO',  'Consulta odontológica',      'Valoración oral',                   'CONSULTA',      4,  80000, 1, 30, 1, NOW()),
 (5, 'VAC-RAB',   'Vacuna antirrábica',         'Aplicación de vacuna',              'VACUNACION',    1,  45000, 3, 15, 1, NOW()),
 (6, 'PROC-CUR',  'Curación simple',            'Limpieza y curación de heridas',    'PROCEDIMIENTO', NULL, 35000, 1, 20, 1, NOW()),
 (7, 'CIR-EST',   'Esterilización',             'Ovariohisterectomía / orquiectomía','CIRUGIA',       3, 350000, 1, 120, 1, NOW()),
 (8, 'LAB-HEM',   'Hemograma',                  'Cuadro hemático completo',          'LABORATORIO',   NULL, 55000, 1, 15, 1, NOW()),
 (9, 'ODO-PROF',  'Profilaxis dental',          'Limpieza dental con ultrasonido',   'PROCEDIMIENTO', 4, 180000, 1, 60, 1, NOW());

-- ---------------------------------------------------------------- Médicos y horarios
INSERT INTO medico (id, tipo_documento, numero_documento, nombres, apellidos, telefono, email, registro_profesional, especializacion_id, estado) VALUES
 (1, 'CC', '79111222', 'Carlos',  'Pérez Rojas',   '3001112222', 'cperez@clinica.test',  'MV-10001', 1, 1),
 (2, 'CC', '52333444', 'Laura',   'Gómez Díaz',    '3003334444', 'lgomez@clinica.test',  'MV-10002', 2, 1),
 (3, 'CC', '80555666', 'Andrés',  'Ríos Moreno',   '3005556666', 'arios@clinica.test',   'MV-10003', 3, 1),
 (4, 'CC', '1010777888','Diana',  'Castro León',   '3007778888', 'dcastro@clinica.test', 'MV-10004', 4, 0);

-- Lunes a viernes 08:00-12:00 y 14:00-18:00, sábado 08:00-12:00
INSERT INTO horario_medico (medico_id, dia_semana, hora_inicio, hora_fin, activo)
SELECT m.id, d.dia, h.ini, h.fin, 1
FROM medico m
CROSS JOIN (SELECT 1 dia UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) d
CROSS JOIN (SELECT '08:00:00' ini, '12:00:00' fin UNION ALL SELECT '14:00:00', '18:00:00') h;
INSERT INTO horario_medico (medico_id, dia_semana, hora_inicio, hora_fin, activo)
SELECT id, 6, '08:00:00', '12:00:00', 1 FROM medico;

-- ---------------------------------------------------------------- Usuarios de prueba
-- Contraseñas de PRUEBA (BCrypt): ver README. No son contraseñas reales.
INSERT INTO usuario (usuario_id, username, password_hash, nombre_completo, email, perfil_id, medico_id, activo, fecha_creacion) VALUES
 (1, 'admin',     '$2a$10$hV5eApGfzblzev2TMqiV0.p6tOGgcpgc8noZWoS4Acjkgv7fgUZ1G', 'Administrador del sistema', 'admin@clinica.test',     1, NULL, 1, NOW()),
 (2, 'recepcion', '$2a$10$m53y2WG4.Pm3OKlWf27AtuWxP/SK45Er4OCTSOd7bxcgVUwRx7d4C', 'Sandra Recepción',          'recepcion@clinica.test', 2, NULL, 1, NOW()),
 (3, 'cperez',    '$2a$10$kF.r.50nPJd3M9ggewjY6enzBMD111jJnUphbaAdEt39EnPXJzM.G', 'Carlos Pérez Rojas',        'cperez@clinica.test',    3, 1,    1, NOW()),
 (4, 'lgomez',    '$2a$10$kF.r.50nPJd3M9ggewjY6enzBMD111jJnUphbaAdEt39EnPXJzM.G', 'Laura Gómez Díaz',          'lgomez@clinica.test',    3, 2,    1, NOW()),
 (5, 'arios',     '$2a$10$kF.r.50nPJd3M9ggewjY6enzBMD111jJnUphbaAdEt39EnPXJzM.G', 'Andrés Ríos Moreno',        'arios@clinica.test',     3, 3,    1, NOW()),
 (6, 'despacho',  '$2a$10$kVNsjC1N4B4Fzgrv3W7iq.f1cYfg6kkPblpz3.MVijiFpH1NdYpA.', 'Jorge Despacho',            'despacho@clinica.test',  4, NULL, 1, NOW());

-- ---------------------------------------------------------------- Estados de cita
INSERT INTO estado_cita (codigo, nombre, color, es_final, orden) VALUES
 ('PENDIENTE',   'Pendiente',    '#f0ad4e', 0, 1),
 ('PROGRAMADA',  'Programada',   '#5bc0de', 0, 2),
 ('CONFIRMADA',  'Confirmada',   '#0d6efd', 0, 3),
 ('EN_ATENCION', 'En atención',  '#6f42c1', 0, 4),
 ('ATENDIDA',    'Finalizada',   '#198754', 1, 5),
 ('CANCELADA',   'Cancelada',    '#dc3545', 1, 6);

-- ---------------------------------------------------------------- Clientes, razas, mascotas
INSERT INTO cliente (cliente_id, tipo_documento, numero_documento, nombres, apellidos, fecha_nacimiento, genero, telefono, email, direccion, activo) VALUES
 (1, 'CC', '1020304050', 'María',     'López Torres',   '1988-04-12', 'F', '3101234567', 'maria.lopez@correo.test',  'Calle 80 # 20-15, Bogotá', 1),
 (2, 'CC', '79856321',   'Juan',      'Martínez Ruiz',  '1979-09-30', 'M', '3112345678', 'juan.martinez@correo.test','Cra 15 # 45-10, Bogotá',   1),
 (3, 'CC', '1032456789', 'Valentina', 'Herrera Cruz',   '1995-01-22', 'F', '3123456789', 'vale.herrera@correo.test', 'Av. 68 # 13-40, Bogotá',   1),
 (4, 'CE', 'E9876543',   'Pedro',     'Salazar Mejía',  '1983-07-05', 'M', '3134567890', 'pedro.salazar@correo.test','Calle 100 # 7-33, Bogotá', 1),
 (5, 'CC', '52789456',   'Ana',       'Ramírez Ortiz',  '1990-11-17', 'F', '3145678901', 'ana.ramirez@correo.test',  'Cra 7 # 72-10, Bogotá',    1),
 (6, 'CC', '80123987',   'Luis',      'Fernández Gil',  '1975-03-08', 'M', '3156789012', NULL,                       'Calle 26 # 50-20, Bogotá', 1);

INSERT INTO raza (raza_id, nombre, especie, fecha_creacion) VALUES
 (1, 'Labrador Retriever', 'Canino', NOW()),
 (2, 'Criollo',            'Canino', NOW()),
 (3, 'Bulldog Francés',    'Canino', NOW()),
 (4, 'Golden Retriever',   'Canino', NOW()),
 (5, 'Siamés',             'Felino', NOW()),
 (6, 'Criollo',            'Felino', NOW()),
 (7, 'Persa',              'Felino', NOW()),
 (8, 'Holland Lop',        'Conejo', NOW());

INSERT INTO mascota (mascota_id, nombre_mascota, edad, sexo, peso_kg, fecha_registro, cliente_id, raza_id, activo) VALUES
 (1, 'Max',    5, 'M', 30.50, NOW(), 1, 1, 1),
 (2, 'Luna',   3, 'H',  4.20, NOW(), 1, 5, 1),
 (3, 'Rocky',  8, 'M', 12.00, NOW(), 2, 2, 1),
 (4, 'Kira',   2, 'H', 11.30, NOW(), 3, 3, 1),
 (5, 'Simba',  6, 'M',  5.10, NOW(), 4, 6, 1),
 (6, 'Toby',   1, 'M',  9.80, NOW(), 5, 4, 1),
 (7, 'Nala',   4, 'H',  3.90, NOW(), 5, 7, 1),
 (8, 'Copito', 2, 'M',  1.80, NOW(), 6, 8, 1);

-- ---------------------------------------------------------------- Inventario
INSERT INTO medicamento (id, codigo, nombre, descripcion, presentacion, tipo_producto, requiere_invima, registro_invima, unidad_medida,
                         precio_compra, precio_venta, impuesto_id, stock_minimo, fecha_proximo_pedido, activo, fecha_creacion_registro) VALUES
 (1,  'AMOX0500', 'Amoxicilina 500 mg',          'Antibiótico de amplio espectro',     'Caja x 20 tabletas', 'MEDICAMENTO', 1, 'INVIMA 2021M-0012345', 'TABLETA',  800,  1500, 2, 40, CURDATE() + INTERVAL 20 DAY, 1, NOW()),
 (2,  'MELO0015', 'Meloxicam 1.5 mg/ml',         'Antiinflamatorio no esteroideo',     'Frasco 10 ml',       'MEDICAMENTO', 1, 'INVIMA 2020M-0098765', 'FRASCO', 18000, 32000, 2,  5, CURDATE() + INTERVAL 15 DAY, 1, NOW()),
 (3,  'IVER0010', 'Ivermectina 1%',              'Antiparasitario',                    'Frasco 50 ml',       'MEDICAMENTO', 1, 'INVIMA 2019M-0045678', 'FRASCO', 22000, 39000, 2,  5, CURDATE() + INTERVAL 30 DAY, 1, NOW()),
 (4,  'PRED0005', 'Prednisolona 5 mg',           'Corticoide',                         'Caja x 30 tabletas', 'MEDICAMENTO', 1, 'INVIMA 2022M-0011122', 'TABLETA',  350,   900, 2, 30, CURDATE() + INTERVAL 10 DAY, 1, NOW()),
 (5,  'METR0250', 'Metronidazol 250 mg',         'Antibiótico / antiprotozoario',      'Caja x 20 tabletas', 'MEDICAMENTO', 1, 'INVIMA 2021M-0033344', 'TABLETA',  450,  1100, 2, 20, CURDATE() + INTERVAL 25 DAY, 1, NOW()),
 (6,  'ENRO0050', 'Enrofloxacina 50 mg',         'Antibiótico fluoroquinolona',        'Caja x 10 tabletas', 'MEDICAMENTO', 1, 'INVIMA 2020M-0055566', 'TABLETA',  900,  2100, 2, 20, CURDATE() + INTERVAL 5 DAY,  1, NOW()),
 (7,  'VRAB0001', 'Vacuna antirrábica',          'Vacuna inactivada',                  'Dosis 1 ml',         'MEDICAMENTO', 1, 'INVIMA 2023M-0077788', 'DOSIS',  12000, 20000, 3, 10, CURDATE() + INTERVAL 40 DAY, 1, NOW()),
 (8,  'OMEP0020', 'Omeprazol 20 mg',             'Protector gástrico',                 'Caja x 14 cápsulas', 'MEDICAMENTO', 1, 'INVIMA 2021M-0099900', 'CAPSULA',  300,   800, 2, 20, CURDATE() + INTERVAL 7 DAY,  1, NOW()),
 (9,  'JERI0003', 'Jeringa desechable 3 ml',     'Jeringa estéril con aguja',          'Unidad',             'INSUMO',      0, NULL,                   'UNIDAD',   250,   600, 1, 50, CURDATE() + INTERVAL 30 DAY, 1, NOW()),
 (10, 'GASA0010', 'Gasa estéril 10x10',          'Paquete de gasas estériles',         'Paquete x 10',       'INSUMO',      0, NULL,                   'PAQUETE', 1500,  3000, 1, 20, CURDATE() + INTERVAL 30 DAY, 1, NOW()),
 (11, 'COLL0001', 'Collar isabelino talla M',    'Collar de protección post-operatorio','Unidad',            'UTENSILIO',   0, NULL,                   'UNIDAD',  9000, 18000, 1,  3, CURDATE() + INTERVAL 30 DAY, 1, NOW()),
 (12, 'TRAM0050', 'Tramadol 50 mg',              'Analgésico opioide',                 'Caja x 10 tabletas', 'MEDICAMENTO', 1, 'INVIMA 2022M-0012121', 'TABLETA', 1200,  2500, 2, 10, CURDATE() + INTERVAL 3 DAY,  1, NOW());

INSERT INTO lote_medicamento (id, medicamento_id, numero_lote, fecha_compra, fecha_ingreso, fecha_vencimiento, precio_compra, cantidad_inicial, cantidad_disponible, activo, usuario_id, fecha_creacion) VALUES
 (1,  1, 'AMX-2401', CURDATE() - INTERVAL 120 DAY, CURDATE() - INTERVAL 120 DAY, CURDATE() + INTERVAL 20 DAY,  780,  60,  60, 1, 1, NOW()),  -- próximo a vencer
 (2,  1, 'AMX-2502', CURDATE() - INTERVAL 30 DAY,  CURDATE() - INTERVAL 30 DAY,  CURDATE() + INTERVAL 400 DAY, 800, 100, 100, 1, 1, NOW()),
 (3,  2, 'MLX-2501', CURDATE() - INTERVAL 60 DAY,  CURDATE() - INTERVAL 60 DAY,  CURDATE() + INTERVAL 300 DAY, 18000, 12, 12, 1, 1, NOW()),
 (4,  3, 'IVM-2301', CURDATE() - INTERVAL 400 DAY, CURDATE() - INTERVAL 400 DAY, CURDATE() - INTERVAL 10 DAY, 21000,  4,  4, 1, 1, NOW()),  -- vencido
 (5,  3, 'IVM-2502', CURDATE() - INTERVAL 20 DAY,  CURDATE() - INTERVAL 20 DAY,  CURDATE() + INTERVAL 500 DAY, 22000, 10, 10, 1, 1, NOW()),
 (6,  4, 'PRD-2501', CURDATE() - INTERVAL 45 DAY,  CURDATE() - INTERVAL 45 DAY,  CURDATE() + INTERVAL 250 DAY,  350, 25, 25, 1, 1, NOW()),  -- bajo stock mínimo (30)
 (7,  5, 'MTZ-2501', CURDATE() - INTERVAL 15 DAY,  CURDATE() - INTERVAL 15 DAY,  CURDATE() + INTERVAL 365 DAY,  450, 80, 80, 1, 1, NOW()),
 (8,  7, 'VRB-2501', CURDATE() - INTERVAL 10 DAY,  CURDATE() - INTERVAL 10 DAY,  CURDATE() + INTERVAL 180 DAY, 12000, 30, 30, 1, 1, NOW()),
 (9,  8, 'OMP-2501', CURDATE() - INTERVAL 90 DAY,  CURDATE() - INTERVAL 90 DAY,  CURDATE() + INTERVAL 25 DAY,   300, 40, 40, 1, 1, NOW()),  -- próximo a vencer
 (10, 9, 'JER-2501', CURDATE() - INTERVAL 10 DAY,  CURDATE() - INTERVAL 10 DAY,  CURDATE() + INTERVAL 900 DAY,  250, 200, 200, 1, 1, NOW()),
 (11, 10,'GAS-2501', CURDATE() - INTERVAL 10 DAY,  CURDATE() - INTERVAL 10 DAY,  CURDATE() + INTERVAL 700 DAY, 1500, 50, 50, 1, 1, NOW()),
 (12, 11,'COL-2501', CURDATE() - INTERVAL 10 DAY,  CURDATE() - INTERVAL 10 DAY,  NULL,                         9000,  8,  8, 1, 1, NOW()),  -- utensilio sin vencimiento
 (13, 12,'TRM-2501', CURDATE() - INTERVAL 30 DAY,  CURDATE() - INTERVAL 30 DAY,  CURDATE() + INTERVAL 200 DAY, 1200,  8,  8, 1, 1, NOW());  -- bajo stock
-- Enrofloxacina (id 6) queda AGOTADA: sin lotes.

-- Movimientos de entrada de los lotes iniciales (saldo por medicamento)
INSERT INTO movimiento_inventario (medicamento_id, lote_id, tipo, concepto, cantidad, saldo_anterior, saldo_nuevo, costo_unitario, observacion, usuario_id, fecha)
SELECT l.medicamento_id, l.id, 'ENTRADA', 'COMPRA', l.cantidad_inicial,
       COALESCE((SELECT SUM(l2.cantidad_inicial) FROM lote_medicamento l2 WHERE l2.medicamento_id = l.medicamento_id AND l2.id < l.id), 0),
       COALESCE((SELECT SUM(l2.cantidad_inicial) FROM lote_medicamento l2 WHERE l2.medicamento_id = l.medicamento_id AND l2.id <= l.id), 0),
       l.precio_compra, CONCAT('Ingreso inicial lote ', l.numero_lote), 1, TIMESTAMP(l.fecha_ingreso, '09:00:00')
FROM lote_medicamento l ORDER BY l.id;

-- Stock consolidado, fecha de compra/ingreso y vencimiento más próximo
UPDATE medicamento m SET
  m.stock_actual  = COALESCE((SELECT SUM(l.cantidad_disponible) FROM lote_medicamento l WHERE l.medicamento_id = m.id AND l.activo = 1), 0),
  m.fecha_compra  = (SELECT MAX(l.fecha_compra)  FROM lote_medicamento l WHERE l.medicamento_id = m.id),
  m.fecha_ingreso = (SELECT MIN(l.fecha_ingreso) FROM lote_medicamento l WHERE l.medicamento_id = m.id),
  m.fecha_vence   = (SELECT MIN(l.fecha_vencimiento) FROM lote_medicamento l
                     WHERE l.medicamento_id = m.id AND l.activo = 1 AND l.cantidad_disponible > 0);

-- ---------------------------------------------------------------- Citas
-- Citas pasadas atendidas (para historial, facturación y reportes)
INSERT INTO cita (id, cliente_id, mascota_id, medico_id, tarifa_id, fecha_hora, fecha_hora_fin, estado, motivo, usuario_creacion_id, fecha_creacion) VALUES
 (1, 1, 1, 1, 1, TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '09:00:00'), TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '09:30:00'), 'ATENDIDA',  'Control anual y vacunación',        2, NOW() - INTERVAL 25 DAY),
 (2, 3, 4, 2, 2, TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '10:00:00'), TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '10:30:00'), 'ATENDIDA',  'Prurito y pérdida de pelo',         2, NOW() - INTERVAL 12 DAY),
 (3, 2, 3, 1, 1, TIMESTAMP(CURDATE() - INTERVAL 2 DAY,  '15:00:00'), TIMESTAMP(CURDATE() - INTERVAL 2 DAY,  '15:30:00'), 'ATENDIDA',  'Vómito y diarrea desde hace 3 días', 2, NOW() - INTERVAL 4 DAY),
 (4, 4, 5, 3, 3, TIMESTAMP(CURDATE() - INTERVAL 5 DAY,  '08:00:00'), TIMESTAMP(CURDATE() - INTERVAL 5 DAY,  '08:45:00'), 'CANCELADA', 'Valoración para esterilización',    2, NOW() - INTERVAL 8 DAY);
UPDATE cita SET motivo_cancelacion = 'El propietario no pudo asistir' WHERE id = 4;

-- Citas futuras
INSERT INTO cita (id, cliente_id, mascota_id, medico_id, tarifa_id, fecha_hora, fecha_hora_fin, estado, motivo, usuario_creacion_id, fecha_creacion) VALUES
 (5, 1, 2, 1, 1, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '09:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '09:30:00'), 'CONFIRMADA', 'Control de peso',              2, NOW()),
 (6, 5, 6, 1, 5, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '10:15:00'), 'PENDIENTE',  'Vacunación antirrábica',       2, NOW()),
 (7, 6, 8, 1, 1, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '14:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '14:30:00'), 'PROGRAMADA', 'Revisión de dientes y uñas',   2, NOW()),
 (8, 5, 7, 2, 2, TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '08:30:00'), TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '09:00:00'), 'CONFIRMADA', 'Control dermatitis',           2, NOW()),
 (9, 4, 5, 3, 3, TIMESTAMP(CURDATE() + INTERVAL 4 DAY, '11:00:00'), TIMESTAMP(CURDATE() + INTERVAL 4 DAY, '11:45:00'), 'PENDIENTE',  'Valoración para esterilización',2, NOW()),
 (10,1, 1, 1, 1, TIMESTAMP(CURDATE(),                 '16:00:00'), TIMESTAMP(CURDATE(),                 '16:30:00'), 'CONFIRMADA', 'Cojera en pata trasera',       2, NOW());

INSERT INTO cita_historial (cita_id, accion, estado_anterior, estado_nuevo, fecha_nueva, observacion, usuario_id, fecha)
SELECT id, 'CREACION', NULL, IF(estado IN ('ATENDIDA','CANCELADA'), 'PROGRAMADA', estado), fecha_hora, 'Cita registrada', 2, fecha_creacion FROM cita;
INSERT INTO cita_historial (cita_id, accion, estado_anterior, estado_nuevo, observacion, usuario_id, fecha) VALUES
 (1, 'CAMBIO_ESTADO', 'PROGRAMADA', 'ATENDIDA', 'Atención finalizada', 3, NOW() - INTERVAL 20 DAY),
 (2, 'CAMBIO_ESTADO', 'PROGRAMADA', 'ATENDIDA', 'Atención finalizada', 4, NOW() - INTERVAL 10 DAY),
 (3, 'CAMBIO_ESTADO', 'PROGRAMADA', 'ATENDIDA', 'Atención finalizada', 3, NOW() - INTERVAL 2 DAY),
 (4, 'CAMBIO_ESTADO', 'PROGRAMADA', 'CANCELADA', 'El propietario no pudo asistir', 2, NOW() - INTERVAL 6 DAY);

-- ---------------------------------------------------------------- Historias clínicas
INSERT INTO historia_medica (id, paciente_id, cliente_id, cita_id, medico_id, fecha_hora, motivo, sintomas, diagnostico, observaciones, recomendaciones, peso_kg, temperatura_c, estado, fecha_creacion, fecha_cierre) VALUES
 (1, 1, 1, 1, 1, TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '09:05:00'), 'Control anual y vacunación', 'Ninguno', 'Paciente sano', 'Buena condición corporal', 'Repetir control en 12 meses', 30.5, 38.5, 'CERRADA', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 20 DAY),
 (2, 4, 3, 2, 2, TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '10:05:00'), 'Prurito y pérdida de pelo', 'Prurito intenso, alopecia en flancos', 'Dermatitis alérgica', 'Se descarta sarna por raspado', 'Dieta hipoalergénica, baños semanales', 11.3, 38.7, 'CERRADA', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),
 (3, 3, 2, 3, 1, TIMESTAMP(CURDATE() - INTERVAL 2 DAY, '15:05:00'), 'Vómito y diarrea desde hace 3 días', 'Vómito, diarrea, decaimiento', 'Gastroenteritis aguda', 'Deshidratación leve', 'Dieta blanda por 5 días, hidratación', 12.0, 39.2, 'CERRADA', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY);

INSERT INTO atencion_servicio (cita_id, tarifa_id, cantidad, observacion, usuario_id, fecha) VALUES
 (1, 1, 1, NULL, 3, NOW() - INTERVAL 20 DAY),
 (2, 2, 1, NULL, 4, NOW() - INTERVAL 10 DAY),
 (3, 1, 1, NULL, 3, NOW() - INTERVAL 2 DAY);

-- ---------------------------------------------------------------- Fórmulas
-- Fórmula de la cita 3 confirmada y PENDIENTE DE DESPACHO (para la demostración)
INSERT INTO formula_medica (id, numero, cita_id, mascota_id, medico_id, historia_id, fecha_emision, estado, estado_despacho, indicaciones, usuario_id, fecha_confirmacion, activo, fecha_creacion_registro) VALUES
 (1, 'FM-000001', 3, 3, 1, 3, CURDATE() - INTERVAL 2 DAY, 'CONFIRMADA', 'PENDIENTE_DESPACHO', 'Administrar con alimento', 3, NOW() - INTERVAL 2 DAY, 1, NOW() - INTERVAL 2 DAY);
INSERT INTO formula_medica_detalle (formula_id, medicamento_id, dosis, dosis_cantidad, frecuencia_horas, duracion_dias, cantidad_prescrita, cantidad_despachada, via_administracion, indicaciones) VALUES
 (1, 5, '1 tableta', 1, 12, 7, 14, 0, 'ORAL', 'Después de las comidas'),
 (1, 8, '1 cápsula', 1, 24, 5, 5,  0, 'ORAL', 'En ayunas'),
 (1, 6, '1 tableta', 1, 24, 5, 5,  0, 'ORAL', 'Medicamento agotado: queda pendiente por disponibilidad');
INSERT INTO formula_estado_historial (formula_id, estado_anterior, estado_nuevo, observacion, usuario_id, fecha) VALUES
 (1, NULL, 'BORRADOR', 'Fórmula creada', 3, NOW() - INTERVAL 2 DAY),
 (1, 'BORRADOR', 'PENDIENTE_DESPACHO', 'Fórmula confirmada por el veterinario', 3, NOW() - INTERVAL 2 DAY);

-- ---------------------------------------------------------------- Facturas y pagos
INSERT INTO factura (id, numero, cita_id, cliente_id, mascota_id, medico_id, especializacion, fecha_generacion, subtotal, total_descuento, total_impuestos, total, total_pagado, saldo, estado, usuario_id) VALUES
 (1, 'FAC-000001', 1, 1, 1, 1, 'Medicina general', TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '09:40:00'),  60000, 0, 11400,  71400,  71400,     0, 'PAGADA',       2),
 (2, 'FAC-000002', 2, 3, 4, 2, 'Dermatología',     TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '10:40:00'),  90000, 0, 17100, 107100,  50000, 57100, 'PAGO_PARCIAL', 2);
INSERT INTO factura_detalle (factura_id, tipo_item, tarifa_id, descripcion, cantidad, precio_unitario, porcentaje_descuento, valor_descuento, subtotal, impuesto_codigo, impuesto_porcentaje, valor_impuesto, total) VALUES
 (1, 'SERVICIO', 1, 'Consulta medicina general', 1, 60000, 0, 0, 60000, 'IVA19', 19, 11400,  71400),
 (2, 'SERVICIO', 2, 'Consulta dermatología',     1, 90000, 0, 0, 90000, 'IVA19', 19, 17100, 107100);
INSERT INTO pago (factura_id, fecha_pago, valor, metodo_pago, referencia, usuario_id) VALUES
 (1, TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '09:45:00'), 71400, 'EFECTIVO',      NULL,       2),
 (2, TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '10:45:00'), 50000, 'TARJETA_DEBITO','VOUCH-881', 2);
INSERT INTO factura_historial (factura_id, accion, estado_anterior, estado_nuevo, detalle, usuario_id, fecha) VALUES
 (1, 'GENERACION', NULL, 'PENDIENTE', 'Factura generada', 2, TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '09:40:00')),
 (1, 'PAGO', 'PENDIENTE', 'PAGADA', 'Pago EFECTIVO por 71400', 2, TIMESTAMP(CURDATE() - INTERVAL 20 DAY, '09:45:00')),
 (2, 'GENERACION', NULL, 'PENDIENTE', 'Factura generada', 2, TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '10:40:00')),
 (2, 'PAGO', 'PENDIENTE', 'PAGO_PARCIAL', 'Pago TARJETA_DEBITO por 50000', 2, TIMESTAMP(CURDATE() - INTERVAL 10 DAY, '10:45:00'));

-- Ajusta los AUTO_INCREMENT por si el motor no lo hizo
ALTER TABLE cita AUTO_INCREMENT = 100;
