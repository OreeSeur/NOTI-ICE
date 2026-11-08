# NOTI ICE — Contexto del proyecto para Claude Code

Fecha de corte: **7 de noviembre de 2026**, zona America/Mexico_City.
Repositorio: **OreeSeur/NOTI-ICE**. Idioma de trabajo: español.

Este documento entrega el contexto recuperado del código local, documentación y conversaciones relevantes disponibles. No es una transcripción de todos los chats ni una certificación nueva del VPS. Los estados de ejecución y conteos tienen fecha: deben verificarse antes de actuar sobre ellos. No contiene contraseñas, tokens, hashes de usuarios ni conexiones privadas.

## 1. Objetivo y decisión actual del usuario

NOTI ICE es un prototipo de plataforma web para gestionar y publicar información académica e institucional de Ingeniería en Comunicaciones y Electrónica de ESIME Zacatenco, Instituto Politécnico Nacional. Forma parte de un proyecto de titulación. Centraliza noticias, eventos, documentos, consulta académica, horarios, preferencias y contenido dirigido según el perfil del usuario.

El usuario decidió continuar la programación con **Claude Code**. Se está preparando la última rama de trabajo antes del despliegue completo. El objetivo inmediato es continuar los ajustes que indique el usuario y permitir que un compañero ejecute frontend, backend y MySQL localmente.

Últimas decisiones explícitas:

1. Trabajar en `preparacion-final-despliegue`.
2. Mantener en la base local un solo Administrador y los datos de materias y horarios, sin actividad de prueba en publicaciones, selecciones o preferencias.
3. Eliminar los registros antiguos Academia `Computacion` y Materia `Humanidades V`: **ya se realizó** en la base local revisada. No repetir la eliminación.
4. Conservar el tipo de grupo `1CV1` y los tres roles necesarios.
5. Habilitar Ollama para pruebas locales: **ya se realizó** y se publicó en la rama.
6. El usuario indicó que daría las instrucciones siguientes. La entrega de contexto no autoriza por sí sola nuevas funcionalidades, cambios remotos ni despliegue.

## 2. Repositorio y rama que se deben usar

- URL: https://github.com/OreeSeur/NOTI-ICE
- Rama: `preparacion-final-despliegue`.
- HEAD local de la revisión inicial: `ada073a44ac44878939568cbb32746e41fb1833b`.
- Mensaje: `Habilitar modo de pruebas locales con Ollama`.
- Al publicar este documento se consultó GitHub y se incorporó el commit remoto `91fe8b2`, que reorganiza la documentación en `docs/`. Las rutas de este archivo se actualizaron a esa estructura; el contenido de los documentos trasladados no cambió. La revisión funcional inicial corresponde a `ada073a`.
- La rama se creó desde `integracion-consolidada-20261025`, commit `f77fdd56838f74624fdf83c9229a6d9f67ee2079`.
- En la comparación previa, esa integración estaba 30 commits por delante de `main`; `integracion-intervencion-1b-seguridad-cuentas-20261022` apuntaba al mismo commit. Son observaciones históricas, no un inventario remoto perpetuo.
- No volver a `main` suponiendo que contiene la versión más completa.
- El árbol local estaba limpio antes de crear este archivo. Después de la entrega local, el usuario autorizó incorporar este documento al repositorio en esta misma rama.

Hitos cercanos en el historial:

| Commit | Cambio |
|---|---|
| `ada073a` | Modo local con Ollama |
| `f77fdd5` | Validaciones de cuentas y protección de roles, intervención 1B |
| `fb672ac` | Horarios ICE 2027-1 y scripts de importación |
| `d42dcec` | Oferta académica y suscripciones de alumnos |
| `506ace6` | Integración de funcionalidades validadas del piloto sin Ollama |
| `2cb29ae` | Límites de carga y configuración SMTP de producción |

## 3. Ubicación y estructura

Carpeta del trabajo en este equipo:

`C:\Users\range\OneDrive\Documents\ChatGPT\NOTI ICE _ DESARROLLO Y DESPLIEGUE`

El repositorio Git está en la subcarpeta `NOTI-ICE`; los comandos siguientes parten de esa raíz salvo indicación contraria.

