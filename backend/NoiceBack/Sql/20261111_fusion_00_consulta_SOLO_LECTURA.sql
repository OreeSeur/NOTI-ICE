-- Fusion de modelos academicos, paso 0: SOLO LECTURA. No modifica nada.
-- Ejecutar con la base de trabajo como destino, p. ej.:
--   mysql.exe -u root -p --default-character-set=utf8mb4 portal_noticias_pruebas < este_archivo.sql

SELECT DATABASE() AS base_seleccionada;

-- 1) Valores de plan que existen hoy (se espera '2004' y '2024' en el catalogo).
SELECT 'catalogomateriasplanes' AS tabla, `Plan`, COUNT(*) AS filas
FROM `catalogomateriasplanes` GROUP BY `Plan`
UNION ALL
SELECT 'ofertagrupos', `Plan`, COUNT(*) FROM `ofertagrupos` GROUP BY `Plan`;

-- 2) Colisiones al renombrar plan 2004 -> 2003 en ofertagrupos (debe dar 0).
SELECT COUNT(*) AS colisiones_plan
FROM `ofertagrupos` a
JOIN `ofertagrupos` b
  ON a.`IdPeriodo` = b.`IdPeriodo` AND a.`Programa` = b.`Programa`
 AND a.`CodigoGrupo` = b.`CodigoGrupo` AND a.`Plan` = '2004' AND b.`Plan` = '2003';

-- 3) Modelo antiguo: filas actuales (se espera 0, salvo 1 en grupostipos).
SELECT 'academias' AS tabla, COUNT(*) AS filas FROM `academias`
UNION ALL SELECT 'materias', COUNT(*) FROM `materias`
UNION ALL SELECT 'grupostipos', COUNT(*) FROM `grupostipos`
UNION ALL SELECT 'grupos', COUNT(*) FROM `grupos`
UNION ALL SELECT 'gruposalumnos', COUNT(*) FROM `gruposalumnos`;

-- 4) Publicaciones que todavia usan el campo antiguo "grupos" en la audiencia (se espera 0).
SELECT 'noticias' AS tabla, COUNT(*) AS con_grupos_antiguos FROM `noticias`
 WHERE LOWER(CAST(`Audiencia` AS CHAR)) REGEXP '"grupos" *: *\\[ *[0-9]'
UNION ALL
SELECT 'eventos', COUNT(*) FROM `eventos`
 WHERE LOWER(CAST(`Audiencia` AS CHAR)) REGEXP '"grupos" *: *\\[ *[0-9]'
UNION ALL
SELECT 'noticiasdocumentos', COUNT(*) FROM `noticiasdocumentos`
 WHERE LOWER(CAST(`Audiencia` AS CHAR)) REGEXP '"grupos" *: *\\[ *[0-9]';

-- 5) Estructura actual de las tablas que se tocaran.
SHOW CREATE TABLE `academias`;
SHOW COLUMNS FROM `catalogomateriasplanes`;
