-- NOTI ICE — Fase 1: SOLO PROPUESTA, NO EJECUTAR TODAVÍA.
-- Destino autorizado FUTURO: únicamente portal_noticias_pruebas (MySQL 8).
-- Seis tablas nuevas. No ALTER/DROP/DELETE/INSERT ni cambios a tablas existentes.
-- Los CREATE TABLE son DDL: MySQL realiza confirmación implícita; no hay rollback transaccional.
-- Requiere autorización específica posterior, respaldo y revisión de esquema antes de ejecutar.
USE `portal_noticias_pruebas`;

CREATE TABLE `catalogomateriasplanes` (
  `idMateriaCatalogo` INT NOT NULL AUTO_INCREMENT,
  `IdOrigen` VARCHAR(180) NOT NULL,
  `ClaveInterna` VARCHAR(80) NULL,
  `ClaveOficialIPN` VARCHAR(50) NULL,
  `ClaveOficialVerificada` BIT(1) NOT NULL DEFAULT b'0',
  `FuenteClaveOficialIPN` VARCHAR(500) NULL,
  `FechaVerificacionClaveOficialIPN` DATE NULL,
  `Nombre` VARCHAR(180) NOT NULL,
  `Plan` VARCHAR(10) NOT NULL,
  `Programa` VARCHAR(180) NOT NULL,
  `Semestre` INT NOT NULL,
  `Tipo` VARCHAR(60) NULL,
  `Especialidad` VARCHAR(120) NULL,
  `Area` VARCHAR(120) NULL,
  `Activo` BIT(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`idMateriaCatalogo`),
  UNIQUE KEY `uq_catalogomateriasplanes_origen` (`IdOrigen`),
  CONSTRAINT `chk_catalogomateriasplanes_semestre` CHECK (`Semestre` BETWEEN 1 AND 12),
  CONSTRAINT `chk_catalogomateriasplanes_clave_oficial` CHECK (
    (`ClaveOficialVerificada` = b'0' AND
     `ClaveOficialIPN` IS NULL AND `FuenteClaveOficialIPN` IS NULL AND
     `FechaVerificacionClaveOficialIPN` IS NULL)
    OR
    (`ClaveOficialVerificada` = b'1' AND
     `ClaveOficialIPN` IS NOT NULL AND CHAR_LENGTH(TRIM(`ClaveOficialIPN`)) > 0 AND
     `FuenteClaveOficialIPN` IS NOT NULL AND CHAR_LENGTH(TRIM(`FuenteClaveOficialIPN`)) > 0 AND
     `FechaVerificacionClaveOficialIPN` IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ClaveInterna no es única (duplicado conocido); ClaveOficialIPN nunca se inventa.
-- Si no hay fuente oficial comprobada, los cuatro campos oficiales quedan vacíos/falso.

CREATE TABLE `ofertaperiodos` (
  `idPeriodo` INT NOT NULL AUTO_INCREMENT,
  `Clave` VARCHAR(20) NOT NULL,
  `Descripcion` VARCHAR(180) NULL,
  `Activo` BIT(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`idPeriodo`),
  UNIQUE KEY `uq_ofertaperiodos_clave` (`Clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ofertagrupos` (
  `idGrupoOferta` INT NOT NULL AUTO_INCREMENT,
  `idPeriodo` INT NOT NULL,
  `CodigoGrupo` VARCHAR(30) NOT NULL,
  `Programa` VARCHAR(180) NOT NULL,
  `Plan` VARCHAR(10) NOT NULL,
  `Semestre` INT NOT NULL,
  `Turno` VARCHAR(50) NULL,
  `Modalidad` VARCHAR(80) NULL,
  `Especialidad` VARCHAR(120) NULL,
  `EsEspecial` BIT(1) NOT NULL DEFAULT b'0',
  `UrlFuente` VARCHAR(500) NULL,
  `FechaActualizacionFuente` DATE NULL,
  `FechaConsulta` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ChecksumFuente` CHAR(64) NULL,
  `Activo` BIT(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`idGrupoOferta`),
  UNIQUE KEY `uq_ofertagrupos_identidad` (`idPeriodo`,`Programa`,`Plan`,`CodigoGrupo`),
  CONSTRAINT `fk_ofertagrupos_periodo`
    FOREIGN KEY (`idPeriodo`) REFERENCES `ofertaperiodos` (`idPeriodo`) ON DELETE RESTRICT,
  CONSTRAINT `chk_ofertagrupos_semestre` CHECK (`Semestre` BETWEEN 1 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ofertaunidades` (
  `idUnidadOferta` INT NOT NULL AUTO_INCREMENT,
  `idGrupoOferta` INT NOT NULL,
  `NombrePublicado` VARCHAR(180) NOT NULL,
  `EsLaboratorio` BIT(1) NOT NULL DEFAULT b'0',
  `AulaPublicada` VARCHAR(120) NULL,
  `idMateriaCatalogo` INT NULL,
  `OrdenFuente` INT NOT NULL,
  PRIMARY KEY (`idUnidadOferta`),
  UNIQUE KEY `uq_ofertaunidades_orden` (`idGrupoOferta`,`OrdenFuente`),
  KEY `ix_ofertaunidades_catalogo` (`idMateriaCatalogo`),
  CONSTRAINT `fk_ofertaunidades_grupo`
    FOREIGN KEY (`idGrupoOferta`) REFERENCES `ofertagrupos` (`idGrupoOferta`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ofertaunidades_catalogo`
    FOREIGN KEY (`idMateriaCatalogo`) REFERENCES `catalogomateriasplanes` (`idMateriaCatalogo`) ON DELETE RESTRICT,
  CONSTRAINT `chk_ofertaunidades_orden` CHECK (`OrdenFuente` >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ofertasesiones` (
  `idSesion` INT NOT NULL AUTO_INCREMENT,
  `idUnidadOferta` INT NOT NULL,
  `DiaSemana` INT NOT NULL,
  `HoraInicio` TIME NOT NULL,
  `HoraFin` TIME NOT NULL,
  `Aula` VARCHAR(120) NULL,
  PRIMARY KEY (`idSesion`),
  UNIQUE KEY `uq_ofertasesiones_bloque` (`idUnidadOferta`,`DiaSemana`,`HoraInicio`,`HoraFin`),
  CONSTRAINT `fk_ofertasesiones_unidad`
    FOREIGN KEY (`idUnidadOferta`) REFERENCES `ofertaunidades` (`idUnidadOferta`) ON DELETE RESTRICT,
  CONSTRAINT `chk_ofertasesiones_dia` CHECK (`DiaSemana` BETWEEN 1 AND 7),
  CONSTRAINT `chk_ofertasesiones_hora` CHECK (`HoraInicio` >= '00:00:00' AND `HoraFin` <= '23:59:59' AND `HoraFin` > `HoraInicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ofertadocentesunidad` (
  `idAsignacion` INT NOT NULL AUTO_INCREMENT,
  `idUnidadOferta` INT NOT NULL,
  `Orden` INT NOT NULL,
  `NombrePublicado` VARCHAR(180) NULL,
  `Tipo` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`idAsignacion`),
  UNIQUE KEY `uq_ofertadocentesunidad_orden` (`idUnidadOferta`,`Orden`),
  CONSTRAINT `fk_ofertadocentesunidad_unidad`
    FOREIGN KEY (`idUnidadOferta`) REFERENCES `ofertaunidades` (`idUnidadOferta`) ON DELETE RESTRICT,
  CONSTRAINT `chk_ofertadocentesunidad_orden` CHECK (`Orden` >= 1),
  CONSTRAINT `chk_ofertadocentesunidad_tipo` CHECK (
    (`Tipo` = 'VACANTE' AND `NombrePublicado` IS NULL)
    OR
    (`Tipo` = 'DOCENTE' AND `NombrePublicado` IS NOT NULL AND CHAR_LENGTH(TRIM(`NombrePublicado`)) > 0)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- No se crea ninguna cuenta de usuario; no hay FK de docentes publicados a usuarios.
