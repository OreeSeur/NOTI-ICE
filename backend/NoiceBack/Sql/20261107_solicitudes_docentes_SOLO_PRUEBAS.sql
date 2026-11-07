-- Solicitudes de Docentes para impartir materias/laboratorios de los horarios (oferta).
-- Ejecutar SOLO tras confirmar el servidor y la base de destino, y con respaldo previo.
-- Agrega una tabla nueva; no modifica ni elimina datos ni tablas existentes.
-- Requiere las tablas `usuarios` y `ofertaunidades` (modulo de oferta ya instalado).
-- No usar en `portal_noticias` (base original).

CREATE TABLE IF NOT EXISTS `ofertasolicitudesdocentes` (
  `idSolicitud` INT NOT NULL AUTO_INCREMENT,
  `idUsuario` INT NOT NULL,
  `idUnidadOferta` INT NOT NULL,
  `Estado` VARCHAR(12) NOT NULL,
  `FechaSolicitud` DATETIME(6) NOT NULL,
  `idAdministrador` INT NULL,
  `FechaResolucion` DATETIME(6) NULL,
  `Motivo` VARCHAR(300) NULL,
  -- Una sola aprobada por unidad y una sola vigente (pendiente o aprobada) por docente y unidad.
  -- Los NULL no chocan en indices UNIQUE de MySQL.
  `idUnidadAprobada` INT GENERATED ALWAYS AS (CASE WHEN `Estado` = 'Aprobada' THEN `idUnidadOferta` END) STORED,
  `idUnidadVigente` INT GENERATED ALWAYS AS (CASE WHEN `Estado` IN ('Pendiente', 'Aprobada') THEN `idUnidadOferta` END) STORED,
  PRIMARY KEY (`idSolicitud`),
  UNIQUE KEY `uq_ofertasolicitudesdocentes_unidad_aprobada` (`idUnidadAprobada`),
  UNIQUE KEY `uq_ofertasolicitudesdocentes_docente_vigente` (`idUsuario`, `idUnidadVigente`),
  KEY `ix_ofertasolicitudesdocentes_estado` (`Estado`, `FechaSolicitud`),
  KEY `ix_ofertasolicitudesdocentes_unidad` (`idUnidadOferta`),
  KEY `ix_ofertasolicitudesdocentes_admin` (`idAdministrador`),
  CONSTRAINT `ck_ofertasolicitudesdocentes_estado`
    CHECK (`Estado` IN ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada', 'Revocada')),
  CONSTRAINT `fk_ofertasolicitudesdocentes_docente`
    FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ofertasolicitudesdocentes_admin`
    FOREIGN KEY (`idAdministrador`) REFERENCES `usuarios` (`idUsuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ofertasolicitudesdocentes_unidad`
    FOREIGN KEY (`idUnidadOferta`) REFERENCES `ofertaunidades` (`idUnidadOferta`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comprobacion, sin insertar ni eliminar registros:
SHOW CREATE TABLE `ofertasolicitudesdocentes`;
SELECT COUNT(*) AS solicitudes FROM `ofertasolicitudesdocentes`;
