-- Fusion de modelos academicos, paso 2: academias = opciones de optativas (plan 2003 de ICE).
--  * Agrega catalogomateriasplanes.idAcademia (acepta vacio) con llave foranea a `academias`.
--  * Crea 5 academias en la tabla `academias` (reutiliza la existente) si no existen.
--  * Asigna academia y Tipo='Optativa' a 80 filas del catalogo (40 optativas: teoria + laboratorio).
-- No elimina nada. Requiere haber ejecutado el paso 1 (plan '2003') y tener respaldo previo.
-- Ejecutar con la base de trabajo como destino:
--   mysql.exe -u root -p --default-character-set=utf8mb4 portal_noticias_pruebas < este_archivo.sql
-- No es idempotente en el ALTER: si la columna ya existe, el ALTER falla y el script se detiene.

SELECT DATABASE() AS base_seleccionada;

ALTER TABLE `catalogomateriasplanes`
  ADD COLUMN `idAcademia` INT NULL,
  ADD KEY `ix_catalogomateriasplanes_academia` (`idAcademia`),
  ADD CONSTRAINT `fk_catalogomateriasplanes_academia`
    FOREIGN KEY (`idAcademia`) REFERENCES `academias` (`idAcademia`) ON DELETE RESTRICT;

INSERT INTO `academias` (`Nombre`, `Descripcion`, `FechaAlta`, `Activo`)
SELECT t.n, t.d, NOW(), 1
FROM (
  SELECT 'Acústica' AS n, 'Opción de optativas de Acústica de Ingeniería en Comunicaciones y Electrónica' AS d
  UNION ALL SELECT 'Computación', 'Opción de optativas de Computación de Ingeniería en Comunicaciones y Electrónica'
  UNION ALL SELECT 'Electrónica', 'Opción de optativas de Electrónica de Ingeniería en Comunicaciones y Electrónica'
  UNION ALL SELECT 'Comunicaciones', 'Opción de optativas de Comunicaciones de Ingeniería en Comunicaciones y Electrónica'
  UNION ALL SELECT 'Control', 'Opción de optativas de Control (Cibernética en Zacatenco, plan 2024) de Ingeniería en Comunicaciones y Electrónica'
) t
WHERE NOT EXISTS (SELECT 1 FROM `academias` a WHERE a.`Nombre` COLLATE utf8mb4_unicode_ci = t.n COLLATE utf8mb4_unicode_ci);

START TRANSACTION;

