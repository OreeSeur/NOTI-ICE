-- Fusion de modelos academicos, paso 3 (ULTIMO): retira las 4 tablas del modelo antiguo.
--   gruposalumnos, grupos, materias, grupostipos  (en ese orden por las llaves foraneas).
-- NO toca `academias` (se reutiliza como opcion de optativas) ni ninguna tabla de la oferta.
-- Resultado esperado: 19 tablas (23 - 4).
--
-- Requisitos:
--   * Pasos 01 y 02 ya ejecutados y el codigo nuevo (API y frontend) probado.
--   * Respaldo NUEVO justo antes (mysqldump --single-transaction). DROP TABLE no se puede deshacer:
--     la unica forma de volver atras es restaurar ese respaldo.
-- Ejecutar con la base de trabajo como destino:
--   mysql.exe -u root -p --default-character-set=utf8mb4 portal_noticias_pruebas < este_archivo.sql
--
-- Comprobaciones de seguridad: si alguna falla, el cliente muestra el error
-- "Subquery returns more than 1 row" (ERROR 1242) y se detiene ANTES de borrar nada.

SELECT DATABASE() AS base_seleccionada;

-- 1) Estado actual (se espera 0, 0, 0 y 1 = el tipo '1CV1', cuyo retiro decidio el usuario).
SELECT 'gruposalumnos' AS tabla, COUNT(*) AS filas FROM `gruposalumnos`
UNION ALL SELECT 'grupos', COUNT(*) FROM `grupos`
UNION ALL SELECT 'materias', COUNT(*) FROM `materias`
UNION ALL SELECT 'grupostipos', COUNT(*) FROM `grupostipos`;
SELECT `idGrupoTipo`, `GrupoTipo` FROM `grupostipos`;

-- 2) Ninguna tabla FUERA de las cuatro debe tener llaves foraneas hacia ellas (se espera vacio).
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IN ('gruposalumnos', 'grupos', 'materias', 'grupostipos')
  AND TABLE_NAME NOT IN ('gruposalumnos', 'grupos', 'materias', 'grupostipos');

-- 3) Guardas: detienen el script si hay datos inesperados o referencias externas.
--    Cada una devuelve 'ok'. Si la condicion de ALTO se cumple, la subconsulta devuelve dos filas
--    y MySQL corta con ERROR 1242 antes de llegar a los DROP.
SELECT IF(c.n = 0, 'ok', (SELECT 'ALTO' FROM (SELECT 1 AS k UNION ALL SELECT 2) t WHERE c.n > 0)) AS guarda_gruposalumnos
FROM (SELECT COUNT(*) AS n FROM `gruposalumnos`) c;
SELECT IF(c.n = 0, 'ok', (SELECT 'ALTO' FROM (SELECT 1 AS k UNION ALL SELECT 2) t WHERE c.n > 0)) AS guarda_grupos
FROM (SELECT COUNT(*) AS n FROM `grupos`) c;
SELECT IF(c.n = 0, 'ok', (SELECT 'ALTO' FROM (SELECT 1 AS k UNION ALL SELECT 2) t WHERE c.n > 0)) AS guarda_materias
FROM (SELECT COUNT(*) AS n FROM `materias`) c;
SELECT IF(c.n <= 1, 'ok', (SELECT 'ALTO' FROM (SELECT 1 AS k UNION ALL SELECT 2) t WHERE c.n > 1)) AS guarda_grupostipos
FROM (SELECT COUNT(*) AS n FROM `grupostipos`) c;
SELECT IF(c.n = 0, 'ok', (SELECT 'ALTO' FROM (SELECT 1 AS k UNION ALL SELECT 2) t WHERE c.n > 0)) AS guarda_referencias
FROM (SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IN ('gruposalumnos', 'grupos', 'materias', 'grupostipos')
        AND TABLE_NAME NOT IN ('gruposalumnos', 'grupos', 'materias', 'grupostipos')) c;
SELECT IF(c.n = 1, 'ok', (SELECT 'ALTO' FROM (SELECT 1 AS k UNION ALL SELECT 2) t WHERE c.n <> 1)) AS guarda_paso_02
FROM (SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'catalogomateriasplanes'
        AND COLUMN_NAME = 'idAcademia') c;

-- 4) Retiro (DDL: cada DROP se confirma solo; no hay transaccion posible).
DROP TABLE IF EXISTS `gruposalumnos`;
DROP TABLE IF EXISTS `grupos`;
DROP TABLE IF EXISTS `materias`;
DROP TABLE IF EXISTS `grupostipos`;

-- 5) Comprobacion: 19 tablas y `academias` conservada con sus 5 filas.
SELECT COUNT(*) AS total_tablas
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE';
SELECT TABLE_NAME AS tablas_restantes
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
SELECT COUNT(*) AS academias FROM `academias`;

-- Para revertir: restaurar el respaldo tomado justo antes de este script.