```text
NOTI-ICE/
  CLAUDE.md                       Este contexto
  frontend/                       React + Vite
    src/api/                      Cliente HTTP, token, errores, endpoints
    src/components/               Componentes por dominio
    src/context/                  Estado y proveedores por dominio
    src/services/                 Operaciones y adaptación API/mock
    src/storage/                  Persistencia del modo local/mock
    src/data/                     Datos de ejemplo
    src/pages/                    Pantallas públicas, autenticación y administración
    src/routes/                   Router y protección de rutas
    src/constants/                Roles, rutas, audiencias y datos académicos
    src/utils/                    Validación y reglas reutilizables
  backend/
    NoiceBack/                    Proyecto real de API (conservar este nombre)
      Controllers/                Endpoints
      DTOs/                       Contratos de entrada/salida
      Models/                     Entidades
      Data/PortalNoticiasContext.cs
      Services/                   Seguridad, correo, audiencias y límites
      Sql/                        SQL académicos parciales
      Program.cs                  Configuración y middleware
    tests/Intervencion1.Checks/
    tests/ChatbotLimits.Checks/
  database/migraciones/            Migraciones parciales
  docs/                           Documentación por área; índice en docs/README.md
    frontend/                     Arquitectura, roles, flujos, API, errores, identidad (parte histórica)
    backend/                      Pendientes del backend y límites del chatbot
    despliegue/                   Respaldos y recuperación
    pruebas/                      Arranque local (00), checklist y pruebas con Ollama
    desarrollo/                   Prompt inicial para sesiones de Claude Code
  deploy/production/              Plantillas y documentación del servidor
```

Fuera del repositorio, dentro de la carpeta de trabajo:

- `output/NOTI_ICE_guia_local.md`: revisión local del 7 de noviembre y entrega al compañero.
- `output/auditoria-bd/`: informe y herramientas de auditoría del 29 de octubre.
- `output/NOTI_ICE_revision_por_diapositiva.md`: material de presentación.
- `tesis_extraida.txt`: extracción de una versión de la tesis; no asumir que es la versión final.
- `.build/` y `tmp/`: auxiliares locales; no tratarlos como código fuente principal.

Estos materiales externos **no se incluyen automáticamente al clonar GitHub**.

## 4. Stack y arquitectura

| Capa | Configuración observada |
|---|---|
| Frontend | React `^19.2.6`, React Router `^7.18.0`, Vite `^8.0.12` |
| Estilos | Tailwind CSS `^4.3.1`, Lucide, CSS del proyecto |
| HTTP frontend | Axios `^1.19.0` |
| API | C#, ASP.NET Core, destino `net8.0` |
| Datos | Entity Framework Core a través de Pomelo MySQL `9.0.0` |
| Autenticación | JWT Bearer `8.0.22`, BCrypt.Net-Next `4.2.0` |
| API de desarrollo | Swagger / Swashbuckle `6.6.2` |
| BD observada | MySQL `8.0.46` |
| IA local | Ollama, modelo configurado `llama3.2:3b` |

Versiones de frontend tomadas de `package.json`: los rangos no sustituyen las versiones resueltas de `package-lock.json`. Conservar el lockfile y usar `npm ci`.

**Mantener ASP.NET Core 8** salvo nueva decisión del usuario. Pomelo 9 y EF Core 9 ya forman parte de esta configuración; no convertir automáticamente el destino a .NET 9 por el número del proveedor.

Frontend: páginas/componentes → contextos → servicios → API o almacenamiento mock. Evitar acceso directo a persistencia desde componentes. Roles y rutas se centralizan en `constants`. El modo real requiere `VITE_DATA_SOURCE=api`; si falta, `appConfig.js` cae en `mock`, con URL de respaldo `http://localhost:5000/api`. Esa URL no corresponde al arranque local actual.

Backend: `Program.cs` registra MySQL, JWT, servicios de audiencia y correo, CORS, límites, Swagger en Development y controladores. No se observó un instalador integral de BD ejecutado automáticamente al arrancar. MySQL debe existir y ser compatible antes de iniciar la API.

## 5. Dominio, roles y reglas que deben preservarse

Roles reales, con mayúsculas exactas compartidas entre BD, JWT y frontend:

- `Administrador`: administración de usuarios, catálogos y contenido.
- `Docente`: publicación y gestión de contenido propio, con restricciones de audiencia/asignación que deben comprobarse en backend. Desde el 7 nov. 2026 publica, edita y elimina **noticias**, eventos y documentos propios; el backend responde 403 sobre los de otro autor. El `Administrador` puede editar cualquiera y conserva al autor original. El autor ve su publicación y sus comentarios aunque no pertenezca a la audiencia. Borrar comentarios sigue siendo solo del Administrador.
- `Alumno`: consulta, perfil, preferencias y selección académica.

`superadmin`, `personal`, `editor` y otros nombres presentes en compatibilidad del frontend **no son roles adicionales vigentes**. `frontend/src/constants/roles.js` es la referencia actual; el documento antiguo de roles describe cinco y quedó desactualizado.

Reglas esenciales:

