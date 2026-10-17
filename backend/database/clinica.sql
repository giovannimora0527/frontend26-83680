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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'd558779a-b621-11f1-a56f-9cc7d38c92b9:1-297';

--
-- Current Database: `clinica`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `clinica` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `clinica`;

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
  `descripcion` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacion` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diagnostico` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `motivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`cita_id`),
  KEY `idx_cita_fecha_hora` (`fecha_hora`),
  KEY `idx_cita_medico` (`medico_id`,`fecha_hora`),
  KEY `idx_cita_mascota` (`mascota_id`,`fecha_hora`),
  CONSTRAINT `fk_cita_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascota` (`mascota_id`),
  CONSTRAINT `fk_cita_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cita`
--

LOCK TABLES `cita` WRITE;
/*!40000 ALTER TABLE `cita` DISABLE KEYS */;
INSERT INTO `cita` VALUES (1,1,1,'2026-10-17 08:41:00','Consulta por primera vez.','CONFIRMADA','2026-10-16 14:56:06','2026-10-16 16:43:24'),(2,2,2,'2025-10-16 21:30:00','Consulta general','PROGRAMADA','2026-10-16 14:56:06',NULL),(3,3,1,'2024-06-20 18:30:00','Consulta general','ATENDIDA','2026-10-16 14:56:06',NULL),(4,4,2,'2024-06-21 14:30:00','Consulta odontologica','CANCELADA','2026-10-16 14:56:06',NULL),(5,1,1,'2026-10-17 23:30:00','revisoon general','PROGRAMADA','2026-10-16 21:31:03',NULL);
/*!40000 ALTER TABLE `cita` ENABLE KEYS */;
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
  `tipo_documento` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `genero` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
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
-- Table structure for table `especializacion`
--

DROP TABLE IF EXISTS `especializacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especializacion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_especializacion` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
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
INSERT INTO `especializacion` VALUES (1,'Medicina General','Atención médica general de mascotas','MG'),(2,'Odontología','Salud dental veterinaria','ODO'),(3,'Dermatología','Enfermedades de la piel','DER'),(4,'Ortopedia','Estudio y cuidado de huesos, articulaciones, ligamentos, tendones, músculos y nervios','OR');
/*!40000 ALTER TABLE `especializacion` ENABLE KEYS */;
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
  `medicamento_id` bigint NOT NULL,
  `fecha_emision` date NOT NULL,
  `dosis` decimal(10,2) NOT NULL,
  `unidad_dosis` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia_horas` int NOT NULL,
  `duracion_dias` int NOT NULL,
  `indicaciones` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVA',
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`formula_id`),
  KEY `idx_formula_historia` (`historia_id`),
  KEY `idx_formula_creacion` (`fecha_creacion`),
  KEY `fk_formula_medico` (`medico_id`),
  KEY `fk_formula_medicamento` (`medicamento_id`),
  CONSTRAINT `fk_formula_historia` FOREIGN KEY (`historia_id`) REFERENCES `historia_clinica` (`historia_id`),
  CONSTRAINT `fk_formula_medicamento` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamento` (`id`),
  CONSTRAINT `fk_formula_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`),
  CONSTRAINT `ck_formula_dosis` CHECK ((`dosis` > 0)),
  CONSTRAINT `ck_formula_duracion` CHECK ((`duracion_dias` between 1 and 365)),
  CONSTRAINT `ck_formula_frecuencia` CHECK ((`frecuencia_horas` between 1 and 168))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formula_medica`
--

LOCK TABLES `formula_medica` WRITE;
/*!40000 ALTER TABLE `formula_medica` DISABLE KEYS */;
INSERT INTO `formula_medica` VALUES (1,1,1,1,'2026-10-16',250.00,'mg',12,10,'Administrar con alimento. Suspender si presenta vómito.','ACTIVA','2026-10-16 23:27:04','2026-10-16 23:27:09');
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
  `motivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `diagnostico` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `observaciones` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTA',
  `fecha_creacion` datetime NOT NULL,
  PRIMARY KEY (`historia_id`),
  UNIQUE KEY `uk_historia_cita` (`cita_id`),
  KEY `idx_historia_mascota` (`mascota_id`,`fecha_hora`),
  KEY `fk_historia_medico` (`medico_id`),
  CONSTRAINT `fk_historia_cita` FOREIGN KEY (`cita_id`) REFERENCES `cita` (`cita_id`),
  CONSTRAINT `fk_historia_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascota` (`mascota_id`),
  CONSTRAINT `fk_historia_medico` FOREIGN KEY (`medico_id`) REFERENCES `medico` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historia_clinica`
--

