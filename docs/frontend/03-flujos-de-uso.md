# Flujos principales del frontend

## Flujo visitante

1. Entra al portal.
2. Consulta avisos, eventos, documentos y calendario públicos.
3. Puede iniciar sesión desde `/login`.

## Flujo alumno

1. Inicia sesión.
2. Entra a `/perfil`.
3. Configura datos personales.
4. Agrega suscripciones académicas por materia:
   - Plan de estudios.
   - Materia.
   - Grupo.
   - Periodo.
5. Consulta inicio personalizado.
6. Recibe notificaciones relacionadas con sus materias.
7. Consulta avisos, eventos y documentos dirigidos.
8. Puede marcar notificaciones como leídas o no leídas.

## Flujo docente

1. Inicia sesión.
2. Entra a `/perfil`.
3. Consulta o registra materias/grupos que imparte.
4. Entra a `/docente/publicaciones`.
5. Crea avisos, eventos o documentos para sus asignaciones.
6. Edita o elimina sus propias publicaciones.
7. Los alumnos suscritos a esa materia/grupo reciben la actualización.

## Flujo administrador

1. Inicia sesión.
2. Entra a `/admin`.
3. Consulta métricas generales.
4. Gestiona usuarios, avisos, eventos y documentos.
5. Entra a `/admin/academico`.
6. Consulta materias por plan.
7. Gestiona grupos.
8. Gestiona asignaciones docente-materia-grupo.
9. Revisa consistencia del flujo académico.

## Flujo de publicaciones docentes

```text
Admin o docente asigna materia/grupo
        ↓
Docente publica aviso/evento/documento
        ↓
La publicación guarda metadatos académicos
        ↓
Alumno suscrito a esa materia/grupo la recibe
        ↓
Docente edita o elimina
        ↓
Alumno ve los cambios reflejados
```

## Flujo de notificaciones

1. El sistema genera una lista de publicaciones relevantes.
2. Se filtra por destinatarios, rol y suscripciones académicas.
3. La campana muestra pendientes.
4. `/notificaciones` permite revisar historial, filtros y estado leído/no leído.