- Ocultar botones o proteger rutas no sustituye autorización del servidor.
- No ampliar el acceso a contenido ajeno al modificar listados, detalles, descargas, notificaciones o chatbot.
- Las contraseñas se almacenan con BCrypt, nunca en texto plano.
- `VersionSesion` se valida en cada JWT junto con cuenta activa, rol activo y coincidencia con el rol actual en MySQL. Preservar la revocación de sesiones.
- `ValidacionCuenta.cs` centraliza nombre de 3–150 caracteres, correo de hasta 150 y contraseña de al menos 8 caracteres y como máximo 72 bytes UTF-8. Estas reglas de alta/cambio no deben impedir automáticamente el login de cuentas anteriores.
- Los adjuntos no se sirven como archivos estáticos públicos: descarga mediante API y validación de audiencia.
- Las suscripciones/selecciones académicas del portal **no son inscripciones escolares oficiales del IPN**, aunque existan componentes con “Oficiales” en su nombre.
- Las asignaciones de docentes publicadas en horarios no equivalen a cuentas de usuario ni acreditan por sí solas permisos para publicar.
- **Solicitudes de docentes (7 nov. 2026):** un `Docente` solicita impartir una materia o laboratorio (`ofertaunidades`). Cualquier `Administrador` activo la aprueba, rechaza o revoca; gana la primera resolución, y rechazar o revocar exige motivo. Hay un solo docente aprobado por unidad, garantizado además por un índice único en la BD; al aprobar, las demás pendientes de esa unidad se rechazan. Solo una solicitud `Aprobada` permite al docente elegir esa unidad en `audiencia.unidadesOferta` al publicar noticias, eventos y documentos. Esas publicaciones las ven los alumnos que agregaron la unidad, el docente aprobado y la administración (`AudienciaAccesoService`). No es una asignación oficial del IPN.

## 6. Funcionalidades y lugares de entrada

Hay código para autenticación y recuperación, usuarios/roles, noticias/comentarios, documentos, eventos/calendario, preferencias/notificaciones, catálogos antiguos, oferta académica, selección de materias, perfil y chatbot. La existencia de código no certifica todas las combinaciones de permisos o pantallas.

Rutas actuales de interfaz destacadas: `/`, `/login`, `/perfil`, `/horarios`, `/noticias`, `/eventos`, `/calendario`, `/documentos`, `/notificaciones`, `/docente/publicaciones`, `/admin`, `/admin/usuarios`, `/admin/academias`, `/admin/materias`, `/admin/tipos-grupos`, `/admin/grupos`, `/admin/inscripciones` y pantallas de contenido administrativo. Consultar `routes/AppRouter.jsx` para acceso efectivo y `constants/routes.js` para nombres completos.

API destacada:

| Área | Ruta o fuente |
|---|---|
| Autenticación | `/api/auth/login`, `/api/auth/register`, `/api/auth/perfil` |
| Contenido | `/api/noticias`, `/api/eventos`, `/api/documentos`, `/api/comentarios` |
| Administración | `/api/usuarios`, `/api/roles`, `/api/academias`, `/api/materias`, `/api/grupos`, `/api/grupostipos` |
| Catálogo por plan | `/api/catalogo-academico/materias` |
| Oferta | `/api/oferta-academica/periodos`, `/grupos`, `/grupos/{codigoGrupo}`, `/buscar` bajo el mismo prefijo |
| Selecciones del alumno | GET/POST `/api/oferta-academica/mis-materias`, DELETE con `/{idUnidadOferta}` |
| Solicitudes de docentes | Docente: GET `/api/solicitudes-docentes/mias`, POST `/api/solicitudes-docentes`, DELETE `/{id}`. Administrador: GET `?estado=`, GET `/pendientes/total`, POST `/{id}/aprobar`, `/{id}/rechazar`, `/{id}/revocar`. Ambos: GET `/destinos` |
| Asistente | POST `/api/chatbot` |

Consultar los controladores y DTOs antes de cambiar contratos. `frontend/src/api/endpoints.js` no concentra necesariamente todos los endpoints de los servicios más recientes. No implementar `/auth/me` o `/avisos` solo porque aparecen en documentos antiguos.

## 7. Modelo académico y base local más reciente

Conviven dos modelos: catálogos antiguos (`academias`, `materias`, `grupostipos`, `grupos`, `gruposalumnos`) y oferta por periodo (`catalogomateriasplanes`, `ofertaperiodos`, `ofertagrupos`, `ofertaunidades`, `ofertasesiones`, `ofertadocentesunidad`, `ofertainscripcionesalumnos`). No confundir sus IDs ni vaciar una tabla creyendo que es duplicada.

La oferta contempla planes 2003/2024 y consulta de materias, grupos y horarios. Un alumno puede seleccionar materias de diferentes grupos. El catálogo de materias no equivale a las unidades ofrecidas: una materia puede aparecer en varias unidades, sesiones y asignaciones docentes.

