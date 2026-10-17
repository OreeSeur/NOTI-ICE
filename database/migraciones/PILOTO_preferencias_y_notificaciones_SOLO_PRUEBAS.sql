-- PROPUESTA PARA REVISIÓN. NO EJECUTAR SIN AUTORIZACIÓN.
-- ÚNICAMENTE portal_noticias_pruebas. No tocar portal_noticias.
-- Verificar primero SHOW CREATE TABLE usuarios y el tipo exacto de idUsuario.
-- Si la columna idUsuario de usuarios difiere del tipo INT, adaptar FK antes de aplicar.
USE portal_noticias_pruebas;

CREATE TABLE IF NOT EXISTS usuariospreferencias (
  idUsuario INT NOT NULL,
  DatosJson JSON NOT NULL,
  PRIMARY KEY (idUsuario),
  CONSTRAINT fk_piloto_preferencias_usuario FOREIGN KEY (idUsuario)
    REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificacionesleidas (
  idUsuario INT NOT NULL,
  Clave VARCHAR(100) NOT NULL,
  FechaLectura DATETIME NOT NULL,
  PRIMARY KEY (idUsuario, Clave),
  CONSTRAINT fk_piloto_notificaciones_usuario FOREIGN KEY (idUsuario)
    REFERENCES usuarios(idUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NO hay INSERT de cuentas ni contraseñas de ejemplo.
