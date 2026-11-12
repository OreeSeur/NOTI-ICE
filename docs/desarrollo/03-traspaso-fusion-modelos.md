# Traspaso: implementar la fusión de modelos académicos

Fecha: 11 de noviembre de 2026. Rama: `preparacion-final-despliegue`. Copia de trabajo: `C:\dev\NOTI-ICE`.
Este documento deja a una sesión nueva en el punto exacto donde quedó la anterior. Leer primero `CLAUDE.md` y
`docs/desarrollo/02-fusion-modelos-academicos.md` (diseño completo, con mapeo de las 40 optativas).

## 1. Decisiones del usuario (definitivas)

1. **Se conserva el modelo por periodo (oferta)**; el modelo antiguo (`materias`, `grupostipos`, `grupos`, `gruposalumnos`) se retira. La tabla `academias` **se reutiliza**.
2. **Academia = opción de optativas** de ICE: Acústica, Computación, Electrónica, Comunicaciones, Control. Sin academia en las obligatorias.
3. **Plan 2003 es el correcto.** El catálogo y `ofertagrupos` guardan hoy el plan antiguo como `2004` (viene del script de importación); se normaliza a `2003`.
4. Las 3 variantes de nombre quedan confirmadas: «Acústica Arquitectural» (catálogo: `Arquitectural`), «Teoría de la Codificación y Manejo de la Información» y «Control No Distribuido» (catálogo: `Control Distribuido`). Los scripts ya las mapean.
5. **El tipo de grupo `1CV1` se retira** junto con `grupostipos` (contradice una decisión previa del CLAUDE.md; esta es posterior y manda).
6. **El listado nominal de suscritos SE CONSERVA** (cambia lo que el diseño recomendaba): el Docente aprobado en una unidad y el Administrador deben poder ver los alumnos suscritos a esa unidad.
7. Todo se prueba **en local primero**; después se sube al VPS. No desplegar ni tocar el VPS sin autorización nueva.

## 2. Reglas de trabajo con este usuario

- Idioma español. No hacer commit ni push salvo petición expresa.
- **No escribir en MySQL.** Los scripts SQL los ejecuta el usuario; hay que **mostrarle cada script completo en el chat** (no solo la ruta) y explicar cómo correrlo: `& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4 portal_noticias_pruebas < archivo.sql` (base local de trabajo: `portal_noticias_pruebas`).
- Verificar la base y el servidor antes de cualquier escritura (el mismo nombre existe en local y en el VPS: no son la misma instancia).
- Mantener ASP.NET Core 8, la autorización en el servidor y el filtro de audiencia (ver CLAUDE.md §5).
- Compilar el frontend de producción desde PowerShell, no desde Git Bash.
- Las suscripciones del portal **no son inscripciones oficiales del IPN**; el listado de suscritos debe decirlo en la interfaz.

## 3. Estado al momento del traspaso

**Hecho (solo archivos nuevos, sin código tocado):**
- `docs/desarrollo/02-fusion-modelos-academicos.md` (diseño; su sección 9 queda superada por la sección 1 de este documento).
- `backend/NoiceBack/Sql/20261111_fusion_00_consulta_SOLO_LECTURA.sql`
- `backend/NoiceBack/Sql/20261111_fusion_01_normalizar_plan_2003_SOLO_PRUEBAS.sql`
- `backend/NoiceBack/Sql/20261111_fusion_02_academias_en_catalogo_SOLO_PRUEBAS.sql`

Los scripts **no se han ejecutado**. Las 80 filas del script 02 se verificaron contra el catálogo del script de importación: existen todas. Orden de ejecución para el usuario: 00 (solo lectura), respaldo con `mysqldump --single-transaction`, 01, 02.

**Backend (sección 4) hecho el 11 nov. 2026, sin commit:**
- Retirados `Models/{Grupo,Materia,GrupoTipo,GrupoAlumno}.cs`, `Controllers/{Grupos,Materias,GruposTipos}Controller.cs`, `DTOs/{GrupoDto,MateriaDto}.cs`, los DTO de tipo de grupo y sus `DbSet`/configuraciones. `/api/grupos`, `/api/materias` y `/api/grupostipos` ya no existen.
- `CatalogoMateriaPlan.IdAcademia` (FK `fk_catalogomateriasplanes_academia`, Restrict); `Academia.MateriasCatalogo`. `AcademiasController` comprueba materias del catálogo al desactivar.
- `AudienciaDto`: `GruposOferta` y `Academias` nuevos; el JSON antiguo `grupos` se lee como `GruposAntiguos`, se rechaza al publicar (400) y no se vuelve a guardar. `PuedeVer` cierra el acceso si trae ids (solo Administrador y autor).
- `AudienciaAccesoService.PrepararDestinosAsync` (antes `PrepararGruposAsync`) y `PuedePublicarAsync(User, AudienciaDto)` único, usado por los seis call sites.
- Catálogo (`?idAcademia=`), detalle de grupo y `GET /destinos` exponen `IdAcademia`/`AcademiaNombre`; `/destinos` añade `IdGrupoOferta`.
- Nuevo `Controllers/SuscritosUnidadController.cs`: `GET api/oferta-academica/unidades/{id}/suscritos` (Administrador cualquiera; Docente solo aprobada, si no 404). Devuelve nombre, carrera, semestre, fecha y aviso; nunca correo ni boleta.
- `Intervencion1.Checks`: 119/119 (6 casos nuevos). `ChatbotLimits.Checks`: 27/27. Build Release sin advertencias.