**Última revisión local registrada: 7 de noviembre de 2026.** Destino encontrado en configuración privada: `localhost:3306`, `portal_noticias_pruebas`. No se volvió a consultar MySQL para preparar este documento.

| Datos | Cantidad registrada |
|---|---:|
| Usuarios | 1 Administrador activo, rol activo |
| Roles | 3 |
| Catálogo por plan | 191 |
| Periodos | 1, `2027-1` |
| Grupos de oferta | 175 |
| Unidades de oferta | 1,715 |
| Bloques de horario | 3,205 |
| Asignaciones docentes del horario | 2,406 |
| Academias antiguas | 0 |
| Materias antiguas | 0 |
| Tipos de grupo antiguos | 1: `1CV1` |

Se registraron vacías: `categorias`, `noticias`, `noticiasdocumentos`, `comentarios`, `noticiascomentarios`, `eventos`, `grupos`, `gruposalumnos`, `ofertainscripcionesalumnos`, `usuariospreferencias`, `notificacionesleidas`.

**Cambios del 7 nov. 2026 (tarde), autorizados por el usuario en la base local:**
- El usuario creó con `root` la tabla `ofertasolicitudesdocentes` (script `20261107_solicitudes_docentes_SOLO_PRUEBAS.sql`). Ahora son 23 tablas.
- Para la prueba del flujo de solicitudes, el usuario creó dos cuentas de prueba: `docente.prueba@prueba.local` (Docente) y `alumno.prueba@prueba.local` (Alumno).
- Durante la prueba se crearon: 4 selecciones del Alumno (1CM10: Fundamentos de Programación —unidad 32—, su laboratorio e Introducción al Álgebra Lineal; 1CM11: Mecánica Newtoniana, que se empalma a propósito), 2 solicitudes del Docente (una Aprobada y una Rechazada) y 1 evento titulado «PRUEBA - Asesoría de Fundamentos de Programación 1CM10». En la prueba de noticias de docentes se agregó 1 noticia del Docente, «PRUEBA - Noticia del docente (editada)», dirigida al rol Alumno.
- Siguen pendientes de decisión del usuario: conservarlos, desactivarlos o borrarlos.

`Computacion` y `Humanidades V`, ambas con identificador 1 en sus respectivas tablas, fueron eliminadas con autorización después de revisar relaciones. Se verificó la conservación del Administrador y la oferta. No volver a introducir esos ejemplos con una semilla antigua.

Antes de cualquier escritura, confirmar servidor, base efectiva y precedencia de configuración. El mismo nombre `portal_noticias_pruebas` existe en local y en VPS: **no son la misma instancia**.

## 8. Historial de auditoría y estado conocido del VPS

El 29 de octubre la base local entonces consultada tenía 15 tablas, 12 usuarios y no tenía las siete tablas de oferta. Esa fotografía está en `../output/auditoria-bd/LEEME.md` y **no describe la base local revisada el 7 de noviembre**. Los materiales consultados no permiten reconstruir aquí cada operación intermedia.

El resumen del VPS proporcionado por el usuario el 29 de octubre reportaba:

- Servidor `vps3728092`, IP `162.35.179.199`, Ubuntu Server 24.04.5 LTS y MySQL 8.0.46.
- Base usada: `portal_noticias_pruebas`; **no modificar la original `portal_noticias`**.
- Servicio `noti-ice-api.service`, activo y habilitado entonces; API interna `127.0.0.1:5135`.
- Configuración en `/etc/noti-ice/api.env`; endpoint `/api/categorias` devolvió HTTP 200.
- 22 tablas: 15 del portal y siete de oferta.
- 6 usuarios y 21 selecciones académicas: 2 activas, 19 inactivas.
- Oferta con los mismos conteos académicos generales de la tabla anterior, sin que ello demuestre igualdad de IDs/valores.
- Siete comprobaciones de relaciones académicas sin huérfanos y búsqueda de duplicados de grupos sin resultados.
- Periodo descrito como muestra documental pendiente de cotejo; metadatos de procedencia completos no garantizan vigencia oficial.

Este estado proviene del resumen del usuario; la auditoría no logró una captura remota propia porque SSH rechazó las claves. **No hay evidencia en esta entrega de equivalencia completa local–VPS ni de que el VPS ejecute `ada073a`.**

Las seis cuentas y 21 selecciones son un punto de conservación histórico del VPS, no un objetivo de limpieza local. Antes de sincronizar, recapturar el estado y preservar también actividad posterior. Nunca reemplazar el VPS por la base local de un solo Administrador sin una decisión explícita y un plan de conservación.

## 9. Scripts SQL y reproducción de MySQL

Clonar GitHub no crea MySQL ni copia usuarios o secretos. No se encontró un instalador completo de esquema y datos no sensibles que reproduzca desde cero la instalación final.

