# Pendientes para backend

Este documento resume lo que el backend deberá implementar para reemplazar la persistencia local del frontend.

## Stack propuesto

- ASP.NET Core Web API
- Entity Framework Core
- MySQL
- JWT
- BCrypt o PasswordHasher para contraseñas
- CORS habilitado para Vite en desarrollo

## Módulos backend necesarios

### Autenticación

- Login real.
- JWT.
- Endpoint `/api/auth/me`.
- Validación de roles.

### Usuarios

- CRUD de usuarios.
- Hash de contraseña.
- Roles.
- Estado activo/inactivo.

### Académico

- Planes de estudio.
- Materias.
- Grupos.
- Asignaciones docentes.
- Suscripciones académicas de alumnos.

### Publicaciones

- Avisos.
- Eventos.
- Documentos.
- Publicaciones docentes.
- Metadatos académicos.
- Prioridad y destinatarios.

### Archivos

- Subida real de documentos.
- Guardado de ruta, tamaño y tipo.
- Descarga segura.

### Notificaciones

- Generación de notificaciones por publicación.
- Estado leída/no leída.
- Filtros por usuario.
- Actualización cuando una publicación cambia o se elimina.

## Endpoints clave

- `/api/auth/login`
- `/api/auth/me`
- `/api/usuarios`
- `/api/planes-estudio`
- `/api/materias`
- `/api/grupos`
- `/api/asignaciones-docentes`
- `/api/alumnos/{id}/suscripciones`
- `/api/avisos`
- `/api/eventos`
- `/api/documentos`
- `/api/publicaciones/para-mi`
- `/api/docente/publicaciones`
- `/api/notificaciones`
- `/api/archivos/upload`

## Reglas críticas

- El backend no debe confiar en permisos del frontend.
- El docente sólo puede publicar para asignaciones activas propias.
- El alumno sólo recibe publicaciones que coinciden con sus suscripciones académicas.
- El admin puede gestionar todo.
- La eliminación debería ser lógica en módulos críticos para preservar historial.