**Scripts 00, 01 y 02 ejecutados por el usuario en la base local el 11 nov. 2026** (respaldo previo en `C:\dev\entrega-noti-ice\respaldo_antes_fusion_20261111.sql`): plan 2003 = 138 materias y 70 grupos; academias con ids 2–6, 16 filas cada una, 80 en total.

**Frontend (sección 5) hecho el 11 nov. 2026, sin commit:**
- Retiradas las páginas `admin/{grupos,inscripciones,materias,tipos-grupos}`, `MisGruposDocentes`, `MisInscripcionesOficiales`, los servicios `adminGrupos*`, `adminMaterias`, `inscripciones`, `api/catalogosApiService`, rutas, accesos del panel y endpoints antiguos.
- `AudienceFields`: «Grupos de horario» (con filtro) y «Academias». Administrador: grupos del periodo activo más reciente y `/academias`; Docente: los de sus `/destinos`. `normalizeAudience` ya no reenvía `grupos` y avisa si la publicación los tenía.
- Nuevo `components/common/SuscritosUnidad.jsx`, en «Mis materias» del Docente y en solicitudes aprobadas del Administrador.
- Horarios: etiqueta «Optativa · Academia» en el detalle del grupo y filtro por academia en el catálogo. Los selectores de plan dicen `2003` (antes `2004`).
- Modo mock: se conserva la demostración local de perfil académico (localStorage); no usa la API.
- `npm run build -- --mode ollama` correcto. `npm run lint`: 3 errores `set-state-in-effect` en `HorariosAcademicos.jsx` que **ya existían en HEAD**.

**Prueba manual con el Administrador (11 nov. 2026, base local migrada, sin crear datos):** el panel ya no muestra los accesos antiguos; Horarios plan 2003 muestra 138 materias, 80 optativas, 5 academias en el filtro (Control → 16) y 70 grupos; 8CM1 tiene 8 unidades con «Optativa · Comunicaciones» y obligatorias sin academia; el formulario de noticia lista 175 grupos (filtro «8CM» → 7), 5 academias y 1 materia aprobada; el listado de suscritos de la unidad 32 responde 200 con el aviso (0 alumnos). Sin errores en el registro de la API.

**Prueba con Docente y Alumno (11 nov. 2026, autorizada; crea datos en la base local):**
- Administrador publicó la noticia **id 2** «PRUEBA FUSIÓN - Academia Comunicaciones» (`academias: [5]`).
- `docente.prueba`: el formulario solo ofrece el grupo 1CM10 y ninguna academia; la API responde 400 a grupo ajeno (8CM1), academia ajena, mezcla 1CM10+8CM1 y campo antiguo `grupos`. Publicó la noticia **id 3** «PRUEBA FUSIÓN - Grupo 1CM10 (Docente)» (`gruposOferta: [4]`). El Docente no ve la noticia 2.
- `alumno.prueba` (ya tenía 22 materias de 9CM11/9CV11, Computación): no veía las noticias 2 y 3 (detalle 404). Se le agregaron las unidades **32** (Fundamentos de Programación, 1CM10) y **480** (Electrónica Analógica de Comunicaciones, 8CM1); después ve ambas (200) en API y en Noticias.
- `docente.prueba` en «Mis materias»: el listado de la unidad 32 muestra 1 alumno con nombre, carrera, semestre y fecha (sin correo ni boleta); la unidad 480, ajena, responde 404.
- Corregido: `SuscritosUnidadController` marca `FechaSuscripcion` como UTC (se veía un día después). El mismo desfase existe, sin corregir, en `mis-materias` (`FechaAlta` sin zona).
- Datos de prueba que quedan, pendientes de decisión del usuario: noticias 2 y 3, y las selecciones de las unidades 32 y 480 de `alumno.prueba`.