| Script | Alcance y precaución |
|---|---|
| `database/migraciones/A5_5_1_2_version_sesion_SOLO_PRUEBAS.sql` | VersionSesion; revisar uso de `Usuarios` y sensibilidad de mayúsculas en Linux |
| `database/migraciones/PILOTO_preferencias_y_notificaciones_SOLO_PRUEBAS.sql` | Dos tablas dependientes de usuarios |
| `backend/NoiceBack/Sql/20261018_oferta_academica_SOLO_PRUEBAS_NO_EJECUTAR.sql` | Seis tablas académicas; no es idempotente ni base completa |
| `backend/NoiceBack/Sql/Fase8_Inscripciones_Oferta_PortalPruebas.sql` | Séptima tabla académica; no ejecutar sobre tabla existente |
| `backend/NoiceBack/Sql/20261107_solicitudes_docentes_SOLO_PRUEBAS.sql` | Tabla `ofertasolicitudesdocentes` (`CREATE TABLE IF NOT EXISTS`, aditivo). **Debe aplicarse en cada base antes de desplegar el código** que la usa; sin ella, las consultas de publicaciones de un Docente fallan. Aplicado en local el 7 nov. 2026; **no aplicado en el VPS** |
| `backend/NoiceBack/Sql/00_PREVALIDACION_SOLO_LECTURA.sql` | Consultas; presupone módulo académico |
| `backend/NoiceBack/Sql/01_IMPORTAR_ICE_2027-1_SOLO_PRUEBAS_NO_EJECUTAR.sql` | Importación incremental; no instala base completa ni muestra previa |

La importación incremental contempla 173 grupos, 1,697 unidades, 3,165 sesiones y 2,382 asignaciones; conserva la muestra previa de 2 grupos, 18 unidades, 40 sesiones y 24 asignaciones. No ejecutarla de nuevo sobre la oferta ya cargada.

Herramientas externas en `../output/auditoria-bd/`:

- `Exportar-Local.ps1`: exportaciones de estructura, conteos y referencias; no importa SQL.
- `Comparar-Exportaciones.ps1`: comparación determinista y validación de hashes.
- `Generar-Base-Verificada.ps1`: genera un candidato desde la captura histórica.
- `base-local-verificada.sql`: **solo las 15 tablas antiguas**, 14 filas de catálogos de ejemplo y cero usuarios. Destino `noti_ice_demo_local`; no es la base final de 22 tablas, no incluye la oferta y no fue ejecutado en aquella auditoría.
- `EXPORTACIONES.md` e `INSTALACION-LOCAL.md`: instrucciones históricas, con sus límites.

**Entrega al compañero (7 nov. 2026):** `database/entrega/Generar-BD-Entrega.ps1` genera una copia limpia sin modificar la base de trabajo. Copia a una base temporal, deja solo el Administrador activo, los roles, los catálogos y la oferta, vacía la actividad y borra las cuentas de prueba. Pide la contraseña de MySQL de forma oculta y no guarda la salida dentro del repositorio. El usuario lo ejecutó; resultado verificado en `C:\dev\entrega-noti-ice\noti_ice_local.sql` (0.48 MB): 1 usuario, 3 roles, 191 materias del catálogo, 175 grupos, 1,715 unidades, 3,205 sesiones, 2,406 docentes publicados, y tablas de actividad vacías. La guía de instalación es `docs/pruebas/03-instalacion-en-otro-equipo.md`. Sigue pendiente la prueba real de restauración en el equipo del compañero.

Antecedente: la guía externa anterior proponía una copia privada de la base local revisada y restauración en una base nueva `noti_ice_local`. Ese respaldo conserva el hash del Administrador: transferirlo privadamente, nunca por Git. La guía registró que aún no se había generado/enviado el respaldo ni probado la instalación en el equipo del compañero. Una alternativa pendiente es un instalador completo sin cuentas reales y con alta segura de un administrador propio.

## 10. Arranque local actual con Ollama

Requisitos documentados: Git, MySQL 8.0, SDK .NET 8 (o posterior compatible con runtime net8.0 instalado), Node.js 22.13+ de la serie 22 o 24, Ollama. Verificar disponibilidad en cada equipo.

Configurar privadamente el backend mediante User Secrets o `backend/NoiceBack/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "PortalNoticiasDb": "Server=localhost;Port=3306;Database=noti_ice_local;User=USUARIO_LOCAL;Password=SECRETO_LOCAL;"
  },
  "Jwt": {
    "Key": "SUSTITUIR_POR_SECRETO_ALEATORIO_DE_AL_MENOS_32_BYTES",
    "Issuer": "noti-ice-local",
    "Audience": "noti-ice-local"
  },
  "Frontend": { "BaseUrl": "http://localhost:5173" },
  "Cors": { "AllowedOrigins": ["http://localhost:5173"] }
}
```

