# Documentación de Noti ICE

Toda la documentación técnica del proyecto está reunida aquí, agrupada por área y
numerada en el orden de lectura recomendado.

## Frontend (`frontend/`)

| Documento | Contenido |
|---|---|
| [01-arquitectura.md](frontend/01-arquitectura.md) | Estructura del proyecto, capas, carpetas y flujo de datos actual. |
| [02-roles-y-permisos.md](frontend/02-roles-y-permisos.md) | Roles del sistema, rutas permitidas y permisos esperados. |
| [03-flujos-de-uso.md](frontend/03-flujos-de-uso.md) | Flujos principales: admin, docente, alumno y visitante. |
| [04-flujo-academico.md](frontend/04-flujo-academico.md) | Lógica académica: planes, materias, grupos, asignaciones y suscripciones. |
| [05-preparacion-api.md](frontend/05-preparacion-api.md) | Preparación para conectar el frontend con la API REST. |
| [06-errores-carga-y-permisos.md](frontend/06-errores-carga-y-permisos.md) | Páginas de error, estados de carga y manejo de errores. |
| [07-identidad-grafica-ipn.md](frontend/07-identidad-grafica-ipn.md) | Criterios visuales basados en el manual de identidad gráfica del IPN. |

## Backend (`backend/`)

| Documento | Contenido |
|---|---|
| [01-pendientes-backend.md](backend/01-pendientes-backend.md) | Lo que el backend debe implementar para reemplazar la persistencia local. |
| [02-limites-chatbot.md](backend/02-limites-chatbot.md) | Límites de frecuencia y concurrencia de `POST /api/chatbot`. |

## Despliegue (`deploy/`)

| Documento | Contenido |
|---|---|
| [01-respaldos-y-recuperacion.md](despliegue/01-respaldos-y-recuperacion.md) | Persistencia, respaldos y recuperación (planificación). |

La guía operativa del servidor está en [`deploy/production/README.md`](../deploy/production/README.md).

## Desarrollo

| Documento | Contenido |
|---|---|
| [01-prompt-inicial-claude-code.md](desarrollo/01-prompt-inicial-claude-code.md) | Prompt y reglas para iniciar una sesión de Claude Code en local. |

## Pruebas

| Documento | Contenido |
|---|---|
| [00-arranque-local.md](pruebas/00-arranque-local.md) | Cómo ejecutar frontend, backend y MySQL en local, con problemas frecuentes. |
| [01-checklist-pruebas-frontend.md](pruebas/01-checklist-pruebas-frontend.md) | Pruebas manuales del frontend antes de integrar backend. |
| [02-pruebas-locales-ollama.md](pruebas/02-pruebas-locales-ollama.md) | Cómo probar el asistente con Ollama en local. |
| [03-instalacion-en-otro-equipo.md](pruebas/03-instalacion-en-otro-equipo.md) | Instalación completa en otro equipo: programas, base limpia de entrega, configuración y verificación. |

## Otros README

- [README principal](../README.md)
- [README del frontend](../frontend/README.md)