**Script 03 escrito (11 nov. 2026), no ejecutado:** `Sql/20261111_fusion_03_retirar_modelo_antiguo_SOLO_PRUEBAS.sql`. Antes de los `DROP` comprueba con guardas (ERROR 1242 si falla) que `gruposalumnos`, `grupos` y `materias` estén vacías, que `grupostipos` tenga como máximo 1 fila, que ninguna tabla externa las referencie y que exista `idAcademia`. Al final debe mostrar 19 tablas y 5 academias.

**Script 03 ejecutado por el usuario en la base local el 11 nov. 2026** (respaldo previo en `C:\dev\entrega-noti-ice\respaldo_antes_fusion_03_20261111.sql`, 508 KB): las seis guardas dieron `ok`, se retiraron `gruposalumnos`, `grupos`, `materias` y `grupostipos` (con el tipo `1CV1`), quedaron **19 tablas** y `academias` con 5 filas. Con la API en marcha, noticias, eventos, documentos, academias, catálogo, destinos, suscritos y detalle de grupo respondieron 200, sin errores en el registro.

`CLAUDE.md` actualizado (secciones 1, 5, 6, 7, 8, 9 y 15) y `Generar-BD-Entrega.ps1` ajustado al modelo único; todo quedó en un commit el 11 nov. 2026.

**Pendiente:** decidir qué hacer con los datos de prueba; tesis (sección 8); llevarlo al VPS solo con autorización.
El backend nuevo **requiere los scripts 01 y 02 ejecutados**: sin la columna `idAcademia` falla cualquier consulta del catálogo y la lectura de publicaciones de Alumno y Docente.

## 4. Backend (`backend/NoiceBack`)

Hechos ya verificados en el código:

- `Models/CatalogoMateriaPlan.cs`: añadir `int? IdAcademia` y `Academia? Academia`. En `Data/PortalNoticiasContext.cs`, configurar la columna `idAcademia` y la FK con `DeleteBehavior.Restrict`.
- `Models/Academia.cs` tiene `ICollection<Materia>? Materias`: sustituir por la colección de `CatalogoMateriaPlan`.
- `Controllers/AcademiasController.cs`: `EliminarAcademia` consulta `_context.Materias`; cambiar a comprobar materias activas del **catálogo** con esa academia. El CRUD ya existe y se reutiliza.
- `Controllers/CatalogoAcademicoController.cs` (`GET api/catalogo-academico/materias`) y `CatalogoMateriaConsultaDto`: exponer `IdAcademia` y `AcademiaNombre`; añadir filtro opcional `idAcademia`.
- **Audiencia.** `DTOs/NoticiaDto.cs` define `AudienciaDto` con `Grupos` (antiguo) y `UnidadesOferta`. Cambiar a: quitar `Grupos`, añadir `GruposOferta` (ids de `ofertagrupos`) y `Academias` (ids de `academias`), topes iguales a los actuales (máx. 30, positivos, sin repetidos).
- `Services/AudienciaAccesoService.cs`:
  - `PrepararGruposAsync` hoy consulta `GruposAlumnos` y `Grupos`. Sustituir por conjuntos calculados desde la oferta: para el **Alumno**, grupos y academias de sus suscripciones activas; para el **Docente**, de sus solicitudes `Aprobada` (activas en periodo activo).
  - `PuedeVer`: comprobar `gruposOferta` y `academias` además de `unidadesOferta`, con la misma regla (si hay alguno, el usuario debe pertenecer al menos a uno).
  - **Seguridad (obligatorio):** seguir leyendo el campo antiguo `grupos` del JSON; si trae ids, la publicación **solo la ven el Administrador y el autor** (acceso cerrado). Si simplemente se ignorara, publicaciones antiguas pasarían a ser públicas.
  - Reemplazar `PuedePublicarParaGruposAsync` por validadores de `gruposOferta` y `academias`: el Administrador puede elegir cualquiera activo; el Docente solo los que contienen una unidad con su solicitud aprobada. Considerar un método único `PuedePublicarAsync(User, AudienciaDto)`.
- Call sites que hoy llaman `PuedePublicarParaGruposAsync(User, audiencia.Grupos)`: `NoticiasController` (líneas ~125 y ~177), `EventosController` (~123 y ~167), `DocumentosController` (~244 y ~318). Actualizar los seis y el texto del mensaje de error.
- `Controllers/DocumentosController.cs` tiene su propio `TryLeerAudiencia`: revisarlo.
- **Listado de suscritos (nuevo).** Endpoint sugerido `GET api/oferta-academica/unidades/{idUnidadOferta}/suscritos`, roles `Administrador,Docente`:
  - Administrador: cualquier unidad activa. Docente: solo si tiene solicitud `Aprobada` de esa unidad (403/404 en otro caso, sin revelar existencia).
  - Devuelve alumnos con suscripción activa: nombre, carrera, semestre y fecha de suscripción. **No** devolver correo, boleta ni contraseña/hash. Incluir un aviso de que no son inscripciones oficiales.
  - Reutilizar el estilo de `Controllers/InscripcionesOfertaController.cs` (ruta base `api/oferta-academica/mis-materias`, solo Alumno) y `SolicitudesDocentesController` (`GET /destinos` ya calcula `alumnosSuscritos`).