Son marcadores, no credenciales utilizables. En el equipo original la base revisada se llama `portal_noticias_pruebas`; `noti_ice_local` es el destino sugerido para una copia nueva. User Secrets y variables de entorno pueden sobrescribir el archivo. El backend no carga automáticamente `.env`.

Desde la raíz del repositorio:

```powershell
ollama list
# Solo si falta el modelo:
ollama pull llama3.2:3b
# Solo si Ollama no está ejecutándose, en otra terminal:
ollama serve
```

API, en una terminal:

```powershell
dotnet run --project backend/NoiceBack/NoiceBack.csproj --launch-profile ollama-local
```

Frontend, en otra:

```powershell
cd frontend
npm ci
npm run dev:ollama
```

- Portal: http://localhost:5173
- API: http://localhost:5135
- Swagger: http://localhost:5135/swagger
- Ollama: http://127.0.0.1:11434

`ollama-local` configura Development, `Chatbot__Enabled=true`, modelo `llama3.2:3b`, origen CORS y URL local de frontend. `frontend/.env.ollama` y `dev:ollama` activan API real y widget; usan puerto 5173 estricto. Iniciar sesión normalmente para ver el asistente.

No reemplazar `localhost` por otro host sin revisar CORS. Si hay variables `VITE_*` o `.env.ollama.local`, comprobar si sobrescriben la configuración. Reiniciar Vite al cambiar variables. Se conserva `UseHttpsRedirection` en la API: una configuración HTTPS personalizada puede afectar el modo HTTP; revisar la guía si aparece redirección inesperada.

La alternativa HTTPS base usa el perfil `https`, API `https://localhost:7165` y certificado local confiable. La guía externa explica esa variante sin asistente; **para probar Ollama seguir primero `docs/pruebas/02-pruebas-locales-ollama.md`**.

## 11. Asistente: alcance real y límites

Actualizado el 7 de noviembre de 2026 (commits `2a3b3ab` y `49b2542`). `ChatbotController` usa dos tipos de fuentes, con distinto tratamiento:

| Fuente | Quién la recibe | Cómo se responde |
|---|---|---|
| Noticias, eventos y documentos | Según el filtro de audiencia existente (`AudienciaAccesoService.PuedeVer`) | Ollama redacta a partir del contexto autorizado |
| Horario por grupo; búsqueda de materia o docente publicado | `Administrador`, `Docente`, `Alumno` (igual que `/api/oferta-academica`) | Texto exacto armado en la API, sin Ollama |
| Catálogo por plan/semestre | Los mismos tres roles (igual que `/api/catalogo-academico`); clave IPN solo si está verificada | Texto exacto, sin Ollama |
| Mis materias | Solo `Alumno`, solo sus selecciones activas (igual que `/mis-materias`) | Texto exacto, sin Ollama |
| Perfil propio | Cualquier usuario autenticado; nombre, rol, carrera y semestre, sin correo, boleta ni secretos | Texto exacto, sin Ollama |

La lógica está en `Services/ChatbotFuentesAcademicasService.cs`. Solo usa el periodo activo más reciente (o uno activo mencionado). Un rol distinto de los tres no recibe datos académicos.

**Decisión del usuario (7 nov. 2026):** las respuestas académicas no pasan por el modelo. En la prueba con `llama3.2:3b`, al redactar horarios el modelo reagrupaba los datos y asignaba grupos a docentes equivocados, aunque el contexto era correcto. Ahora la respuesta es exacta, tarda menos de 1 s y no ocupa el permiso de generación. No reintroducir la redacción de horarios con IA sin una nueva decisión del usuario.

Sin coincidencias, la respuesta esperada sigue siendo `No encontre informacion publicada para tu perfil sobre ese tema.` En ese caso no se llama al modelo. No confundir esa respuesta con fallo de Ollama ni insertar publicaciones automáticamente para evitarla. Con la base local actual, «¿qué noticias hay?» produce esa respuesta; «horario del grupo 1CM10» devuelve el horario.

La configuración explícita usa `llama3.2:3b`; el controlador tiene un respaldo `llama3` si no se configura modelo. Mantener coherencia entre modelo descargado y configurado.

Límites predeterminados:

| Configuración | Valor |
|---|---:|
| `Chatbot__Limits__RequestsPerWindow` | 5 |
| `Chatbot__Limits__WindowSeconds` | 60 |
| `Chatbot__Limits__MaxConcurrentGenerations` | 1 |
| `Chatbot__Limits__BusyRetryAfterSeconds` | 5 |

