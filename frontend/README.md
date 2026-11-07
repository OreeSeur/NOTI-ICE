# Noti ICE | Portal de Comunicación Académica

Frontend desarrollado con React, Vite y Tailwind CSS para centralizar la comunicación académica entre alumnos, docentes, personal administrativo y administradores.

El proyecto permite gestionar avisos, eventos, documentos, notificaciones, perfiles académicos, planes de estudio, grupos, asignaciones docentes y publicaciones dirigidas por materia/grupo/periodo.

## Tecnologías

- React
- Vite
- Tailwind CSS
- React Router
- Context API
- LocalStorage en modo mock
- Preparación para API REST ASP.NET Core + MySQL

## Instalación y ejecución

Los comandos se ejecutan dentro de `frontend/`. La guía completa, que incluye backend
y MySQL, está en [`../docs/pruebas/00-arranque-local.md`](../docs/pruebas/00-arranque-local.md).

```bash
npm ci
npm run dev:ollama   # API real en http://localhost:5135 y asistente visible
npm run dev          # usa frontend/.env; sin él, modo simulado (mock)
```

`dev:ollama` requiere el backend en ejecución con el perfil `ollama-local`.

Para validar antes de subir cambios:

```bash
npm run lint
npm run build
```

## Variables de entorno

Para el modo `dev:ollama` se usa `.env.ollama` (versionado, sin secretos). Para
`npm run dev` copia `.env.example` como `.env` y ajústalo:

```env
VITE_DATA_SOURCE=api        # api = backend real; mock = datos simulados en localStorage
VITE_API_URL=http://localhost:5135/api
VITE_AUTH_TOKEN_KEY=noti_ice_auth_token
# VITE_CHATBOT_ENABLED=true # oculto salvo true explícito, antes de compilar
```

Si falta `VITE_DATA_SOURCE`, la aplicación cae en `mock`. Vite incorpora estas
variables al compilar: reinícialo al cambiarlas.

## Usuarios de demostración

Los usuarios iniciales son ficticios y no contienen
contraseñas.

El inicio de sesión utiliza la API del backend.
Para probarlo, se deben crear cuentas de prueba
en una base de datos local.

No utilizar credenciales reales en datos simulados.
## Rutas principales

| Ruta | Descripción |
|---|---|
| `/` | Inicio personalizado por rol |
| `/login` | Inicio de sesión |
| `/perfil` | Perfil personal y académico |
| `/avisos` | Avisos públicos y dirigidos |
| `/eventos` | Eventos |
| `/calendario` | Calendario de eventos |
| `/documentos` | Documentos |
| `/notificaciones` | Centro de notificaciones |
| `/docente/publicaciones` | Publicaciones docentes |
| `/admin` | Dashboard administrativo |
| `/admin/academico` | Gestión académica |

## Documentación

La documentación técnica se encuentra en `../docs/`:

- `../docs/README.md`
- `../docs/frontend/01-arquitectura.md`
- `../docs/frontend/02-roles-y-permisos.md`
- `../docs/frontend/03-flujos-de-uso.md`
- `../docs/frontend/04-flujo-academico.md`
- `../docs/pruebas/01-checklist-pruebas-frontend.md`
- `../docs/frontend/05-preparacion-api.md`
- `../docs/frontend/06-errores-carga-y-permisos.md`
- `../docs/frontend/07-identidad-grafica-ipn.md`

## Identidad gráfica

El frontend incluye una aplicación mínima y segura de criterios visuales del IPN:

- Tipografía base: Noto Sans.
- Guinda institucional como acento principal.
- Variables CSS para colores institucionales.
- Sin modificaciones estructurales al layout, sidebar o topbar.

Consulta `../docs/frontend/07-identidad-grafica-ipn.md` para más detalles.

## Estado actual

El frontend consume la API ASP.NET Core + MySQL con `VITE_DATA_SOURCE=api`. El modo `mock` (`localStorage`) se conserva solo como alternativa de desarrollo sin backend.