- **Retirar:** `Models/{Grupo,Materia,GrupoTipo,GrupoAlumno}.cs`, `Controllers/{GruposController,MateriasController,GruposTiposController}.cs`, `DTOs/GrupoDto.cs`, `DTOs/MateriaDto.cs` y los DTO de tipo de grupo en `DTOs/CatalogosDtos.cs`, más los `DbSet` y configuraciones del contexto (líneas ~19-23 y ~387-477). Buscar con compilación otras referencias (`ChatbotController` tiene una).
- `backend/tests/Intervencion1.Checks` solo usa `OfertaGrupos`: no depende del modelo antiguo, pero añadir pruebas para audiencia por grupo/academia, cierre de acceso del campo `grupos` antiguo y el endpoint de suscritos (Docente ajeno recibe 403/404).

## 5. Frontend (`frontend/src`)

- Retirar: `pages/admin/{grupos,inscripciones,materias,tipos-grupos}`, `components/profile/MisGruposDocentes.jsx` (y su uso en `AcademicProfileSection.jsx`), `services/adminGruposTiposService.js`, partes de `services/academiasService.js` y `storage/academicoStorage.js` que sean del modelo antiguo, rutas en `routes/AppRouter.jsx` y `constants/routes.js` (`ADMIN_MATERIAS`, `ADMIN_TIPOS_GRUPOS`, `ADMIN_GRUPOS`, inscripciones), accesos en `pages/PanelAdmin.jsx` y `api/endpoints.js`.
- Conservar y ajustar `pages/admin/academias/AdminAcademias.jsx`.
- `components/common/AudienceFields.jsx`: reemplazar el bloque «Grupos destinatarios» (hoy `get("/grupos")`) por «Grupos de horario» y «Academias»; mantener «Materias de los horarios». Actualizar `utils/audience.js` y `constants/audience.js` (`grupos` → `gruposOferta` y `academias`).
- Mostrar el listado de suscritos: en la pantalla del Docente (`DOCENTE_MATERIAS`, «Mis materias») para cada unidad aprobada y en el panel del Administrador (por ejemplo desde `AdminSolicitudesDocentes`). Texto visible: «Alumnos que agregaron esta materia a su perfil; no es una inscripción oficial».
- Mostrar la academia en el catálogo / detalle de optativas.
- Modo mock (`isMockDataSource`): mantener coherente o quitar lo del modelo antiguo.

## 6. Validación

Desde la raíz, en PowerShell:

```powershell
dotnet build backend/NoiceBack/NoiceBack.csproj -c Release
dotnet run --project backend/tests/Intervencion1.Checks/Intervencion1.Checks.csproj -c Release
dotnet run --project backend/tests/ChatbotLimits.Checks/ChatbotLimits.Checks.csproj -c Release
cd frontend
npm run lint
npm run build -- --mode ollama
```

Prueba manual local (con la base ya migrada por el usuario): publicar una noticia dirigida a una academia y a un grupo con un Docente aprobado y con un Administrador; verificar que un Alumno suscrito la ve y otro no; abrir el listado de suscritos como Docente propio (200), como Docente ajeno (403/404) y como Administrador (200).

## 7. Script de retiro de tablas (último paso, lo ejecuta el usuario)

`backend/NoiceBack/Sql/20261111_fusion_03_retirar_modelo_antiguo_SOLO_PRUEBAS.sql`, **solo después** de que el código nuevo esté probado y con respaldo: `DROP TABLE` de `gruposalumnos`, `grupos`, `materias`, `grupostipos` (en ese orden por las llaves foráneas). Dejar el resultado en 19 tablas. No tocar `academias`.

## 8. Después

- Actualizar `CLAUDE.md` (secciones 3, 5, 6, 7, 9 y 15) con el modelo único, 19 tablas, academias, endpoint de suscritos y los scripts de fusión; registrar que 1CV1 se retiró.
- Impacto en la tesis: Capítulo 3 (23 → 19 tablas; reescribir 3.3.3 y 3.9 sobre un solo modelo; figura 3.3 con `academias`); archivos en `docs/tesis/`.
- Llevar todo al VPS solo con autorización: ejecutar scripts 00-02 sobre `noti_ice_produccion` (con respaldo), desplegar API y frontend compilado desde PowerShell, y luego el script 03.
- Pendiente aparte: optativas del plan 2024 (el catálogo solo llega al semestre 5); unidad Culhuacán fuera de alcance.