HTTP 429 indica cuota por usuario agotada; 503 indica generación ocupada. Hay `Retry-After`, no hay cola. Los contadores son por proceso; no funcionan como cuota distribuida entre varias réplicas. Timeout documentado: 150 segundos. Preservar autenticación y filtro de audiencia al ampliar fuentes.

## 12. Pruebas: evidencia y límites

En la habilitación del 7 de noviembre se reportaron:

- Compilación completa del backend correcta.
- Compilación de frontend en modo Ollama correcta.
- 27 comprobaciones de límites del chatbot aprobadas.
- Generación real con `llama3.2:3b` completada.
- API y frontend iniciados en ese momento; esto no garantiza que sigan activos.
- Sin modificaciones a MySQL durante la habilitación.
- La instalación reportó 7 vulnerabilidades de dependencias; no se actualizaron paquetes como parte de esa tarea. Reexaminar el informe antes de decidir una corrección, sin aplicar cambios mayores automáticos.

**Pendiente:** probar el chat dentro del portal después de iniciar sesión normalmente. Una comprobación propuesta con token administrativo generado fue rechazada por omitir el login; no se ejecutó y no es evidencia de funcionamiento integral.

Comandos disponibles para validación posterior a cambios:

```powershell
# Desde la raíz, usar el .csproj explícito para evitar ambigüedad con soluciones:
dotnet build backend/NoiceBack/NoiceBack.csproj -c Release
dotnet run --project backend/tests/ChatbotLimits.Checks/ChatbotLimits.Checks.csproj -c Release
dotnet run --project backend/tests/Intervencion1.Checks/Intervencion1.Checks.csproj -c Release

# En frontend:
npm run lint
npm run build -- --mode ollama
```

`Intervencion1.Checks` usa controladores reales con SQLite en memoria; no inicia el servidor real ni usa MySQL/VPS/SMTP/Ollama. `ChatbotLimits.Checks` usa host aislado e identidades de prueba; no valida JWT reales ni consultas del chatbot. No equiparar pruebas aisladas con pruebas integrales. No se volvieron a ejecutar estas pruebas para crear este documento, que solo agrega documentación.

Verificaciones manuales relevantes: login, rechazo de acceso sin permisos, consulta 2027-1, detalle de horarios, conservación de datos, descarga autorizada, comportamiento vacío de contenido, chatbot autenticado y estados 429/503 cuando corresponda. Las pruebas que creen datos deben planearse en una copia aislada para conservar la base local limpia solicitada.

## 13. Producción y operación

`deploy/production/` contiene plantillas de Nginx, systemd, entorno y Ollama; son referencias, no evidencia de instalación efectiva. El README describe el estado de preparación de esas plantillas, mientras que el chat del VPS acredita un despliegue de pruebas histórico.

- Diseño previsto: Nginx con TLS → API en loopback `127.0.0.1:5135`; React estático; MySQL y Ollama privados.
- Build de producción con `VITE_DATA_SOURCE=api`, `VITE_API_URL=/api`; la habilitación visual del chatbot también se incorpora al compilar.
- No usar `launchSettings.json` como configuración de producción.
- Secretos de systemd fuera de Git; adaptar dominio, rutas y certificados de ejemplo.
- `Storage__UploadsPath`: directorio privado persistente, ejemplo `/var/lib/noti-ice/uploads`, separado de los binarios.
- No exponer uploads por Nginx. Límite documentado: 20 MiB por archivo, Nginx `25m` para multipart.
- SMTP requiere `Email__Host`, `Port`, `UseSsl`, `User`, `Password`, `From`, `FromName`, además de `Frontend__BaseUrl` correcto.
- Una respuesta genérica de recuperación no demuestra que se haya enviado correo.
- Configurar proxies confiables explícitos; conservar procesamiento de forwarded headers antes de HTTPS.
- Para Ollama de una sola instancia: `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`; medir latencia/memoria antes de aumentar concurrencia.
- Respaldar MySQL y adjuntos; probar restauración aislada. Consultar `docs/despliegue/01-respaldos-y-recuperacion.md`.

No desplegar, reiniciar servicios, alterar esquema remoto, sincronizar bases ni realizar push/merge solo por leer este contexto. Preparar el cambio concreto y seguir la autorización vigente del usuario. La prohibición histórica de modificar `portal_noticias` permanece relevante.

## 14. Documentación antigua, tesis e identidad

Hay documentación escrita cuando la API todavía era futura. `docs/backend/01-pendientes-backend.md`, `docs/frontend/01-arquitectura.md` y `docs/frontend/02-roles-y-permisos.md` son útiles para intención original, pero **no son inventario fiable de lo que falta hoy**. Verificar siempre contra código actual y pruebas. Ejemplos obsoletos: cinco roles, rutas `/avisos`, API futura y `/auth/me`.