CREATE TEMPORARY TABLE `tmp_academia_optativa` (
  `Academia` VARCHAR(80)  NOT NULL,
  `Semestre` INT          NOT NULL,
  `Nombre`   VARCHAR(180) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tmp_academia_optativa` (`Academia`, `Semestre`, `Nombre`) VALUES
  ('Acústica', 8, 'Arquitectural'),
  ('Acústica', 8, 'Laboratorio de Arquitectural'),
  ('Acústica', 8, 'Grabación'),
  ('Acústica', 8, 'Laboratorio de Grabación'),
  ('Acústica', 8, 'Metrología Acústica'),
  ('Acústica', 8, 'Laboratorio de Metrología Acústica'),
  ('Acústica', 8, 'Psicoacústica'),
  ('Acústica', 8, 'Laboratorio de Psicoacústica'),
  ('Acústica', 9, 'Acústica Musical'),
  ('Acústica', 9, 'Laboratorio de Acústica Musical'),
  ('Acústica', 9, 'Bioacústica'),
  ('Acústica', 9, 'Laboratorio de Bioacústica'),
  ('Acústica', 9, 'Reconocimiento y Síntesis de Voz'),
  ('Acústica', 9, 'Laboratorio de Reconocimiento y Síntesis de Voz'),
  ('Acústica', 9, 'Ruido y Vibraciones'),
  ('Acústica', 9, 'Laboratorio de Ruido y Vibraciones'),
  ('Computación', 8, 'Arquitectura de Computadoras'),
  ('Computación', 8, 'Laboratorio de Arquitectura de Computadoras'),
  ('Computación', 8, 'Ingeniería de Software'),
  ('Computación', 8, 'Laboratorio de Ingeniería de Software'),
  ('Computación', 8, 'Lenguajes de Internet'),
  ('Computación', 8, 'Laboratorio de Lenguajes de Internet'),
  ('Computación', 8, 'Redes Lan'),
  ('Computación', 8, 'Laboratorio de Redes Lan'),
  ('Computación', 9, 'Aplicación de Redes de Computadora'),
  ('Computación', 9, 'Laboratorio de Aplicación de Redes de Computadora'),
  ('Computación', 9, 'Agentes Inteligentes Expertos'),
  ('Computación', 9, 'Laboratorio de Agentes Inteligentes Expertos'),
  ('Computación', 9, 'Sistemas en Tiempo Real'),
  ('Computación', 9, 'Laboratorio de Sistemas en Tiempo Real'),
  ('Computación', 9, 'Visión por Computadora'),
  ('Computación', 9, 'Laboratorio de Visión por Computadora'),
  ('Electrónica', 8, 'Instrumentación II'),
  ('Electrónica', 8, 'Laboratorio de Instrumentación II'),
  ('Electrónica', 8, 'Instrumentación I'),
  ('Electrónica', 8, 'Laboratorio de Instrumentación I'),
  ('Electrónica', 8, 'Electrónica de Potencia I'),
  ('Electrónica', 8, 'Laboratorio de Electrónica de Potencia I'),
  ('Electrónica', 8, 'Transmisores'),
  ('Electrónica', 8, 'Laboratorio de Transmisores'),
  ('Electrónica', 9, 'Electrónica de Potencia II'),
  ('Electrónica', 9, 'Laboratorio de Electrónica de Potencia II'),
  ('Electrónica', 9, 'Instrumentación III'),
  ('Electrónica', 9, 'Laboratorio de Instrumentación III'),
  ('Electrónica', 9, 'Receptores'),
  ('Electrónica', 9, 'Laboratorio de Receptores'),
  ('Electrónica', 9, 'Televisión y Video'),
  ('Electrónica', 9, 'Laboratorio de Televisión y Video'),
  ('Comunicaciones', 8, 'Electrónica Analógica de Comunicaciones'),
  ('Comunicaciones', 8, 'Laboratorio de Electrónica Analógica de Comunicaciones'),
  ('Comunicaciones', 8, 'Comunicaciones por Medio de Fibra Óptica'),
  ('Comunicaciones', 8, 'Laboratorio de Comunicaciones por Medio de Fibra Óptica'),
  ('Comunicaciones', 8, 'Redes de Área Amplia'),
  ('Comunicaciones', 8, 'Laboratorio de Redes de Área Amplia'),
  ('Comunicaciones', 8, 'Teoría de Codificación y Manejo de Información'),
  ('Comunicaciones', 8, 'Laboratorio de Teoría de Codificación y Manejo de Información'),
  ('Comunicaciones', 9, 'Diseño y Administración de Redes'),
  ('Comunicaciones', 9, 'Laboratorio de Diseño y Administración de Redes'),
  ('Comunicaciones', 9, 'Redes Convergentes'),
  ('Comunicaciones', 9, 'Laboratorio de Redes Convergentes'),
  ('Comunicaciones', 9, 'Sincronización y Multiplexaje'),
  ('Comunicaciones', 9, 'Laboratorio de Sincronización y Multiplexaje'),
  ('Comunicaciones', 9, 'Sistemas de Radiocomunicación'),
  ('Comunicaciones', 9, 'Laboratorio de Sistemas de Radiocomunicación'),
  ('Control', 8, 'Control Analógico: Servomecanismos'),
  ('Control', 8, 'Laboratorio de Control Analógico: Servomecanismos'),
  ('Control', 8, 'Control con Uso de PLC'),
  ('Control', 8, 'Laboratorio de Control con Uso de PLC'),
  ('Control', 8, 'Control Digital'),
  ('Control', 8, 'Laboratorio de Control Digital'),
  ('Control', 8, 'Instrumentación de Procesos'),
  ('Control', 8, 'Laboratorio de Instrumentación de Procesos'),
  ('Control', 9, 'Control Distribuido'),
  ('Control', 9, 'Laboratorio de Control Distribuido'),
  ('Control', 9, 'Control Inteligente'),
  ('Control', 9, 'Laboratorio de Control Inteligente'),
  ('Control', 9, 'Sistemas No Lineales'),
  ('Control', 9, 'Laboratorio de Sistemas No Lineales'),
  ('Control', 9, 'Sistemas de Adquisición de Datos'),
  ('Control', 9, 'Laboratorio de Sistemas de Adquisición de Datos');

-- Verificacion previa (deben ser 80 filas en total y 0 sin pareja):
SELECT COUNT(*) AS filas_en_mapa FROM `tmp_academia_optativa`;
SELECT t.`Academia`, t.`Semestre`, t.`Nombre` AS sin_pareja_en_catalogo
FROM `tmp_academia_optativa` t
LEFT JOIN `catalogomateriasplanes` c
  ON c.`Plan` = '2003' AND c.`Programa` = 'Ingeniería en Comunicaciones y Electrónica'
 AND c.`Semestre` = t.`Semestre` AND c.`Nombre` = t.`Nombre`
WHERE c.`idMateriaCatalogo` IS NULL;

UPDATE `catalogomateriasplanes` c
JOIN `tmp_academia_optativa` t
  ON c.`Plan` = '2003' AND c.`Programa` = 'Ingeniería en Comunicaciones y Electrónica'
 AND c.`Semestre` = t.`Semestre` AND c.`Nombre` = t.`Nombre`
JOIN `academias` a
  ON a.`Nombre` COLLATE utf8mb4_unicode_ci = t.`Academia` COLLATE utf8mb4_unicode_ci
SET c.`idAcademia` = a.`idAcademia`, c.`Tipo` = 'Optativa';

COMMIT;

DROP TEMPORARY TABLE `tmp_academia_optativa`;

-- Resultado esperado: 5 academias con 16 filas cada una (8 optativas x teoria y laboratorio) = 80.
SELECT a.`idAcademia`, a.`Nombre`, COUNT(c.`idMateriaCatalogo`) AS filas_catalogo
FROM `academias` a
LEFT JOIN `catalogomateriasplanes` c ON c.`idAcademia` = a.`idAcademia`
GROUP BY a.`idAcademia`, a.`Nombre` ORDER BY a.`idAcademia`;
SELECT COUNT(*) AS total_con_academia FROM `catalogomateriasplanes` WHERE `idAcademia` IS NOT NULL;

-- Para revertir este paso (la columna acepta vacio, nada mas depende de ella todavia):
--   UPDATE `catalogomateriasplanes` SET `idAcademia` = NULL, `Tipo` = NULL WHERE `idAcademia` IS NOT NULL;
-- y, si tambien se quiere quitar la columna:
--   ALTER TABLE `catalogomateriasplanes` DROP FOREIGN KEY `fk_catalogomateriasplanes_academia`,
--     DROP KEY `ix_catalogomateriasplanes_academia`, DROP COLUMN `idAcademia`;
