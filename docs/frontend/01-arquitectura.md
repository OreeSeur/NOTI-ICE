# Arquitectura frontend

## Descripción general

El frontend está construido con React, Vite, Tailwind CSS, React Router y Context API.

La aplicación sigue una arquitectura por capas para evitar que los componentes dependan directamente de `localStorage` o de datos mock.

```text
Páginas / Componentes
        ↓
Context
        ↓
Services
        ↓
Storage / API futura
```

## Estructura principal

```text
src/
├── api/
├── components/
├── config/
├── constants/
├── context/
├── data/
├── pages/
├── routes/
├── services/
├── storage/
└── utils/
```

## Carpetas relevantes

### `src/api/`

Preparación para consumo de backend REST.

Incluye:

- `apiClient.js`
- `apiError.js`
- `authToken.js`
- `endpoints.js`
- `resourceClient.js`

Esta capa será utilizada cuando `VITE_DATA_SOURCE=api`.

### `src/config/`

Centraliza configuración global del frontend.

Archivo principal:

```text
src/config/appConfig.js
```

Variables contempladas:

- `VITE_DATA_SOURCE`
- `VITE_API_URL`
- `VITE_AUTH_TOKEN_KEY`

### `src/constants/`

Contiene valores compartidos y constantes del sistema:

- Rutas
- Roles
- Planes de estudio
- Destinatarios
- Suscripciones
- Experiencia por rol

### `src/context/`

Manejo de estado global por dominio:

- Auth
- Usuarios
- Avisos
- Eventos
- Documentos
- Académico
- Toasts

Los contextos deben mantener estado y delegar lógica de persistencia a `services`.

### `src/services/`

Capa de operaciones del dominio.

Ejemplos:

- `authService.js`
- `avisosService.js`
- `eventosService.js`
- `documentosService.js`
- `academicoService.js`

También existe `src/services/api/` para la futura conexión a backend.

### `src/storage/`

Persistencia temporal en `localStorage` mientras no exista backend.

Cuando exista API real, esta capa podrá dejar de ser la fuente principal de datos.

### `src/utils/`

Funciones reutilizables:

- Fechas
- Validaciones
- Búsquedas
- Permisos
- Recomendaciones
- Notificaciones
- Lógica académica

## Reglas de mantenimiento

1. Los componentes no deben leer ni escribir directamente en `localStorage`.
2. Las rutas deben centralizarse en `src/constants/routes.js`.
3. Los roles deben centralizarse en `src/constants/roles.js`.
4. La lógica académica debe mantenerse en `utils`, `services` o `context`, no dentro de componentes visuales grandes.
5. Las futuras llamadas HTTP deben pasar por `src/api/` o `src/services/api/`.
