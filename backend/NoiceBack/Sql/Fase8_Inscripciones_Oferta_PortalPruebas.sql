-- Fase 8. Ejecutar SOLO tras respaldar y confirmar la base de pruebas.
-- Esta tabla representa selección voluntaria, no inscripción certificada del IPN.
-- Se conserva intacto gruposalumnos y toda la estructura de producción.
USE `portal_noticias_pruebas`;

CREATE TABLE `ofertainscripcionesalumnos` (
  `idInscripcionOferta` INT NOT NULL AUTO_INCREMENT,
  `idUsuario` INT NOT NULL,
  `idUnidadOferta` INT NOT NULL,
  `FechaAlta` DATETIME(6) NOT NULL,
  `FechaBaja` DATETIME(6) NULL,
  `Activo` BIT(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`idInscripcionOferta`),
  UNIQUE KEY `uq_ofertainscripcionesalumnos_usuario_unidad` (`idUsuario`, `idUnidadOferta`),
  KEY `ix_ofertainscripcionesalumnos_unidad` (`idUnidadOferta`),
  CONSTRAINT `fk_ofertainscripcionesalumnos_usuario`
    FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ofertainscripcionesalumnos_unidad`
    FOREIGN KEY (`idUnidadOferta`) REFERENCES `ofertaunidades` (`idUnidadOferta`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comprobación de existencia, sin insertar ni eliminar registros:
SHOW CREATE TABLE `ofertainscripcionesalumnos`;
