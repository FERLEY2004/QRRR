CREATE DATABASE  IF NOT EXISTS `control_acceso_sena` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `control_acceso_sena`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: control_acceso_sena
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accesos`
--

DROP TABLE IF EXISTS `accesos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accesos` (
  `id_acceso` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `id_usuario_registro` int DEFAULT NULL,
  `tipo_acceso` enum('entrada','salida') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'entrada',
  `fecha_entrada` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_salida` timestamp NULL DEFAULT NULL,
  `estado` enum('activo','finalizado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_acceso`),
  KEY `idx_id_persona` (`id_persona`),
  KEY `idx_fecha_entrada` (`fecha_entrada`),
  KEY `idx_fecha_salida` (`fecha_salida`),
  KEY `idx_estado` (`estado`),
  KEY `idx_tipo_acceso` (`tipo_acceso`),
  KEY `idx_usuario_registro` (`id_usuario_registro`),
  CONSTRAINT `accesos_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE,
  CONSTRAINT `accesos_ibfk_2` FOREIGN KEY (`id_usuario_registro`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `alertas`
--

DROP TABLE IF EXISTS `alertas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alertas` (
  `id_alerta` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('acceso_fuera_horario','intento_fraudulento','qr_expirado','documento_no_registrado','comportamiento_sospechoso','sistema','seguridad') COLLATE utf8mb4_unicode_ci NOT NULL,
  `severidad` enum('critica','alta','media','baja') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'media',
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_persona` int DEFAULT NULL,
  `id_acceso` int DEFAULT NULL,
  `id_usuario` int DEFAULT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_lectura` timestamp NULL DEFAULT NULL,
  `id_usuario_lectura` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id_alerta`),
  KEY `id_acceso` (`id_acceso`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_usuario_lectura` (`id_usuario_lectura`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_severidad` (`severidad`),
  KEY `idx_leida` (`leida`),
  KEY `idx_fecha_creacion` (`fecha_creacion`),
  KEY `idx_id_persona` (`id_persona`),
  CONSTRAINT `alertas_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE SET NULL,
  CONSTRAINT `alertas_ibfk_2` FOREIGN KEY (`id_acceso`) REFERENCES `accesos` (`id_acceso`) ON DELETE SET NULL,
  CONSTRAINT `alertas_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `alertas_ibfk_4` FOREIGN KEY (`id_usuario_lectura`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id_auditoria` int NOT NULL AUTO_INCREMENT,
  `tabla_afectada` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_registro` int DEFAULT NULL,
  `accion` enum('INSERT','UPDATE','DELETE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `id_usuario` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_auditoria`),
  KEY `id_usuario` (`id_usuario`),
  KEY `idx_tabla` (`tabla_afectada`),
  KEY `idx_accion` (`accion`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion` (
  `id_config` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci,
  `tipo` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_config`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_clave` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=322 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evidencia_fotografica`
--

DROP TABLE IF EXISTS `evidencia_fotografica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidencia_fotografica` (
  `id_evidencia` int NOT NULL AUTO_INCREMENT,
  `tipo_incidente` enum('acceso_denegado','comportamiento_sospechoso','incidente_seguridad','evidencia_general') COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_foto` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hash_archivo` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_captura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario_captura` int DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id_evidencia`),
  KEY `id_usuario_captura` (`id_usuario_captura`),
  KEY `idx_tipo` (`tipo_incidente`),
  KEY `idx_fecha` (`fecha_captura`),
  CONSTRAINT `evidencia_fotografica_ibfk_1` FOREIGN KEY (`id_usuario_captura`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fichas`
--

DROP TABLE IF EXISTS `fichas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fichas` (
  `id_ficha` int NOT NULL AUTO_INCREMENT,
  `codigo_ficha` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_programa` int NOT NULL,
  `jornada` enum('diurna','nocturna','mixta') COLLATE utf8mb4_unicode_ci DEFAULT 'diurna',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `estado` enum('activa','finalizada','cancelada') COLLATE utf8mb4_unicode_ci DEFAULT 'activa',
  `numero_aprendices` int DEFAULT '0',
  `capacidad_maxima` int DEFAULT NULL,
  PRIMARY KEY (`id_ficha`),
  UNIQUE KEY `codigo_ficha` (`codigo_ficha`),
  KEY `idx_codigo` (`codigo_ficha`),
  KEY `idx_programa` (`id_programa`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fechas` (`fecha_inicio`,`fecha_fin`),
  CONSTRAINT `fichas_ibfk_1` FOREIGN KEY (`id_programa`) REFERENCES `programas_formacion` (`id_programa`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs_seguridad`
--

DROP TABLE IF EXISTS `logs_seguridad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs_seguridad` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `tipo` enum('login_exitoso','login_fallido','cambio_password','modificacion_usuario','acceso_sistema') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_usuario` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `accion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalles` json DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_fecha` (`fecha`),
  CONSTRAINT `logs_seguridad_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personas`
--

DROP TABLE IF EXISTS `personas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personas` (
  `id_persona` int NOT NULL AUTO_INCREMENT,
  `tipo_documento` enum('CC','TI','CE','PASAPORTE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CC',
  `documento` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rh` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Grupo sanguíneo',
  `id_rol` int NOT NULL,
  `id_ficha` int DEFAULT NULL COMMENT 'Solo para aprendices',
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo para instructores/administrativos',
  `tipo_contrato` enum('planta','contrato','catedra') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo para instructores',
  `codigo_qr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('ACTIVO','INACTIVO','SUSPENDIDO') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVO',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `documento` (`documento`),
  KEY `idx_documento` (`documento`),
  KEY `idx_tipo_doc` (`tipo_documento`),
  KEY `idx_rol` (`id_rol`),
  KEY `idx_ficha` (`id_ficha`),
  KEY `idx_estado` (`estado`),
  KEY `idx_email` (`email`),
  CONSTRAINT `personas_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON DELETE RESTRICT,
  CONSTRAINT `personas_ibfk_2` FOREIGN KEY (`id_ficha`) REFERENCES `fichas` (`id_ficha`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla personas - SIN redundancias ni circuitos cerrados';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `programas_formacion`
--

DROP TABLE IF EXISTS `programas_formacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programas_formacion` (
  `id_programa` int NOT NULL AUTO_INCREMENT,
  `codigo_programa` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_programa` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nivel` enum('Técnico','Tecnológico','Especialización','Complementaria') COLLATE utf8mb4_unicode_ci DEFAULT 'Técnico',
  `duracion_meses` int DEFAULT '12',
  `area_conocimiento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('activo','inactivo') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_programa`),
  UNIQUE KEY `codigo_programa` (`codigo_programa`),
  KEY `idx_codigo` (`codigo_programa`),
  KEY `idx_estado` (`estado`),
  KEY `idx_nombre` (`nombre_programa`(100))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registros_entrada_salida`
--

DROP TABLE IF EXISTS `registros_entrada_salida`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registros_entrada_salida` (
  `id_registro` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `tipo` enum('ENTRADA','SALIDA') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario_registro` int DEFAULT NULL COMMENT 'Guarda que registró',
  PRIMARY KEY (`id_registro`),
  KEY `id_usuario_registro` (`id_usuario_registro`),
  KEY `idx_persona` (`id_persona`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_fecha` (`fecha_hora`),
  KEY `idx_persona_fecha` (`id_persona`,`fecha_hora` DESC),
  CONSTRAINT `registros_entrada_salida_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE,
  CONSTRAINT `registros_entrada_salida_ibfk_2` FOREIGN KEY (`id_usuario_registro`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registros independientes - Sin circuitos cerrados';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tr_sync_accesos_entrada` AFTER INSERT ON `registros_entrada_salida` FOR EACH ROW BEGIN
  DECLARE v_id_usuario_registro INT DEFAULT NULL;
  
  IF NEW.tipo = 'ENTRADA' THEN
    INSERT INTO Accesos (
      id_persona,
      id_usuario_registro,
      tipo_acceso,
      fecha_entrada,
      estado,
      fecha_creacion,
      fecha_actualizacion
    ) VALUES (
      NEW.id_persona,
      v_id_usuario_registro,
      'entrada',
      NEW.fecha_hora,
      'activo',
      NEW.fecha_hora,
      NEW.fecha_hora
    );
  ELSEIF NEW.tipo = 'SALIDA' THEN
    UPDATE Accesos
    SET fecha_salida = NEW.fecha_hora,
        estado = 'finalizado',
        fecha_actualizacion = NOW()
    WHERE id_acceso = (
      SELECT id_acceso FROM (
        SELECT id_acceso
        FROM Accesos
        WHERE id_persona = NEW.id_persona
          AND estado = 'activo'
          AND fecha_salida IS NULL
        ORDER BY fecha_entrada DESC
        LIMIT 1
      ) AS temp
    );
    
    IF ROW_COUNT() = 0 THEN
      INSERT INTO Accesos (
        id_persona,
        id_usuario_registro,
        tipo_acceso,
        fecha_entrada,
        fecha_salida,
        estado,
        fecha_creacion,
        fecha_actualizacion
      ) VALUES (
        NEW.id_persona,
        v_id_usuario_registro,
        'salida',
        NEW.fecha_hora,
        NEW.fecha_hora,
        'finalizado',
        NEW.fecha_hora,
        NEW.fecha_hora
      );
    END IF;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`),
  KEY `idx_nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=645 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwords` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('GUARDA','ADMINISTRADOR') COLLATE utf8mb4_unicode_ci DEFAULT 'GUARDA',
  `estado` enum('ACTIVO','INACTIVO') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVO',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_rol` (`rol`),
  KEY `idx_estado` (`estado`),
  KEY `idx_reset_token` (`reset_token`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_estadisticas_diarias`
--

DROP TABLE IF EXISTS `v_estadisticas_diarias`;
/*!50001 DROP VIEW IF EXISTS `v_estadisticas_diarias`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_estadisticas_diarias` AS SELECT 
 1 AS `fecha`,
 1 AS `total_entradas`,
 1 AS `total_salidas`,
 1 AS `personas_unicas`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_historial_accesos`
--

DROP TABLE IF EXISTS `v_historial_accesos`;
/*!50001 DROP VIEW IF EXISTS `v_historial_accesos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_historial_accesos` AS SELECT 
 1 AS `id_registro`,
 1 AS `id_persona`,
 1 AS `nombre_completo`,
 1 AS `documento`,
 1 AS `nombre_rol`,
 1 AS `tipo`,
 1 AS `fecha_hora`,
 1 AS `fecha`,
 1 AS `hora`,
 1 AS `codigo_ficha`,
 1 AS `nombre_programa`,
 1 AS `registrado_por`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_personas_completo`
--

DROP TABLE IF EXISTS `v_personas_completo`;
/*!50001 DROP VIEW IF EXISTS `v_personas_completo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_personas_completo` AS SELECT 
 1 AS `id_persona`,
 1 AS `tipo_documento`,
 1 AS `documento`,
 1 AS `nombre_completo`,
 1 AS `nombres`,
 1 AS `apellidos`,
 1 AS `email`,
 1 AS `telefono`,
 1 AS `rh`,
 1 AS `nombre_rol`,
 1 AS `rol_descripcion`,
 1 AS `id_ficha`,
 1 AS `codigo_ficha`,
 1 AS `nombre_programa`,
 1 AS `codigo_programa`,
 1 AS `jornada`,
 1 AS `cargo`,
 1 AS `tipo_contrato`,
 1 AS `codigo_qr`,
 1 AS `foto`,
 1 AS `estado`,
 1 AS `fecha_registro`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_personas_dentro`
--

DROP TABLE IF EXISTS `v_personas_dentro`;
/*!50001 DROP VIEW IF EXISTS `v_personas_dentro`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_personas_dentro` AS SELECT 
 1 AS `id_persona`,
 1 AS `nombre_completo`,
 1 AS `documento`,
 1 AS `nombre_rol`,
 1 AS `foto`,
 1 AS `fecha_entrada`,
 1 AS `minutos_dentro`,
 1 AS `codigo_ficha`,
 1 AS `nombre_programa`,
 1 AS `zona`,
 1 AS `motivo_visita`,
 1 AS `persona_visita`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `visitantes`
--

DROP TABLE IF EXISTS `visitantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitantes` (
  `id_visitante` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `motivo_visita` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `zona_destino` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `persona_visita` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zona` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Destino dentro de las instalaciones',
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `estado` enum('ACTIVO','FINALIZADO','EXPIRADO') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVO',
  PRIMARY KEY (`id_visitante`),
  KEY `idx_persona` (`id_persona`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_inicio` (`fecha_inicio`),
  CONSTRAINT `visitantes_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'control_acceso_sena'
--

--
-- Dumping routines for database 'control_acceso_sena'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_personas_dentro` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_personas_dentro`()
BEGIN
    SELECT * FROM v_personas_dentro
    ORDER BY fecha_entrada DESC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_registrar_entrada` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_entrada`(
    IN p_id_persona INT,
    IN p_id_usuario INT
)
BEGIN
    INSERT INTO registros_entrada_salida 
    (id_persona, tipo, fecha_hora, id_usuario_registro)
    VALUES 
    (p_id_persona, 'ENTRADA', NOW(), p_id_usuario);
    
    SELECT LAST_INSERT_ID() as id_registro;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_registrar_salida` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_salida`(
    IN p_id_persona INT,
    IN p_id_usuario INT
)
BEGIN
    INSERT INTO registros_entrada_salida 
    (id_persona, tipo, fecha_hora, id_usuario_registro)
    VALUES 
    (p_id_persona, 'SALIDA', NOW(), p_id_usuario);
    
    SELECT LAST_INSERT_ID() as id_registro;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reporte_asistencia_ficha` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_reporte_asistencia_ficha`(
    IN p_id_ficha INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    SELECT 
        p.id_persona,
        p.documento,
        CONCAT(p.nombres, ' ', p.apellidos) as nombre_completo,
        COUNT(DISTINCT DATE(reg.fecha_hora)) as dias_asistencia,
        COUNT(CASE WHEN reg.tipo = 'ENTRADA' THEN 1 END) as total_entradas,
        COUNT(CASE WHEN reg.tipo = 'SALIDA' THEN 1 END) as total_salidas
    FROM personas p
    LEFT JOIN registros_entrada_salida reg 
        ON p.id_persona = reg.id_persona
        AND DATE(reg.fecha_hora) BETWEEN p_fecha_inicio AND p_fecha_fin
    WHERE p.id_ficha = p_id_ficha
      AND p.estado = 'ACTIVO'
    GROUP BY p.id_persona, p.documento, p.nombres, p.apellidos
    ORDER BY dias_asistencia DESC;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_ultima_accion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_ultima_accion`(IN p_id_persona INT)
BEGIN
    SELECT 
        tipo,
        fecha_hora,
        TIMESTAMPDIFF(MINUTE, fecha_hora, NOW()) as minutos_transcurridos
    FROM registros_entrada_salida
    WHERE id_persona = p_id_persona
    ORDER BY fecha_hora DESC
    LIMIT 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `v_estadisticas_diarias`
--

/*!50001 DROP VIEW IF EXISTS `v_estadisticas_diarias`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_estadisticas_diarias` AS select cast(`registros_entrada_salida`.`fecha_hora` as date) AS `fecha`,count((case when (`registros_entrada_salida`.`tipo` = 'ENTRADA') then 1 end)) AS `total_entradas`,count((case when (`registros_entrada_salida`.`tipo` = 'SALIDA') then 1 end)) AS `total_salidas`,count(distinct `registros_entrada_salida`.`id_persona`) AS `personas_unicas` from `registros_entrada_salida` group by cast(`registros_entrada_salida`.`fecha_hora` as date) order by `fecha` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_historial_accesos`
--

/*!50001 DROP VIEW IF EXISTS `v_historial_accesos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_historial_accesos` AS select `reg`.`id_registro` AS `id_registro`,`reg`.`id_persona` AS `id_persona`,concat(`p`.`nombres`,' ',`p`.`apellidos`) AS `nombre_completo`,`p`.`documento` AS `documento`,`r`.`nombre_rol` AS `nombre_rol`,`reg`.`tipo` AS `tipo`,`reg`.`fecha_hora` AS `fecha_hora`,cast(`reg`.`fecha_hora` as date) AS `fecha`,cast(`reg`.`fecha_hora` as time) AS `hora`,`f`.`codigo_ficha` AS `codigo_ficha`,`prog`.`nombre_programa` AS `nombre_programa`,`u`.`nombre` AS `registrado_por` from (((((`registros_entrada_salida` `reg` join `personas` `p` on((`reg`.`id_persona` = `p`.`id_persona`))) join `roles` `r` on((`p`.`id_rol` = `r`.`id_rol`))) left join `fichas` `f` on((`p`.`id_ficha` = `f`.`id_ficha`))) left join `programas_formacion` `prog` on((`f`.`id_programa` = `prog`.`id_programa`))) left join `usuarios` `u` on((`reg`.`id_usuario_registro` = `u`.`id_usuario`))) order by `reg`.`fecha_hora` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_personas_completo`
--

/*!50001 DROP VIEW IF EXISTS `v_personas_completo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_personas_completo` AS select `p`.`id_persona` AS `id_persona`,`p`.`tipo_documento` AS `tipo_documento`,`p`.`documento` AS `documento`,concat(`p`.`nombres`,' ',`p`.`apellidos`) AS `nombre_completo`,`p`.`nombres` AS `nombres`,`p`.`apellidos` AS `apellidos`,`p`.`email` AS `email`,`p`.`telefono` AS `telefono`,`p`.`rh` AS `rh`,`r`.`nombre_rol` AS `nombre_rol`,`r`.`descripcion` AS `rol_descripcion`,`p`.`id_ficha` AS `id_ficha`,`f`.`codigo_ficha` AS `codigo_ficha`,`prog`.`nombre_programa` AS `nombre_programa`,`prog`.`codigo_programa` AS `codigo_programa`,`f`.`jornada` AS `jornada`,`p`.`cargo` AS `cargo`,`p`.`tipo_contrato` AS `tipo_contrato`,`p`.`codigo_qr` AS `codigo_qr`,`p`.`foto` AS `foto`,`p`.`estado` AS `estado`,`p`.`fecha_registro` AS `fecha_registro` from (((`personas` `p` join `roles` `r` on((`p`.`id_rol` = `r`.`id_rol`))) left join `fichas` `f` on((`p`.`id_ficha` = `f`.`id_ficha`))) left join `programas_formacion` `prog` on((`f`.`id_programa` = `prog`.`id_programa`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_personas_dentro`
--

/*!50001 DROP VIEW IF EXISTS `v_personas_dentro`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_personas_dentro` AS select `p`.`id_persona` AS `id_persona`,concat(`p`.`nombres`,' ',`p`.`apellidos`) AS `nombre_completo`,`p`.`documento` AS `documento`,`r`.`nombre_rol` AS `nombre_rol`,`p`.`foto` AS `foto`,`reg`.`fecha_hora` AS `fecha_entrada`,timestampdiff(MINUTE,`reg`.`fecha_hora`,now()) AS `minutos_dentro`,`f`.`codigo_ficha` AS `codigo_ficha`,`prog`.`nombre_programa` AS `nombre_programa`,`v`.`zona` AS `zona`,`v`.`motivo_visita` AS `motivo_visita`,`v`.`persona_visita` AS `persona_visita` from (((((`personas` `p` join `roles` `r` on((`p`.`id_rol` = `r`.`id_rol`))) join `registros_entrada_salida` `reg` on((`p`.`id_persona` = `reg`.`id_persona`))) left join `fichas` `f` on((`p`.`id_ficha` = `f`.`id_ficha`))) left join `programas_formacion` `prog` on((`f`.`id_programa` = `prog`.`id_programa`))) left join `visitantes` `v` on(((`p`.`id_persona` = `v`.`id_persona`) and (`v`.`estado` = 'ACTIVO')))) where ((`reg`.`tipo` = 'ENTRADA') and (`reg`.`fecha_hora` = (select max(`registros_entrada_salida`.`fecha_hora`) from `registros_entrada_salida` where (`registros_entrada_salida`.`id_persona` = `p`.`id_persona`))) and exists(select 1 from `registros_entrada_salida` `r2` where ((`r2`.`id_persona` = `p`.`id_persona`) and (`r2`.`tipo` = 'SALIDA') and (`r2`.`fecha_hora` > `reg`.`fecha_hora`))) is false and (`p`.`estado` = 'ACTIVO')) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-06 11:04:38
