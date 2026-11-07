# Preparación API del frontend

Esta fase deja el frontend listo para cambiar gradualmente de `localStorage` a una API real en ASP.NET Core.

## Variables de entorno

Copia `.env.example` a `.env` cuando quieras probar configuración local:

```env
VITE_DATA_SOURCE=mock
VITE_API_URL=http://localhost:5000/api
VITE_AUTH_TOKEN_KEY=noti_ice_auth_token
```

## Modo actual

El modo activo debe mantenerse en:

```env
VITE_DATA_SOURCE=mock
```

Así el sistema sigue funcionando con `localStorage` mientras el backend no exista.

## Estructura agregada

```text
src/config/appConfig.js
src/api/apiClient.js
src/api/authToken.js
src/api/endpoints.js
src/api/resourceClient.js
src/services/api/
```

## Uso futuro

Cuando exista backend, los servicios podrán cambiar gradualmente de:

```text
storage/localStorage
```

a:

```text
apiClient + endpoints ASP.NET Core
```

sin modificar las pantallas principales.
