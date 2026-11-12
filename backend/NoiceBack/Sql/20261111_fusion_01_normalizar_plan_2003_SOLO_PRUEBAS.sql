-- Fusion de modelos academicos, paso 1: el plan antiguo de ICE queda como '2003' (como el mapa curricular).
-- Cambia solo la columna `Plan` ('2004' -> '2003') en catalogomateriasplanes y ofertagrupos.
-- No toca `IdOrigen` (identificador de procedencia) ni ninguna otra columna.
-- Requisitos: respaldo previo y el resultado "colisiones_plan = 0" del paso 0.
-- Ejecutar con la base de trabajo como destino:
--   mysql.exe -u root -p --default-character-set=utf8mb4 portal_noticias_pruebas < este_archivo.sql
-- Si una sentencia falla, el cliente se detiene y la transaccion se revierte al cerrar la sesion.

SELECT DATABASE() AS base_seleccionada;

START TRANSACTION;

UPDATE `catalogomateriasplanes` SET `Plan` = '2003' WHERE `Plan` = '2004';
UPDATE `ofertagrupos`           SET `Plan` = '2003' WHERE `Plan` = '2004';

COMMIT;

-- Comprobacion: ya no debe aparecer '2004'.
SELECT 'catalogomateriasplanes' AS tabla, `Plan`, COUNT(*) AS filas
FROM `catalogomateriasplanes` GROUP BY `Plan`
UNION ALL
SELECT 'ofertagrupos', `Plan`, COUNT(*) FROM `ofertagrupos` GROUP BY `Plan`;

-- Para revertir (solo si se necesita): cambiar '2003' por '2004' en las mismas dos tablas.
-- Ojo: revertiria tambien filas que ya fueran '2003' antes de este script, por eso hay que
-- ejecutar antes el paso 0 y conservar su resultado.