LOCK TABLES `historia_clinica` WRITE;
/*!40000 ALTER TABLE `historia_clinica` DISABLE KEYS */;
INSERT INTO `historia_clinica` VALUES (1,3,1,3,'2024-06-20 18:30:00','Consulta general','Control general sin hallazgos relevantes.','Desparasitación y vitaminas por 15 días.','ABIERTA','2026-10-16 16:59:02');
/*!40000 ALTER TABLE `historia_clinica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mascota`
--

DROP TABLE IF EXISTS `mascota`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mascota` (
  `mascota_id` int NOT NULL AUTO_INCREMENT,
  `nombre_mascota` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mascota`
--

LOCK TABLES `mascota` WRITE;
/*!40000 ALTER TABLE `mascota` DISABLE KEYS */;
INSERT INTO `mascota` VALUES (1,'Bella',3,2,'2026-10-16 14:56:06',NULL,1),(2,'Max',5,1,'2026-10-16 14:56:06',NULL,2),(3,'Rocky',4,3,'2026-10-16 14:56:06',NULL,3),(4,'Thor',2,5,'2026-10-16 14:56:06',NULL,1),(5,'Luna',1,4,'2026-10-16 14:56:06',NULL,4),(6,'Canela',4,5,'2026-10-16 23:46:40','2026-10-16 23:46:44',1);
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
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `presentacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_compra` date DEFAULT NULL,
  `fecha_vence` date DEFAULT NULL,
  `fecha_creacion_registro` datetime DEFAULT NULL,
  `fecha_modificacion_registro` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicamento`
--

LOCK TABLES `medicamento` WRITE;
/*!40000 ALTER TABLE `medicamento` DISABLE KEYS */;
INSERT INTO `medicamento` VALUES (1,'Amoxicilina','Antibiótico de amplio espectro','Tabletas 250 mg','2026-01-10','2027-06-30','2026-10-16 14:56:06',NULL),(2,'Meloxicam','Antiinflamatorio y analgésico','Suspensión 1.5 mg/ml','2026-02-15','2027-08-31','2026-10-16 14:56:06',NULL),(3,'Ivermectina','Antiparasitario','Solución inyectable 1%','2026-03-05','2027-12-31','2026-10-16 14:56:06',NULL),(4,'Prednisolona','Corticoide antiinflamatorio','Tabletas 5 mg','2026-04-20','2027-10-15','2026-10-16 14:56:06',NULL);
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
  `tipo_documento` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_profesional` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `especializacion_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_medico_documento` (`tipo_documento`,`numero_documento`),
  UNIQUE KEY `uk_medico_registro` (`registro_profesional`),
  KEY `fk_medico_especializacion` (`especializacion_id`),
  CONSTRAINT `fk_medico_especializacion` FOREIGN KEY (`especializacion_id`) REFERENCES `especializacion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medico`
--

LOCK TABLES `medico` WRITE;
/*!40000 ALTER TABLE `medico` DISABLE KEYS */;
INSERT INTO `medico` VALUES (1,'CC','52100200','María','Rodríguez López','3001112233','RP-1001',1),(2,'CC','80300400','Carlos','Martínez Ruiz','3004445566','RP-1002',2),(3,'CC','1020304050','Laura','Gómez Pardo','3007778899','RP-1003',3),(4,'CC','1098765432','Laura','Gómez Prieto','3001112233','RP-2001',2);
/*!40000 ALTER TABLE `medico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `raza`
--

DROP TABLE IF EXISTS `raza`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raza` (
  `raza_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `especie` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`raza_id`),
  UNIQUE KEY `uk_raza_nombre_especie` (`nombre`,`especie`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `raza`
--

LOCK TABLES `raza` WRITE;
/*!40000 ALTER TABLE `raza` DISABLE KEYS */;
INSERT INTO `raza` VALUES (1,'Labrador','Perro','2026-10-16 14:56:05',NULL),(2,'Criollo','Gato','2026-10-16 14:56:05',NULL),(3,'Pastor Alemán','Perro','2026-10-16 14:56:05',NULL),(4,'Siamés','Gato','2026-10-16 14:56:05',NULL),(5,'Bulldog Francés','Perro','2026-10-16 14:56:05',NULL),(6,'Chihuahua','Perro','2026-10-16 23:35:01',NULL);
/*!40000 ALTER TABLE `raza` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_creacion` datetime NOT NULL,
  `fecha_modificacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_username` (`username`),
  UNIQUE KEY `uk_usuario_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'usuario.prueba','prueba@clinica.test','pbkdf2$210000$ahujrOT+y694TwnisTLLrQ==$g5cZQSLwCxETuyAkDg+TJcGYUUOblbij2lgZBtFTQyk=','RECEPCIONISTA',0,'2026-10-16 23:27:33','2026-10-16 23:27:35'),(2,'Emerson','emer@hola.com','pbkdf2$210000$w9HB0uiNEX1b5MmAeaR9fQ==$hL5U+jBO+VrTkMotmDisNtAIv2DKggeoHaCVU4CdMOc=','VETERINARIO',1,'2026-10-16 23:30:15',NULL);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
