-- CONSULTA SOLO LECTURA: destino exclusivo portal_noticias_pruebas.
-- No hace INSERT, UPDATE, DELETE ni ALTER.
USE `portal_noticias_pruebas`;
SELECT DATABASE() AS base_seleccionada;
SELECT p.idPeriodo,p.Clave,p.Activo FROM `ofertaperiodos` p WHERE p.Clave='2027-1';
SELECT p.Clave,g.Plan,g.CodigoGrupo,g.idGrupoOferta,COUNT(DISTINCT u.idUnidadOferta) AS Unidades,
 COUNT(DISTINCT a.idInscripcionOferta) AS Suscripciones
FROM `ofertagrupos` g
JOIN `ofertaperiodos` p ON p.idPeriodo=g.idPeriodo
LEFT JOIN `ofertaunidades` u ON u.idGrupoOferta=g.idGrupoOferta
LEFT JOIN `ofertainscripcionesalumnos` a ON a.idUnidadOferta=u.idUnidadOferta
WHERE p.Clave='2027-1' AND g.Programa='Ingeniería en Comunicaciones y Electrónica'
GROUP BY p.Clave,g.Plan,g.CodigoGrupo,g.idGrupoOferta
ORDER BY g.Plan,g.CodigoGrupo;
SELECT p.Clave,g.CodigoGrupo,g.Plan,g.idGrupoOferta,u.idUnidadOferta,u.OrdenFuente,u.NombrePublicado,
 (SELECT COUNT(*) FROM ofertainscripcionesalumnos a WHERE a.idUnidadOferta=u.idUnidadOferta) AS Suscripciones
FROM ofertagrupos g JOIN ofertaperiodos p ON p.idPeriodo=g.idPeriodo
JOIN ofertaunidades u ON u.idGrupoOferta=g.idGrupoOferta
WHERE p.Clave='2027-1' AND g.Plan='2024' AND g.CodigoGrupo IN ('1CM10','1CM13')
ORDER BY g.CodigoGrupo,u.OrdenFuente;
SELECT Plan,Semestre,COUNT(*) AS FilasCatalogo FROM catalogomateriasplanes
WHERE Programa='Ingeniería en Comunicaciones y Electrónica'
GROUP BY Plan,Semestre ORDER BY Plan,Semestre;
