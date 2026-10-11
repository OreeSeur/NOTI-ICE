# Roles y permisos

## Roles disponibles

Los roles se definen en:

```text
src/constants/roles.js
```

| Rol | Valor interno | Descripción |
|---|---|---|
| Superadministrador | `superadmin` | Control total del sistema. Preparado para uso futuro. |
| Administrador | `admin` | Gestiona usuarios, contenido y estructura académica. |
| Docente | `docente` | Gestiona sus materias/grupos y publica contenido académico. |
| Alumno | `alumno` | Configura materias inscritas y recibe contenido dirigido. |
| Personal administrativo | `personal` | Rol preparado para vistas administrativas no críticas. |

## Rutas públicas

| Ruta | Acceso |
|---|---|
| `/` | Todos |
| `/avisos` | Todos |
| `/eventos` | Todos |
| `/calendario` | Todos |
| `/documentos` | Todos |
| `/login` | Visitantes |

## Rutas protegidas por sesión

| Ruta | Acceso |
|---|---|
| `/perfil` | Usuario autenticado |
| `/notificaciones` | Usuario autenticado |

## Rutas docentes

| Ruta | Acceso |
|---|---|
| `/docente/publicaciones` | Docente o administrador |

El docente sólo debe crear, editar y eliminar sus propias publicaciones.

## Rutas administrativas

| Ruta | Acceso |
|---|---|
| `/admin` | Administrador |
| `/admin/avisos` | Administrador |
| `/admin/eventos` | Administrador |
| `/admin/documentos` | Administrador |
| `/admin/usuarios` | Administrador |
| `/admin/academico` | Administrador |

## Reglas esperadas para backend

El backend deberá validar los permisos aunque el frontend ya oculte rutas o botones.

Reglas mínimas:

- Un alumno no puede acceder a endpoints administrativos.
- Un alumno no puede crear publicaciones.
- Un docente no puede publicar para materias que no tiene asignadas.
- Un docente no puede editar publicaciones de otro docente.
- Un administrador puede gestionar cualquier publicación o asignación.
- Las notificaciones deben entregarse sólo a usuarios destinatarios.

## Páginas de error relacionadas

| Ruta | Uso |
|---|---|
| `/no-autorizado` | Acceso sin permisos. |
| `/no-encontrado` | Ruta inexistente o recurso no encontrado. |
