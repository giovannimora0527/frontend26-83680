-- MySQL dump 10.13  Distrib 26.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: clinica
-- ------------------------------------------------------
-- Server version	26.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `anotacion`
--

DROP TABLE IF EXISTS `anotacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anotacion` (
  `anotacion_id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `medico_id` bigint NOT NULL,
  `descripcion` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacion` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diagnostico` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  PRIMARY KEY (`anotacion_id`),
  KEY `idx_anotacion_historia` (`historia_id`,`fecha_creacion`),
  KEY `fk_anotacion_medico` (`medico_id`),
  CONSTRAINT `fk_anotacion_historia` FOREIGN KEY (`historia_id`) REFERENCES `historia_clinica` (`historia_id`),
  CONSTRAINT `fk_anotacion_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anotacion`
--

LOCK TABLES `anotacion` WRITE;
/*!40000 ALTER TABLE `anotacion` DISABLE KEYS */;
INSERT INTO `anotacion` VALUES (1,1,1,'Se recomienda control en 3 meses.',NULL,'Sin registrar','2026-10-16 16:59:02'),(2,1,1,'Control de seguimiento: buen estado general','Continuar dieta','Evolución favorable','2026-10-16 23:26:50');
/*!40000 ALTER TABLE `anotacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atencion_servicio`
--

DROP TABLE IF EXISTS `atencion_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atencion_servicio` (
  `atencion_servicio_id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `servicio_id` bigint NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `valor_unitario` decimal(12,2) NOT NULL COMMENT 'Tarifa vigente al registrar el servicio',
  `iva_porcentaje` decimal(5,2) NOT NULL,
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  PRIMARY KEY (`atencion_servicio_id`),
  UNIQUE KEY `uk_atencion_servicio` (`historia_id`,`servicio_id`),
  KEY `fk_atencion_servicio_servicio` (`servicio_id`),
  CONSTRAINT `fk_atencion_servicio_historia` FOREIGN KEY (`historia_id`) REFERENCES `historia_clinica` (`historia_id`),
  CONSTRAINT `fk_atencion_servicio_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`servicio_id`),
  CONSTRAINT `ck_atencion_servicio_cantidad` CHECK ((`cantidad` between 1 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atencion_servicio`
--

LOCK TABLES `atencion_servicio` WRITE;
/*!40000 ALTER TABLE `atencion_servicio` DISABLE KEYS */;
/*!40000 ALTER TABLE `atencion_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cita`
--

DROP TABLE IF EXISTS `cita`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cita` (
  `cita_id` bigint NOT NULL AUTO_INCREMENT,
  `mascota_id` int NOT NULL,
  `medico_id` bigint NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `fecha_hora_fin` datetime NOT NULL,
  `motivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo_cancelacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`cita_id`),
  KEY `idx_cita_fecha_hora` (`fecha_hora`),
  KEY `idx_cita_medico` (`medico_id`,`fecha_hora`),
  KEY `idx_cita_mascota` (`mascota_id`,`fecha_hora`),
  KEY `fk_cita_estado` (`estado`),
  KEY `idx_cita_medico_rango` (`medico_id`,`fecha_hora`,`fecha_hora_fin`),
  CONSTRAINT `fk_cita_estado` FOREIGN KEY (`estado`) REFERENCES `estado_cita` (`codigo`),
  CONSTRAINT `fk_cita_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascota` (`mascota_id`),
  CONSTRAINT `fk_cita_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`),
  CONSTRAINT `ck_cita_rango` CHECK ((`fecha_hora_fin` > `fecha_hora`))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cita`
--

LOCK TABLES `cita` WRITE;
/*!40000 ALTER TABLE `cita` DISABLE KEYS */;
INSERT INTO `cita` VALUES (1,1,1,'2026-10-17 08:41:00','2026-10-17 09:11:00','Consulta por primera vez.','CONFIRMADA',NULL,'2026-10-16 14:56:06','2026-10-16 16:43:24'),(2,2,2,'2025-10-16 21:30:00','2025-10-16 22:00:00','Consulta general','PROGRAMADA',NULL,'2026-10-16 14:56:06',NULL),(3,3,1,'2024-06-20 18:30:00','2024-06-20 19:00:00','Consulta general','ATENDIDA',NULL,'2026-10-16 14:56:06',NULL),(4,4,2,'2024-06-21 14:30:00','2024-06-21 15:00:00','Consulta odontologica','CANCELADA',NULL,'2026-10-16 14:56:06',NULL),(5,1,1,'2026-10-17 23:30:00','2026-10-18 00:00:00','revisoon general','ATENDIDA',NULL,'2026-10-16 21:31:03','2026-10-19 20:42:31'),(6,7,5,'2026-10-18 13:50:00','2026-10-18 14:20:00','Dolor de huesos','ATENDIDA',NULL,'2026-10-16 23:51:03','2026-10-16 23:51:30'),(7,9,2,'2026-10-17 00:11:00','2026-10-17 00:41:00','Dolor en las patas blancas','ATENDIDA',NULL,'2026-10-17 00:05:50','2026-10-17 00:13:52'),(8,8,5,'2026-10-17 07:00:00','2026-10-17 07:30:00','Le duelen los bigotes','PROGRAMADA',NULL,'2026-10-17 00:16:15',NULL);
/*!40000 ALTER TABLE `cita` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cita_historial`
--

DROP TABLE IF EXISTS `cita_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cita_historial` (
  `historial_id` bigint NOT NULL AUTO_INCREMENT,
  `cita_id` bigint NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_anterior` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_nuevo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inicio_anterior` datetime DEFAULT NULL,
  `inicio_nuevo` datetime DEFAULT NULL,
  `observacion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`historial_id`),
  KEY `idx_cita_historial` (`cita_id`,`fecha`),
  KEY `fk_cita_historial_usuario` (`usuario_id`),
  CONSTRAINT `fk_cita_historial_cita` FOREIGN KEY (`cita_id`) REFERENCES `cita` (`cita_id`),
  CONSTRAINT `fk_cita_historial_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ck_cita_historial_accion` CHECK ((`accion` in (_utf8mb4'CREADA',_utf8mb4'EDITADA',_utf8mb4'REPROGRAMADA',_utf8mb4'ESTADO',_utf8mb4'REACTIVADA')))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cita_historial`
--

LOCK TABLES `cita_historial` WRITE;
/*!40000 ALTER TABLE `cita_historial` DISABLE KEYS */;
INSERT INTO `cita_historial` VALUES (1,1,'2026-10-16 14:56:06',NULL,'CREADA',NULL,'CONFIRMADA',NULL,'2026-10-17 08:41:00','Registro anterior al historial de citas'),(2,2,'2026-10-16 14:56:06',NULL,'CREADA',NULL,'PROGRAMADA',NULL,'2025-10-16 21:30:00','Registro anterior al historial de citas'),(3,3,'2026-10-16 14:56:06',NULL,'CREADA',NULL,'ATENDIDA',NULL,'2024-06-20 18:30:00','Registro anterior al historial de citas'),(4,4,'2026-10-16 14:56:06',NULL,'CREADA',NULL,'CANCELADA',NULL,'2024-06-21 14:30:00','Registro anterior al historial de citas'),(5,5,'2026-10-16 21:31:03',NULL,'CREADA',NULL,'ATENDIDA',NULL,'2026-10-17 23:30:00','Registro anterior al historial de citas'),(6,6,'2026-10-16 23:51:03',NULL,'CREADA',NULL,'ATENDIDA',NULL,'2026-10-18 13:50:00','Registro anterior al historial de citas'),(7,7,'2026-10-17 00:05:50',NULL,'CREADA',NULL,'ATENDIDA',NULL,'2026-10-17 00:11:00','Registro anterior al historial de citas'),(8,8,'2026-10-17 00:16:15',NULL,'CREADA',NULL,'PROGRAMADA',NULL,'2026-10-17 07:00:00','Registro anterior al historial de citas');
/*!40000 ALTER TABLE `cita_historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `cliente_id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `tipo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `genero` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`cliente_id`),
  UNIQUE KEY `uk_cliente_documento` (`tipo_documento`,`numero_documento`),
  KEY `fk_cliente_usuario` (`usuario_id`),
  CONSTRAINT `fk_cliente_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
INSERT INTO `cliente` VALUES (1,NULL,'CC','1010101010','Andrés','Pérez Gómez','1990-05-14','M','3101234567','Calle 45 # 12-30, Bogotá',1),(2,NULL,'CC','1020202020','Camila','Torres Rojas','1995-09-02','F','3157654321','Carrera 7 # 80-15, Bogotá',1),(3,NULL,'CC','1030303030','Julián','Herrera Díaz','1988-12-20','M','3209876543','Avenida Boyacá # 63-20, Bogotá',1),(4,NULL,'CC','1040404040','Natalia','Ramírez Cruz','1992-03-08','F','3112223344','Calle 100 # 15-40, Bogotá',1),(5,NULL,'CC','1203462666','Emerson','Chitiva','2001-06-20','O','312262626262','tu ojos',1);
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despacho`
--

DROP TABLE IF EXISTS `despacho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `despacho` (
  `despacho_id` bigint NOT NULL AUTO_INCREMENT,
  `formula_id` bigint NOT NULL,
  `usuario_id` int NOT NULL,
  `estado` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `observacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuario_reversion_id` int DEFAULT NULL,
  `fecha_reversion` datetime DEFAULT NULL,
  `motivo_reversion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`despacho_id`),
  KEY `idx_despacho_fecha` (`fecha`),
  KEY `fk_despacho_formula` (`formula_id`),
  KEY `fk_despacho_usuario` (`usuario_id`),
  KEY `fk_despacho_usuario_reversion` (`usuario_reversion_id`),
  CONSTRAINT `fk_despacho_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula_medica` (`formula_id`),
  CONSTRAINT `fk_despacho_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_despacho_usuario_reversion` FOREIGN KEY (`usuario_reversion_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ck_despacho_estado` CHECK ((`estado` in (_utf8mb4'CONFIRMADO',_utf8mb4'REVERTIDO')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despacho`
--

LOCK TABLES `despacho` WRITE;
/*!40000 ALTER TABLE `despacho` DISABLE KEYS */;
/*!40000 ALTER TABLE `despacho` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despacho_detalle`
--

DROP TABLE IF EXISTS `despacho_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `despacho_detalle` (
  `detalle_id` bigint NOT NULL AUTO_INCREMENT,
  `despacho_id` bigint NOT NULL,
  `formula_detalle_id` bigint NOT NULL,
  `lote_id` bigint NOT NULL,
  `cantidad` int NOT NULL,
  PRIMARY KEY (`detalle_id`),
  UNIQUE KEY `uk_despacho_detalle_lote` (`despacho_id`,`formula_detalle_id`,`lote_id`),
  KEY `fk_despacho_detalle_linea` (`formula_detalle_id`),
  KEY `fk_despacho_detalle_lote` (`lote_id`),
  CONSTRAINT `fk_despacho_detalle_despacho` FOREIGN KEY (`despacho_id`) REFERENCES `despacho` (`despacho_id`),
  CONSTRAINT `fk_despacho_detalle_linea` FOREIGN KEY (`formula_detalle_id`) REFERENCES `formula_detalle` (`detalle_id`),
  CONSTRAINT `fk_despacho_detalle_lote` FOREIGN KEY (`lote_id`) REFERENCES `lote_medicamento` (`lote_id`),
  CONSTRAINT `ck_despacho_detalle_cantidad` CHECK ((`cantidad` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despacho_detalle`
--

LOCK TABLES `despacho_detalle` WRITE;
/*!40000 ALTER TABLE `despacho_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `despacho_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especializacion`
--

DROP TABLE IF EXISTS `especializacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especializacion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_especializacion` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_especializacion_nombre` (`nombre`),
  UNIQUE KEY `uk_especializacion_codigo` (`codigo_especializacion`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especializacion`
--

LOCK TABLES `especializacion` WRITE;
/*!40000 ALTER TABLE `especializacion` DISABLE KEYS */;
INSERT INTO `especializacion` VALUES (1,'Medicina General','Atención médica general de mascotas','MG',1),(2,'Odontología','Salud dental veterinaria','ODO',1),(3,'Dermatología','Enfermedades de la piel','DER',1),(4,'Ortopedia','Estudio y cuidado de huesos, articulaciones, ligamentos, tendones, músculos y nervios','OR',1);
/*!40000 ALTER TABLE `especializacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estado_cita`
--

DROP TABLE IF EXISTS `estado_cita`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_cita` (
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_final` tinyint(1) NOT NULL DEFAULT '0',
  `orden` int NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estado_cita`
--

LOCK TABLES `estado_cita` WRITE;
/*!40000 ALTER TABLE `estado_cita` DISABLE KEYS */;
INSERT INTO `estado_cita` VALUES ('ATENDIDA','Finalizada','La consulta se realizó','#6c757d',1,4),('CANCELADA','Cancelada','Se canceló; se conserva en el historial','#f44236',1,5),('CONFIRMADA','Confirmada','El propietario confirmó la asistencia','#1de9b6',0,3),('PENDIENTE','Pendiente','Solicitada; falta confirmar con el propietario','#f4c22b',0,1),('PROGRAMADA','Programada','Agendada en el calendario del veterinario','#04a9f5',0,2);
/*!40000 ALTER TABLE `estado_cita` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `factura`
--

DROP TABLE IF EXISTS `factura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factura` (
  `factura_id` bigint NOT NULL AUTO_INCREMENT,
  `numero` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `historia_id` bigint NOT NULL,
  `cliente_id` bigint NOT NULL,
  `mascota_id` int NOT NULL,
  `medico_id` bigint NOT NULL,
  `especialidad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `descuento` decimal(14,2) NOT NULL DEFAULT '0.00',
  `motivo_descuento` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iva` decimal(14,2) NOT NULL,
  `total` decimal(14,2) NOT NULL,
  `pagado` decimal(14,2) NOT NULL DEFAULT '0.00',
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int NOT NULL,
  `usuario_anulacion_id` int DEFAULT NULL,
  `fecha_anulacion` datetime DEFAULT NULL,
  `motivo_anulacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`factura_id`),
  UNIQUE KEY `uk_factura_numero` (`numero`),
  KEY `idx_factura_cliente` (`cliente_id`,`fecha`),
  KEY `idx_factura_mascota` (`mascota_id`,`fecha`),
  KEY `idx_factura_fecha` (`fecha`),
  KEY `fk_factura_medico` (`medico_id`),
  KEY `fk_factura_usuario` (`usuario_id`),
  KEY `fk_factura_usuario_anulacion` (`usuario_anulacion_id`),
  KEY `idx_factura_historia` (`historia_id`),
  CONSTRAINT `fk_factura_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`cliente_id`),
  CONSTRAINT `fk_factura_historia` FOREIGN KEY (`historia_id`) REFERENCES `historia_clinica` (`historia_id`),
  CONSTRAINT `fk_factura_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascota` (`mascota_id`),
  CONSTRAINT `fk_factura_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`),
  CONSTRAINT `fk_factura_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `fk_factura_usuario_anulacion` FOREIGN KEY (`usuario_anulacion_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ck_factura_estado` CHECK ((`estado` in (_utf8mb4'PENDIENTE_PAGO',_utf8mb4'PAGO_PARCIAL',_utf8mb4'PAGADA',_utf8mb4'ANULADA'))),
  CONSTRAINT `ck_factura_valores` CHECK (((`subtotal` >= 0) and (`descuento` >= 0) and (`descuento` <= `subtotal`) and (`iva` >= 0) and (`total` >= 0) and (`pagado` >= 0) and (`pagado` <= `total`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `factura`
--

LOCK TABLES `factura` WRITE;
/*!40000 ALTER TABLE `factura` DISABLE KEYS */;
/*!40000 ALTER TABLE `factura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `factura_detalle`
--

DROP TABLE IF EXISTS `factura_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factura_detalle` (
  `detalle_id` bigint NOT NULL AUTO_INCREMENT,
  `factura_id` bigint NOT NULL,
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `servicio_id` bigint DEFAULT NULL,
  `medicamento_id` bigint DEFAULT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `valor_unitario` decimal(12,2) NOT NULL,
  `iva_porcentaje` decimal(5,2) NOT NULL,
  `subtotal` decimal(14,2) NOT NULL,
  `descuento` decimal(14,2) NOT NULL DEFAULT '0.00',
  `iva` decimal(14,2) NOT NULL,
  `total` decimal(14,2) NOT NULL,
  PRIMARY KEY (`detalle_id`),
  KEY `fk_factura_detalle_factura` (`factura_id`),
  KEY `fk_factura_detalle_servicio` (`servicio_id`),
  KEY `fk_factura_detalle_medicamento` (`medicamento_id`),
  CONSTRAINT `fk_factura_detalle_factura` FOREIGN KEY (`factura_id`) REFERENCES `factura` (`factura_id`),
  CONSTRAINT `fk_factura_detalle_medicamento` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamento` (`id`),
  CONSTRAINT `fk_factura_detalle_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`servicio_id`),
  CONSTRAINT `ck_factura_detalle_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `ck_factura_detalle_tipo` CHECK ((`tipo` in (_utf8mb4'SERVICIO',_utf8mb4'MEDICAMENTO')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `factura_detalle`
--

LOCK TABLES `factura_detalle` WRITE;
/*!40000 ALTER TABLE `factura_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `factura_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formula_detalle`
--

DROP TABLE IF EXISTS `formula_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formula_detalle` (
  `detalle_id` bigint NOT NULL AUTO_INCREMENT,
  `formula_id` bigint NOT NULL,
  `medicamento_id` bigint NOT NULL,
  `dosis` decimal(10,2) NOT NULL,
  `unidad_dosis` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia_horas` int NOT NULL,
  `duracion_dias` int NOT NULL,
  `cantidad_prescrita` int NOT NULL,
  `via_administracion` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `indicaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`detalle_id`),
  UNIQUE KEY `uk_formula_detalle_medicamento` (`formula_id`,`medicamento_id`),
  KEY `fk_formula_detalle_medicamento` (`medicamento_id`),
  CONSTRAINT `fk_formula_detalle_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula_medica` (`formula_id`),
  CONSTRAINT `fk_formula_detalle_medicamento` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamento` (`id`),
  CONSTRAINT `ck_formula_detalle_cantidad` CHECK ((`cantidad_prescrita` > 0)),
  CONSTRAINT `ck_formula_detalle_dosis` CHECK ((`dosis` > 0)),
  CONSTRAINT `ck_formula_detalle_duracion` CHECK ((`duracion_dias` between 1 and 365)),
  CONSTRAINT `ck_formula_detalle_frecuencia` CHECK ((`frecuencia_horas` between 1 and 168))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formula_detalle`
--

LOCK TABLES `formula_detalle` WRITE;
/*!40000 ALTER TABLE `formula_detalle` DISABLE KEYS */;
INSERT INTO `formula_detalle` VALUES (1,1,1,250.00,'mg',12,10,20,NULL,'Administrar con alimento. Suspender si presenta vómito.'),(2,2,1,2.00,'ml',6,8,32,NULL,'Suspender si presenta vomito'),(3,3,4,80.00,'gotas',5,20,100,NULL,'Con juicio');
/*!40000 ALTER TABLE `formula_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formula_estado_historial`
--

DROP TABLE IF EXISTS `formula_estado_historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formula_estado_historial` (
  `historial_id` bigint NOT NULL AUTO_INCREMENT,
  `formula_id` bigint NOT NULL,
  `estado_anterior` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_nuevo` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int NOT NULL,
  `fecha` datetime NOT NULL,
  `observacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`historial_id`),
  KEY `idx_historial_formula` (`formula_id`,`fecha`),
  KEY `fk_historial_usuario` (`usuario_id`),
  CONSTRAINT `fk_historial_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula_medica` (`formula_id`),
  CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formula_estado_historial`
--

LOCK TABLES `formula_estado_historial` WRITE;
/*!40000 ALTER TABLE `formula_estado_historial` DISABLE KEYS */;
/*!40000 ALTER TABLE `formula_estado_historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formula_medica`
--

DROP TABLE IF EXISTS `formula_medica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formula_medica` (
  `formula_id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `medico_id` bigint NOT NULL,
  `fecha_emision` date NOT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_despacho` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_confirmacion` datetime DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`formula_id`),
  KEY `idx_formula_historia` (`historia_id`),
  KEY `idx_formula_creacion` (`fecha_creacion`),
  KEY `fk_formula_medico` (`medico_id`),
  CONSTRAINT `fk_formula_historia` FOREIGN KEY (`historia_id`) REFERENCES `historia_clinica` (`historia_id`),
  CONSTRAINT `fk_formula_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`),
  CONSTRAINT `ck_formula_estado` CHECK ((`estado` in (_utf8mb4'BORRADOR',_utf8mb4'CONFIRMADA',_utf8mb4'ANULADA')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formula_medica`
--

LOCK TABLES `formula_medica` WRITE;
/*!40000 ALTER TABLE `formula_medica` DISABLE KEYS */;
INSERT INTO `formula_medica` VALUES (1,1,1,'2026-10-16',NULL,'CONFIRMADA','PENDIENTE_DESPACHO','2026-10-16 23:27:04','2026-10-16 23:27:04','2026-11-11 19:18:06'),(2,2,5,'2026-10-19',NULL,'CONFIRMADA','PENDIENTE_DESPACHO','2026-10-17 00:03:49','2026-10-17 00:03:49',NULL),(3,3,2,'2026-10-17',NULL,'CONFIRMADA','PENDIENTE_DESPACHO','2026-10-17 00:14:53','2026-10-17 00:14:53',NULL);
/*!40000 ALTER TABLE `formula_medica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historia_clinica`
--

DROP TABLE IF EXISTS `historia_clinica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historia_clinica` (
  `historia_id` bigint NOT NULL AUTO_INCREMENT,
  `mascota_id` int NOT NULL,
  `medico_id` bigint NOT NULL,
  `cita_id` bigint DEFAULT NULL,
  `fecha_hora` datetime NOT NULL,
  `motivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sintomas` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diagnostico` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recomendaciones` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTA',
  `fecha_finalizacion` datetime DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL,
  PRIMARY KEY (`historia_id`),
  UNIQUE KEY `uk_historia_cita` (`cita_id`),
  KEY `idx_historia_mascota` (`mascota_id`,`fecha_hora`),
  KEY `fk_historia_medico` (`medico_id`),
  CONSTRAINT `fk_historia_cita` FOREIGN KEY (`cita_id`) REFERENCES `cita` (`cita_id`),
  CONSTRAINT `fk_historia_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascota` (`mascota_id`),
  CONSTRAINT `fk_historia_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historia_clinica`
--

LOCK TABLES `historia_clinica` WRITE;
/*!40000 ALTER TABLE `historia_clinica` DISABLE KEYS */;
INSERT INTO `historia_clinica` VALUES (1,3,1,3,'2024-06-20 18:30:00','Consulta general',NULL,'Control general sin hallazgos relevantes.','Desparasitación y vitaminas por 15 días.',NULL,'ABIERTA',NULL,'2026-10-16 16:59:02'),(2,7,5,6,'2026-10-18 13:50:00','Dolor de huesos',NULL,'Tiene cancer','Mucho cuidado y ya',NULL,'ABIERTA',NULL,'2026-10-16 23:52:03'),(3,9,2,7,'2026-10-17 00:11:00','Dolor en las patas blancas',NULL,'Va a quedar cojo','Muy triste',NULL,'ABIERTA',NULL,'2026-10-17 00:14:25'),(4,1,1,5,'2026-10-17 23:30:00','revisoon general',NULL,'asasas','assasasasa',NULL,'ABIERTA',NULL,'2026-10-19 20:57:52');
/*!40000 ALTER TABLE `historia_clinica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `horario_medico`
--

DROP TABLE IF EXISTS `horario_medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horario_medico` (
  `horario_id` bigint NOT NULL AUTO_INCREMENT,
  `medico_id` bigint NOT NULL,
  `dia_semana` tinyint NOT NULL COMMENT '1 = lunes ... 7 = domingo (ISO 8601)',
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL,
  PRIMARY KEY (`horario_id`),
  UNIQUE KEY `uk_horario_inicio` (`medico_id`,`dia_semana`,`hora_inicio`),
  CONSTRAINT `fk_horario_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`),
  CONSTRAINT `ck_horario_dia` CHECK ((`dia_semana` between 1 and 7)),
  CONSTRAINT `ck_horario_rango` CHECK ((`hora_fin` > `hora_inicio`))
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `horario_medico`
--

LOCK TABLES `horario_medico` WRITE;
/*!40000 ALTER TABLE `horario_medico` DISABLE KEYS */;
INSERT INTO `horario_medico` VALUES (1,1,1,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(2,1,1,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(3,5,1,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(4,5,1,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(5,4,1,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(6,4,1,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(7,3,1,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(8,3,1,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(11,1,2,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(12,1,2,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(13,5,2,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(14,5,2,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(15,4,2,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(16,4,2,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(17,3,2,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(18,3,2,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(21,1,3,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(22,1,3,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(23,5,3,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(24,5,3,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(25,4,3,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(26,4,3,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(27,3,3,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(28,3,3,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(31,1,4,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(32,1,4,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(33,5,4,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(34,5,4,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(35,4,4,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(36,4,4,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(37,3,4,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(38,3,4,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(41,1,5,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(42,1,5,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(43,5,5,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(44,5,5,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(45,4,5,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(46,4,5,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(47,3,5,'07:00:00','12:00:00',1,'2026-11-11 19:23:25'),(48,3,5,'14:00:00','18:00:00',1,'2026-11-11 19:23:25'),(65,3,6,'08:00:00','12:00:00',1,'2026-11-11 19:23:25'),(66,4,6,'08:00:00','12:00:00',1,'2026-11-11 19:23:25'),(67,5,6,'08:00:00','12:00:00',1,'2026-11-11 19:23:25'),(68,1,6,'08:00:00','12:00:00',1,'2026-11-11 19:23:25'),(83,2,1,'07:00:00','12:00:00',1,'2026-11-11 21:15:40'),(84,2,1,'14:00:00','18:00:00',1,'2026-11-11 21:15:40'),(85,2,2,'07:00:00','12:00:00',1,'2026-11-11 21:15:40'),(86,2,2,'14:00:00','18:00:00',1,'2026-11-11 21:15:40'),(87,2,3,'07:00:00','12:00:00',1,'2026-11-11 21:15:40'),(88,2,3,'14:00:00','18:00:00',1,'2026-11-11 21:15:40'),(89,2,4,'07:00:00','12:00:00',1,'2026-11-11 21:15:40'),(90,2,4,'14:00:00','18:00:00',1,'2026-11-11 21:15:40'),(91,2,5,'07:00:00','12:00:00',1,'2026-11-11 21:15:40'),(92,2,5,'14:00:00','18:00:00',1,'2026-11-11 21:15:40'),(93,2,6,'08:00:00','12:00:00',1,'2026-11-11 21:15:40');
/*!40000 ALTER TABLE `horario_medico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lote_medicamento`
--

DROP TABLE IF EXISTS `lote_medicamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lote_medicamento` (
  `lote_id` bigint NOT NULL AUTO_INCREMENT,
  `medicamento_id` bigint NOT NULL,
  `numero_lote` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_compra` date NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `cantidad_inicial` int NOT NULL,
  `cantidad_disponible` int NOT NULL,
  `precio_compra` decimal(12,2) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  PRIMARY KEY (`lote_id`),
  UNIQUE KEY `uk_lote_medicamento_numero` (`medicamento_id`,`numero_lote`),
  KEY `idx_lote_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `fk_lote_medicamento` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamento` (`id`),
  CONSTRAINT `ck_lote_cantidad` CHECK ((`cantidad_disponible` >= 0)),
  CONSTRAINT `ck_lote_cantidad_inicial` CHECK ((`cantidad_inicial` >= 0)),
  CONSTRAINT `ck_lote_precio` CHECK ((`precio_compra` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lote_medicamento`
--

LOCK TABLES `lote_medicamento` WRITE;
/*!40000 ALTER TABLE `lote_medicamento` DISABLE KEYS */;
INSERT INTO `lote_medicamento` VALUES (1,1,'INICIAL','2026-01-10','2026-01-10','2027-06-30',0,0,0.00,'2026-11-09 17:20:18'),(2,2,'INICIAL','2026-02-15','2026-02-15','2027-08-31',0,0,0.00,'2026-11-09 17:20:18'),(3,3,'INICIAL','2026-03-05','2026-03-05','2027-12-31',0,0,0.00,'2026-11-09 17:20:18'),(4,4,'INICIAL','2026-04-20','2026-04-20','2027-10-15',0,0,0.00,'2026-11-09 17:20:18');
/*!40000 ALTER TABLE `lote_medicamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mascota`
--

DROP TABLE IF EXISTS `mascota`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mascota` (
  `mascota_id` int NOT NULL AUTO_INCREMENT,
  `nombre_mascota` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `edad` int NOT NULL,
  `raza_id` int NOT NULL,
  `fecha_registro` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  `cliente_id` bigint NOT NULL,
  PRIMARY KEY (`mascota_id`),
  UNIQUE KEY `uk_mascota_cliente_nombre` (`cliente_id`,`nombre_mascota`),
  KEY `fk_mascota_raza` (`raza_id`),
  CONSTRAINT `fk_mascota_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`cliente_id`),
  CONSTRAINT `fk_mascota_raza` FOREIGN KEY (`raza_id`) REFERENCES `raza` (`raza_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mascota`
--

LOCK TABLES `mascota` WRITE;
/*!40000 ALTER TABLE `mascota` DISABLE KEYS */;
INSERT INTO `mascota` VALUES (1,'Bella',3,2,'2026-10-16 14:56:06',NULL,1),(2,'Max',5,1,'2026-10-16 14:56:06',NULL,2),(3,'Rocky',4,3,'2026-10-16 14:56:06',NULL,3),(4,'Thor',2,5,'2026-10-16 14:56:06',NULL,1),(5,'Luna',1,4,'2026-10-16 14:56:06',NULL,4),(6,'Canela',4,5,'2026-10-16 23:46:40','2026-10-16 23:46:44',1),(7,'Romelio',1,5,'2026-10-16 23:49:44','2026-10-16 23:49:55',5),(8,'Patroclo',10,4,'2026-10-16 23:56:47',NULL,5),(9,'Capricho',12,7,'2026-10-17 00:04:59',NULL,5);
/*!40000 ALTER TABLE `mascota` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicamento`
--

DROP TABLE IF EXISTS `medicamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicamento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `codigo` char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDICAMENTO',
  `registro_invima` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio_venta` decimal(12,2) NOT NULL DEFAULT '0.00',
  `iva_porcentaje` decimal(5,2) NOT NULL DEFAULT '0.00',
  `stock_minimo` int NOT NULL DEFAULT '0',
  `fecha_proximo_pedido` date DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion_registro` datetime DEFAULT NULL,
  `fecha_modificacion_registro` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_medicamento_codigo` (`codigo`),
  UNIQUE KEY `uk_medicamento_nombre` (`nombre`),
  CONSTRAINT `ck_medicamento_iva` CHECK ((`iva_porcentaje` between 0 and 100)),
  CONSTRAINT `ck_medicamento_precio` CHECK ((`precio_venta` >= 0)),
  CONSTRAINT `ck_medicamento_stock` CHECK ((`stock_minimo` >= 0)),
  CONSTRAINT `ck_medicamento_tipo` CHECK ((`tipo` in (_utf8mb4'MEDICAMENTO',_utf8mb4'INSUMO')))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicamento`
--

LOCK TABLES `medicamento` WRITE;
/*!40000 ALTER TABLE `medicamento` DISABLE KEYS */;
INSERT INTO `medicamento` VALUES (1,'MED00001','Amoxicilina','Antibiótico de amplio espectro','Tabletas 250 mg','MEDICAMENTO',NULL,0.00,0.00,0,NULL,1,'2026-10-16 14:56:06',NULL),(2,'MED00002','Meloxicam','Antiinflamatorio y analgésico','Suspensión 1.5 mg/ml','MEDICAMENTO',NULL,0.00,0.00,0,NULL,1,'2026-10-16 14:56:06',NULL),(3,'MED00003','Ivermectina','Antiparasitario','Solución inyectable 1%','MEDICAMENTO',NULL,0.00,0.00,0,NULL,1,'2026-10-16 14:56:06',NULL),(4,'MED00004','Prednisolona','Corticoide antiinflamatorio','Tabletas 5 mg','MEDICAMENTO',NULL,0.00,0.00,0,NULL,1,'2026-10-16 14:56:06',NULL);
/*!40000 ALTER TABLE `medicamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medico`
--

DROP TABLE IF EXISTS `medico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medico` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tipo_documento` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_profesional` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `especializacion_id` bigint NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `duracion_cita_min` int NOT NULL DEFAULT '30',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_medico_documento` (`tipo_documento`,`numero_documento`),
  UNIQUE KEY `uk_medico_registro` (`registro_profesional`),
  UNIQUE KEY `uk_medico_usuario` (`usuario_id`),
  KEY `fk_medico_especializacion` (`especializacion_id`),
  CONSTRAINT `fk_medico_especializacion` FOREIGN KEY (`especializacion_id`) REFERENCES `especializacion` (`id`),
  CONSTRAINT `fk_medico_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ck_medico_duracion` CHECK ((`duracion_cita_min` between 10 and 240))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medico`
--

LOCK TABLES `medico` WRITE;
/*!40000 ALTER TABLE `medico` DISABLE KEYS */;
INSERT INTO `medico` VALUES (1,'CC','52100200','María','Rodríguez López','3001112233','RP-1001',1,7,1,30),(2,'CC','80300400','Carlos','Martínez Ruiz','3004445566','RP-1002',2,NULL,1,30),(3,'CC','1020304050','Laura','Gómez Pardo','3007778899','RP-1003',3,NULL,1,30),(4,'CC','1098765432','Laura','Gómez Prieto','3001112233','RP-2001',2,NULL,1,30),(5,'CC','120649230','Alberto','Marin','3215849200','1002036',4,NULL,1,30);
/*!40000 ALTER TABLE `medico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu`
--

DROP TABLE IF EXISTS `menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu` (
  `menu_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`menu_id`),
  UNIQUE KEY `uk_menu_code` (`code`),
  UNIQUE KEY `uk_menu_url` (`url`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu`
--

LOCK TABLES `menu` WRITE;
/*!40000 ALTER TABLE `menu` DISABLE KEYS */;
INSERT INTO `menu` VALUES (1,'cita','Gestión de citas','/inicio/citas','fa-solid fa-calendar',1,'2026-01-01 00:00:00',NULL),(2,'clientes','Gestión de clientes','/inicio/clientes','fa-solid fa-user-check',1,'2026-01-01 00:00:00',NULL),(3,'especializaciones','Gestión de Especializaciones','/inicio/especializaciones','fa-solid fa-user-graduate',1,'2026-01-01 00:00:00',NULL),(4,'formulas','Gestión de Formulas','/inicio/formulas','fa-solid fa-clipboard-list',1,'2026-01-01 00:00:00',NULL),(5,'historias','Gestión de Historias','/inicio/historias','fa-solid fa-book-medical',1,'2026-01-01 00:00:00',NULL),(6,'mascotas','Gestión de Mascotas','/inicio/mascotas','fa-solid fa-paw',1,'2026-01-01 00:00:00',NULL),(7,'medicamentos','Gestión de Medicamentos','/inicio/medicamentos','fa-solid fa-capsules',1,'2026-01-01 00:00:00',NULL),(8,'medicos','Gestión de Medicos','/inicio/medicos','fa-solid fa-user-doctor',1,'2026-01-01 00:00:00',NULL),(9,'usuarios','Gestión de Usuarios','/inicio/usuarios','fa-solid fa-users',1,'2026-01-01 00:00:00',NULL),(10,'razas','Gestión de Razas','/inicio/razas','fa-solid fa-dog',1,'2026-11-09 17:38:22','2026-11-09 17:44:44'),(11,'perfiles','Perfiles y Menús','/inicio/perfiles','fa-solid fa-user-shield',1,'2026-11-09 17:38:22',NULL),(12,'despacho','Despacho de Medicamentos','/inicio/despacho','fa-solid fa-truck-medical',1,'2026-11-11 17:40:20',NULL),(13,'calendario','Mi calendario','/inicio/calendario','fa-solid fa-calendar-days',1,'2026-11-11 19:23:25',NULL),(14,'tarifas','Tarifas y Servicios','/inicio/tarifas','fa-solid fa-tags',1,'2026-11-15 09:45:28',NULL),(15,'atencion','Atención Médica','/inicio/atencion','fa-solid fa-stethoscope',1,'2026-11-15 09:45:28',NULL),(16,'facturacion','Facturación','/inicio/facturacion','fa-solid fa-file-invoice-dollar',1,'2026-11-15 09:45:28',NULL);
/*!40000 ALTER TABLE `menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_inventario`
--

DROP TABLE IF EXISTS `movimiento_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_inventario` (
  `movimiento_id` bigint NOT NULL AUTO_INCREMENT,
  `medicamento_id` bigint NOT NULL,
  `lote_id` bigint NOT NULL,
  `tipo` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL,
  `saldo_lote` int NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_id` int NOT NULL,
  `referencia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formula_id` bigint DEFAULT NULL,
  `despacho_id` bigint DEFAULT NULL,
  PRIMARY KEY (`movimiento_id`),
  KEY `idx_movimiento_medicamento` (`medicamento_id`,`fecha`),
  KEY `fk_movimiento_lote` (`lote_id`),
  KEY `fk_movimiento_usuario` (`usuario_id`),
  KEY `fk_movimiento_formula` (`formula_id`),
  KEY `fk_movimiento_despacho` (`despacho_id`),
  CONSTRAINT `fk_movimiento_despacho` FOREIGN KEY (`despacho_id`) REFERENCES `despacho` (`despacho_id`),
  CONSTRAINT `fk_movimiento_formula` FOREIGN KEY (`formula_id`) REFERENCES `formula_medica` (`formula_id`),
  CONSTRAINT `fk_movimiento_lote` FOREIGN KEY (`lote_id`) REFERENCES `lote_medicamento` (`lote_id`),
  CONSTRAINT `fk_movimiento_medicamento` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamento` (`id`),
  CONSTRAINT `fk_movimiento_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ck_movimiento_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `ck_movimiento_saldo` CHECK ((`saldo_lote` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_inventario`
--

LOCK TABLES `movimiento_inventario` WRITE;
/*!40000 ALTER TABLE `movimiento_inventario` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimiento_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pago`
--

DROP TABLE IF EXISTS `pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pago` (
  `pago_id` bigint NOT NULL AUTO_INCREMENT,
  `factura_id` bigint NOT NULL,
  `fecha` datetime NOT NULL,
  `valor` decimal(14,2) NOT NULL,
  `medio` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`pago_id`),
  KEY `idx_pago_factura` (`factura_id`,`fecha`),
  KEY `fk_pago_usuario` (`usuario_id`),
  CONSTRAINT `fk_pago_factura` FOREIGN KEY (`factura_id`) REFERENCES `factura` (`factura_id`),
  CONSTRAINT `fk_pago_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ck_pago_medio` CHECK ((`medio` in (_utf8mb4'EFECTIVO',_utf8mb4'TARJETA_DEBITO',_utf8mb4'TARJETA_CREDITO',_utf8mb4'TRANSFERENCIA'))),
  CONSTRAINT `ck_pago_valor` CHECK ((`valor` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago`
--

LOCK TABLES `pago` WRITE;
/*!40000 ALTER TABLE `pago` DISABLE KEYS */;
/*!40000 ALTER TABLE `pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfil`
--

DROP TABLE IF EXISTS `perfil`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil` (
  `perfil_id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`perfil_id`),
  UNIQUE KEY `uk_perfil_codigo` (`codigo`),
  UNIQUE KEY `uk_perfil_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfil`
--

LOCK TABLES `perfil` WRITE;
/*!40000 ALTER TABLE `perfil` DISABLE KEYS */;
INSERT INTO `perfil` VALUES (1,'ADMIN','Administrador',1,'2026-01-01 00:00:00',NULL),(2,'RECEPCIONISTA','Recepcion',1,'2026-01-01 00:00:00','2026-11-09 17:45:16'),(3,'VETERINARIO','Medico',1,'2026-01-01 00:00:00',NULL),(4,'DESPACHO_MEDICO','Despacho Medico',1,'2026-11-09 17:38:22','2026-11-09 17:44:45');
/*!40000 ALTER TABLE `perfil` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `perfil_menu`
--

DROP TABLE IF EXISTS `perfil_menu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil_menu` (
  `perfil_menu_id` int NOT NULL AUTO_INCREMENT,
  `perfil_id` int NOT NULL,
  `menu_id` int NOT NULL,
  PRIMARY KEY (`perfil_menu_id`),
  UNIQUE KEY `uk_perfil_menu` (`perfil_id`,`menu_id`),
  KEY `fk_perfil_menu_menu` (`menu_id`),
  CONSTRAINT `fk_perfil_menu_menu` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`menu_id`),
  CONSTRAINT `fk_perfil_menu_perfil` FOREIGN KEY (`perfil_id`) REFERENCES `perfil` (`perfil_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `perfil_menu`
--

LOCK TABLES `perfil_menu` WRITE;
/*!40000 ALTER TABLE `perfil_menu` DISABLE KEYS */;
INSERT INTO `perfil_menu` VALUES (1,1,1),(2,1,2),(3,1,3),(4,1,4),(5,1,5),(6,1,6),(7,1,7),(8,1,8),(9,1,9),(10,1,10),(11,1,11),(24,1,14),(26,1,16),(20,2,1),(13,2,2),(21,2,6),(27,2,16),(16,3,4),(17,3,5),(18,3,7),(23,3,13),(25,3,15),(19,4,7),(22,4,12);
/*!40000 ALTER TABLE `perfil_menu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raza`
--

DROP TABLE IF EXISTS `raza`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raza` (
  `raza_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `especie` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`raza_id`),
  UNIQUE KEY `uk_raza_nombre_especie` (`nombre`,`especie`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raza`
--

LOCK TABLES `raza` WRITE;
/*!40000 ALTER TABLE `raza` DISABLE KEYS */;
INSERT INTO `raza` VALUES (1,'Labrador','Perro','2026-10-16 14:56:05',NULL),(2,'Criollo','Gato','2026-10-16 14:56:05',NULL),(3,'Pastor Alemán','Perro','2026-10-16 14:56:05',NULL),(4,'Siamés','Gato','2026-10-16 14:56:05',NULL),(5,'Bulldog Francés','Perro','2026-10-16 14:56:05',NULL),(6,'Chihuahua','Perro','2026-10-16 23:35:01',NULL),(7,'De patas blancas','Caballo','2026-10-17 00:04:20',NULL),(8,'Cuernitos','Rinoceronte','2026-10-17 00:11:10',NULL);
/*!40000 ALTER TABLE `raza` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio`
--

DROP TABLE IF EXISTS `servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio` (
  `servicio_id` bigint NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `especializacion_id` bigint DEFAULT NULL COMMENT 'NULL = aplica a cualquier especialidad',
  `valor` decimal(12,2) NOT NULL,
  `iva_porcentaje` decimal(5,2) NOT NULL DEFAULT '0.00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`servicio_id`),
  UNIQUE KEY `uk_servicio_codigo` (`codigo`),
  KEY `fk_servicio_especializacion` (`especializacion_id`),
  CONSTRAINT `fk_servicio_especializacion` FOREIGN KEY (`especializacion_id`) REFERENCES `especializacion` (`id`),
  CONSTRAINT `ck_servicio_iva` CHECK ((`iva_porcentaje` between 0 and 100)),
  CONSTRAINT `ck_servicio_tipo` CHECK ((`tipo` in (_utf8mb4'CONSULTA',_utf8mb4'PROCEDIMIENTO',_utf8mb4'LABORATORIO',_utf8mb4'OTRO'))),
  CONSTRAINT `ck_servicio_valor` CHECK ((`valor` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio`
--

LOCK TABLES `servicio` WRITE;
/*!40000 ALTER TABLE `servicio` DISABLE KEYS */;
INSERT INTO `servicio` VALUES (1,'CON-MG','Consulta de Medicina General','Valor de la consulta de la especialidad','CONSULTA',1,60000.00,0.00,1,'2026-11-15 09:45:28',NULL),(2,'CON-ODO','Consulta de Odontología','Valor de la consulta de la especialidad','CONSULTA',2,80000.00,0.00,1,'2026-11-15 09:45:28',NULL),(3,'CON-DER','Consulta de Dermatología','Valor de la consulta de la especialidad','CONSULTA',3,85000.00,0.00,1,'2026-11-15 09:45:28',NULL),(4,'CON-OR','Consulta de Ortopedia','Valor de la consulta de la especialidad','CONSULTA',4,95000.00,0.00,1,'2026-11-15 09:45:28',NULL),(8,'PRO-VAC','Aplicación de vacuna','Aplicación de una dosis de vacuna (sin el biológico)','PROCEDIMIENTO',NULL,25000.00,0.00,1,'2026-11-15 09:45:28',NULL),(9,'PRO-CUR','Curación de herida','Limpieza y curación de herida superficial','PROCEDIMIENTO',NULL,35000.00,0.00,1,'2026-11-15 09:45:28',NULL),(10,'PRO-DES','Desparasitación','Administración de antiparasitario','PROCEDIMIENTO',NULL,20000.00,0.00,1,'2026-11-15 09:45:28',NULL),(11,'LAB-HEM','Hemograma','Cuadro hemático completo','LABORATORIO',NULL,45000.00,0.00,1,'2026-11-15 09:45:28',NULL),(12,'OTR-BAN','Baño medicado','Baño con champú terapéutico','OTRO',NULL,40000.00,19.00,1,'2026-11-15 09:45:28',NULL);
/*!40000 ALTER TABLE `servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `servicio_tarifa_log`
--

DROP TABLE IF EXISTS `servicio_tarifa_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio_tarifa_log` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `servicio_id` bigint NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_anterior` decimal(12,2) DEFAULT NULL,
  `valor_nuevo` decimal(12,2) DEFAULT NULL,
  `iva_anterior` decimal(5,2) DEFAULT NULL,
  `iva_nuevo` decimal(5,2) DEFAULT NULL,
  `observacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `idx_tarifa_log` (`servicio_id`,`fecha`),
  KEY `fk_tarifa_log_usuario` (`usuario_id`),
  CONSTRAINT `fk_tarifa_log_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`servicio_id`),
  CONSTRAINT `fk_tarifa_log_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ck_tarifa_log_accion` CHECK ((`accion` in (_utf8mb4'CREADO',_utf8mb4'MODIFICADO',_utf8mb4'ACTIVADO',_utf8mb4'INACTIVADO')))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `servicio_tarifa_log`
--

LOCK TABLES `servicio_tarifa_log` WRITE;
/*!40000 ALTER TABLE `servicio_tarifa_log` DISABLE KEYS */;
INSERT INTO `servicio_tarifa_log` VALUES (1,1,'2026-11-15 09:45:28',NULL,'CREADO',NULL,60000.00,NULL,0.00,'Tarifa inicial'),(2,2,'2026-11-15 09:45:28',NULL,'CREADO',NULL,80000.00,NULL,0.00,'Tarifa inicial'),(3,3,'2026-11-15 09:45:28',NULL,'CREADO',NULL,85000.00,NULL,0.00,'Tarifa inicial'),(4,4,'2026-11-15 09:45:28',NULL,'CREADO',NULL,95000.00,NULL,0.00,'Tarifa inicial'),(5,8,'2026-11-15 09:45:28',NULL,'CREADO',NULL,25000.00,NULL,0.00,'Tarifa inicial'),(6,9,'2026-11-15 09:45:28',NULL,'CREADO',NULL,35000.00,NULL,0.00,'Tarifa inicial'),(7,10,'2026-11-15 09:45:28',NULL,'CREADO',NULL,20000.00,NULL,0.00,'Tarifa inicial'),(8,11,'2026-11-15 09:45:28',NULL,'CREADO',NULL,45000.00,NULL,0.00,'Tarifa inicial'),(9,12,'2026-11-15 09:45:28',NULL,'CREADO',NULL,40000.00,NULL,19.00,'Tarifa inicial');
/*!40000 ALTER TABLE `servicio_tarifa_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `perfil_id` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_username` (`username`),
  UNIQUE KEY `uk_usuario_email` (`email`),
  KEY `fk_usuario_perfil` (`perfil_id`),
  CONSTRAINT `fk_usuario_perfil` FOREIGN KEY (`perfil_id`) REFERENCES `perfil` (`perfil_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'usuario.prueba','prueba@clinica.test','pbkdf2$210000$ahujrOT+y694TwnisTLLrQ==$g5cZQSLwCxETuyAkDg+TJcGYUUOblbij2lgZBtFTQyk=',2,0,'2026-10-16 23:27:33','2026-10-16 23:27:35'),(2,'Emerson','emer@hola.com','pbkdf2$210000$w9HB0uiNEX1b5MmAeaR9fQ==$hL5U+jBO+VrTkMotmDisNtAIv2DKggeoHaCVU4CdMOc=',3,1,'2026-10-16 23:30:15','2026-10-17 00:12:21'),(3,'Edison','edison33@hola.com','pbkdf2$210000$V+b3Xf+rr9XnadfW2k4s7g==$5VX+QoZDQ8DHOHE4BdcYAW9YHxYFWVD2KIXdndd377k=',2,1,'2026-10-17 00:12:00',NULL),(4,'admin','admin@clinica.test','pbkdf2$210000$vgzxfnzWJ0kA3B6Wqhjpbg==$FA1KuiprrJWTJTS5zet0jZ2tINjv6pQvi3djxF6livM=',1,1,'2026-11-09 17:10:56','2026-11-09 17:44:45'),(5,'secretaria','secretaria@clinica.test','pbkdf2$210000$V16GuQvlZjLukN5hjW/r6w==$uvDK6P+FxB7zcu5CIV9vZOyy1fgzzEV3gFCSy23YRyw=',2,1,'2026-11-09 17:10:57',NULL),(6,'despacho','despacho@clinica.test','pbkdf2$210000$ufxo9mqXM8TW7MQgKbOpPQ==$/cH8PwqP0rpHxMQIAnWqIrjT0PqyyzZZaW+R+laskLk=',4,1,'2026-11-09 17:10:59','2026-11-09 17:17:53'),(7,'veterinario','veterinario@clinica.test','pbkdf2$210000$5PGb02gLc3++PmpTjViRjg==$DzRlkOfoz8hJX8pjdoqYbFTyBUCQXiCyWmFKi9jQYKk=',3,1,'2026-11-09 17:11:00',NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'clinica'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-15  9:45:37