Identidad visual documentada: Noto Sans, guinda `#6f1d46`, guinda de logo `#750946`, gris `#636569`, negro y blanco. Preservar proporciones del escudo IPN y revisar responsive/sidebar si se cambia layout. Es la identidad adoptada en el proyecto, no una nueva revisión del manual institucional.

La revisión de tesis del 3 de noviembre detectó cuestiones que pueden afectar la programación:

- RF-07/RF-08 debían reflejar que Docente publica y administra lo propio, Administrador cualquiera; había frases contradictorias que solo permitían Administrador.
- RF-25/RF-26 tenían estados vacíos: no declararlos implementados sin verificar.
- La vinculación docente propuesta incluye autorización de responsable por academia, alcance por periodo y prohibición de autoaprobar solicitudes. Responsable es una autorización de un Docente, no necesariamente un cuarto rol general.
- RF-26 contempla vigencia de noticias/eventos. Verificar comportamiento actual antes de prometerlo o implementarlo.
- RF-24 relaciona preferencias y avisos por correo al publicar; la trazabilidad de la tesis era incompleta.
- La disponibilidad de interfaz de comentarios y selección académica descrita en la tesis puede estar atrasada respecto al código actual.

Estos son hallazgos documentales y requisitos a cotejar, no confirmación de implementación ni autorización para desarrollar toda esa lista. También se señalaron índice con marcador roto, referencia inexistente 3.2.7, encabezado “D” en vez de “ID”, pie de figura dividido y encabezados de tablas sin repetición. No se editaron la tesis o sus figuras en esta entrega.

## 15. Pendientes y siguiente sesión

Pendientes confirmados o no acreditados por las fuentes revisadas:

1. Prueba completa del asistente con login normal. **Hecha el 7 nov. 2026 con el Administrador**: horario de grupo, búsqueda de materia, catálogo, perfil, «mis materias» sin resultado para Administrador y publicaciones vacías. **Pendiente:** «mis materias» con una cuenta Alumno real (requiere crear datos; hacerlo en una copia aislada o con autorización) y publicaciones reales redactadas por Ollama.
2. Entrega privada de una BD compatible y prueba real en el equipo del compañero; o diseño de instalador completo sin datos personales si el usuario elige esa vía.
3. Diff completo local–VPS con capturas actuales, sin confundir igualdad de conteos con igualdad de datos.
4. Revisión de vulnerabilidades reportadas y validación de las correcciones necesarias.
5. Reconciliar documentación antigua y requisitos de tesis con comportamiento real.
6. Validación del entorno final: SMTP, HTTPS, adjuntos, permisos, rendimiento de Ollama, respaldos/restauración y versión efectivamente desplegada.

La ampliación del chatbot a materias, horarios, catálogo, mis materias y perfil **ya se realizó** (ver sección 11).

Al retomar:

1. Leer este documento, `docs/pruebas/00-arranque-local.md` y `docs/pruebas/02-pruebas-locales-ollama.md`.
2. Comprobar rama, HEAD y cambios locales; conservar trabajo existente.
3. Leer los archivos del módulo solicitado y resolver contradicciones usando código actual y evidencia fechada.
4. Confirmar destino de BD antes de cualquier operación con datos, sin imprimir secretos.
5. Implementar el alcance indicado por el usuario, validar proporcionalmente y registrar resultado, pendientes y limitaciones.
6. Actualizar este contexto si cambia una decisión importante, distinguiendo local de remoto y pruebas realizadas de propuestas.

## 16. Fuentes de esta entrega

- Árbol local de `preparacion-final-despliegue` en `ada073a`, README, package.json, .csproj, Program.cs, configuración de arranque, constantes, servicios y controladores consultados.
- `docs/pruebas/02-pruebas-locales-ollama.md`, `docs/backend/02-limites-chatbot.md`, `deploy/production/README.md` y documentación del frontend.
- `../output/NOTI_ICE_guia_local.md`, revisión 7 de noviembre.
- `../output/auditoria-bd/LEEME.md`, auditoría 29 de octubre.
- Chat **Identifica la rama más reciente**, ID `01a1b6ea-cb45-7f02-8ffa-69ff807a58f0`: rama final, revisión/limpieza local y habilitación/publicación de Ollama.
- Chat **Comparar esquemas MySQL de NOTI ICE**, ID `01a18697-10fc-79b0-8f68-036eee676e10`: restricciones, resumen VPS y límites de auditoría.
- Chat **Revisar tesis NOTI ICE**, ID `01a1a34e-30d2-77f1-8e21-d6615cd2e5ec`: revisión documental del 3 de noviembre.

Los IDs de chats sirven para trazabilidad en el entorno anterior; no asumir que Claude Code tiene acceso a ellos. Por eso las decisiones y limitaciones operativas relevantes están resumidas aquí.
