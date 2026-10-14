-- NOTI ICE | Fase A.5.5.1.2 | Version persistente de sesion
-- APLICAR EXCLUSIVAMENTE EN portal_noticias_pruebas (MySQL 8+).
-- NO crea/elimina tablas, NO desactiva usuarios, NO modifica portal_noticias.
-- PREVIO: crear copia de seguridad de portal_noticias_pruebas.
-- Compatible con reejecucion: si la columna ya existe, no se altera de nuevo.
-- MySQL realiza COMMIT implicito en operaciones ALTER TABLE: no es rollback transaccional.

USE `portal_noticias_pruebas`;

-- Verificacion informativa: debe mostrar portal_noticias_pruebas.
SELECT DATABASE() AS base_seleccionada;

SET @version_sesion_existe := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'portal_noticias_pruebas'
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'VersionSesion'
);

SET @sentencia_version := IF(
  @version_sesion_existe = 0,
  'ALTER TABLE `portal_noticias_pruebas`.`Usuarios` ADD COLUMN `VersionSesion` INT NOT NULL DEFAULT 1',
  'SELECT ''La columna VersionSesion ya existia; no se realizaron cambios.'' AS mensaje'
);

PREPARE migracion_version FROM @sentencia_version;
EXECUTE migracion_version;
DEALLOCATE PREPARE migracion_version;

-- Verifica que sea INT, NOT NULL y DEFAULT 1 antes de aplicar el parche C#.
SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'portal_noticias_pruebas'
  AND TABLE_NAME = 'usuarios'
  AND COLUMN_NAME = 'VersionSesion';

-- Solo lectura: cuenta los registros que quedaron con la version inicial 1.
SELECT COUNT(*) AS total_usuarios,
       MIN(VersionSesion) AS version_minima,
       MAX(VersionSesion) AS version_maxima
FROM `portal_noticias_pruebas`.`Usuarios`;
