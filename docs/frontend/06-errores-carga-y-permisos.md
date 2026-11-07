# Fase 2.19 — Páginas de error, loading y permisos

Esta fase prepara el frontend para convivir con respuestas reales del backend cuando se conecte ASP.NET Core.

## Nuevos elementos

- `/no-autorizado`: pantalla para permisos insuficientes.
- Ruta comodín `*`: mantiene la pantalla 404.
- `ErrorBoundary`: evita pantalla blanca ante errores inesperados de React.
- `LoadingSpinner` y `LoadingPage`: componentes reutilizables para cargas futuras de API.
- `ErrorState`: componente visual común para páginas de error.
- `RoleRoute`: protección por roles para rutas específicas.
- `errorMessages.js`: mensajes amigables para errores HTTP.

## Errores preparados

| Código | Uso esperado |
| ------ | ------------ |
| 401 | Sesión no iniciada o token expirado |
| 403 | Usuario autenticado sin permisos |
| 404 | Recurso o ruta no encontrada |
| 500 | Error interno del servidor |
| Network Error | Backend apagado o conexión fallida |

## Rutas protegidas

- `AdminRoute` redirige a `/no-autorizado` cuando el usuario no tiene rol de administrador.
- `RoleRoute` permite restringir rutas por rol, por ejemplo docentes.

## Uso futuro con API

Cuando los servicios cambien de `mock` a `api`, los componentes podrán mostrar estados de carga y errores sin caer en pantallas blancas.
