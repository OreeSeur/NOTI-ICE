# Fusión de los dos modelos académicos (diseño)

Fecha: 11 de noviembre de 2026. Estado: **propuesta de diseño, sin implementar**. No se modificó código ni base de datos.

## 1. Decisiones del usuario que fijan este diseño

1. Se conserva el **modelo por periodo (oferta)** como único modelo académico.
2. **Academia = opción de optativas** de ICE (Acústica, Computación, Electrónica, Comunicaciones, Control). No se asigna academia a las materias obligatorias.
3. La base es el **plan 2003**. El plan 2024 queda pendiente hasta contar con un horario que incluya los semestres 6 a 9.

## 2. Qué dice el mapa curricular (fuente: PDF del usuario, Plan 2003 y Plan 2024)

- Una sola carrera (ICE), dos planes, dos unidades (Zacatenco y Culhuacán). El portal solo cubre Zacatenco.
- Las cinco áreas aparecen como **opciones** de asignaturas optativas en los semestres VIII y IX: cuatro optativas por semestre, **8 por opción y 40 por plan**.
- En el plan 2024 la opción de Control se llama «Cibernética (Zacatenco) / Control (Culhuacán)». Se modela como una sola academia, **Control**.
- Las materias obligatorias no traen academia en esa fuente.

## 3. Estado actual: dos modelos

| | Modelo antiguo | Modelo por periodo |
|---|---|---|
| Tablas | `academias`, `materias`, `grupostipos`, `grupos`, `gruposalumnos` | `catalogomateriasplanes`, `ofertaperiodos`, `ofertagrupos`, `ofertaunidades`, `ofertasesiones`, `ofertadocentesunidad`, `ofertainscripcionesalumnos`, `ofertasolicitudesdocentes` |
| Datos (base local) | 0 filas, salvo el tipo `1CV1` | 191 materias, 175 grupos, 1,715 unidades, 3,205 sesiones |
| Código que lo usa | `GruposController`, `MateriasController`, `AcademiasController`, `GruposTiposController`, `AudienciaAccesoService` (campo `grupos`), páginas de administración y `MisGruposDocentes` | `OfertaAcademicaController`, `InscripcionesOfertaController`, `SolicitudesDocentesController`, `ChatbotFuentesAcademicasService`, `AudienciaAccesoService` (campo `unidadesOferta`) |

Hechos verificados en el código:

- `Intervencion1.Checks` solo usa `OfertaGrupos`; **ninguna prueba depende del modelo antiguo**.
- Las publicaciones (noticias, eventos, documentos) validan `audiencia.grupos` con `PuedePublicarParaGruposAsync`, que consulta el modelo antiguo.
- Lo que el modelo antiguo permitía y el nuevo **no** tiene: un Administrador inscribiendo alumnos a un grupo, el listado de alumnos de un grupo para Docente o Administrador, y un docente responsable asignado en el grupo (`grupos.idUsuario`). Ver decisiones abiertas.

## 4. Modelo objetivo

```
academias (5 filas)
   └── catalogomateriasplanes.idAcademia  (NULL salvo en optativas)
          └── ofertaunidades  → sesiones, docentes, suscripciones, solicitudes
```

### 4.1 Cambios de esquema (todos aditivos hasta la fase final)

1. **Se reutiliza la tabla `academias`**. Ya tiene la forma necesaria (`idAcademia`, `Nombre`, `Descripcion`, `FechaAlta`, `Activo`), está vacía, y `AcademiasController` y su pantalla de administración ya existen.
2. Se añade `catalogomateriasplanes.idAcademia INT NULL`, con llave foránea a `academias` (`ON DELETE RESTRICT`) e índice.
3. Se carga `academias` con 5 filas y se asigna `idAcademia` a las optativas (sección 5). La columna `Tipo` del catálogo, hoy vacía, se llena con `Optativa` en esas mismas filas.
4. Cada optativa tiene dos filas de catálogo (teoría y laboratorio, p. ej. «Grabación» y «Laboratorio de Grabación»); **la academia se asigna a ambas**.
5. Al final, un script aparte retira `materias`, `grupostipos`, `grupos` y `gruposalumnos`. Quedan **19 tablas** (23 menos 4).

### 4.2 Normalización del nombre del plan

Según el script de importación, el catálogo antiguo está guardado como plan `2004`, mientras el PDF, el frontend (`constants/academic.js`) y el asistente (expresión `\b(2003|2024)\b` en `ChatbotFuentesAcademicasService`) usan `2003`.

Antes de cargar academias hay que **confirmar en la base** con una consulta de solo lectura:

```sql
SELECT 'catalogo' AS tabla, Plan, COUNT(*) FROM catalogomateriasplanes GROUP BY Plan
UNION ALL SELECT 'grupos', Plan, COUNT(*) FROM ofertagrupos GROUP BY Plan;
```

Si aparece `2004`, se normaliza a `2003` con un `UPDATE` en ambas tablas, tras respaldo. `ofertagrupos` tiene un índice único `(IdPeriodo, Programa, Plan, CodigoGrupo)`; la consulta anterior debe mostrar que no hay ya filas con plan `2003` que provoquen colisión.

## 5. Asignación de academias (plan 2003)

Cotejo del PDF contra el catálogo del horario 2027-1: **37 de 40 coinciden por nombre y semestre**, cada una con su laboratorio. Tres tienen variantes que requieren confirmación del usuario:

| PDF (plan 2003) | Catálogo |
|---|---|
| Acústica Arquitectural | `Arquitectural` |
| Teoría de la Codificación y Manejo de la Información | `Teoría de Codificación y Manejo de Información` |
| Control **No** Distribuido | `Control Distribuido` |

Mapeo (semestre VIII → IX):

| Academia | Semestre VIII | Semestre IX |
|---|---|---|
| Acústica | Acústica Arquitectural, Grabación, Metrología Acústica, Psicoacústica | Acústica Musical, Bioacústica, Reconocimiento y Síntesis de Voz, Ruido y Vibraciones |
| Computación | Arquitectura de Computadoras, Ingeniería de Software, Lenguajes de Internet, Redes LAN | Aplicación de Redes de Computadora, Agentes Inteligentes Expertos, Sistemas en Tiempo Real, Visión por Computadora |
| Electrónica | Instrumentación I, Instrumentación II, Electrónica de Potencia I, Transmisores | Electrónica de Potencia II, Instrumentación III, Receptores, Televisión y Video |
| Comunicaciones | Electrónica Analógica de Comunicaciones, Comunicaciones por Medio de Fibra Óptica, Redes de Área Amplia, Teoría de la Codificación y Manejo de la Información | Diseño y Administración de Redes, Redes Convergentes, Sincronización y Multiplexaje, Sistemas de Radiocomunicación |
| Control | Control Analógico: Servomecanismos, Control con Uso de PLC, Control Digital, Instrumentación de Procesos | Control No Distribuido, Control Inteligente, Sistemas No Lineales, Sistemas de Adquisición de Datos |

La carga se hará con un `UPDATE` por **nombre exacto, plan y semestre** (nunca por parecido de texto), y una verificación posterior de que se actualizaron exactamente 80 filas (40 teoría y 40 laboratorio) cuando las tres variantes estén resueltas.

**Plan 2024:** el catálogo solo llega al semestre 5, así que las 40 optativas del PDF no existen en él. Quedan pendientes. No se insertan filas inventadas: se cargarán cuando haya un horario que las incluya.

## 6. Audiencia de publicaciones

Hoy el JSON de audiencia admite `grupos` (modelo antiguo) y `unidadesOferta`. Propuesta:

| Campo | Regla de lectura | Quién puede elegirlo al publicar |
|---|---|---|
| `unidadesOferta` | Sin cambios | Sin cambios |
| `gruposOferta` (nuevo, ids de `ofertagrupos`) | El alumno tiene al menos una suscripción activa en una unidad de ese grupo; el docente, una solicitud aprobada en una unidad del grupo | Administrador: cualquiera activo. Docente: solo grupos donde tiene una unidad aprobada |
| `academias` (nuevo, ids de `academias`) | El alumno tiene una suscripción activa en una unidad cuya materia del catálogo pertenece a esa academia; el docente, una aprobada en una de ellas | Administrador: cualquiera. Docente: solo academias donde tiene una unidad aprobada |
| `grupos` (antiguo) | **Se sigue leyendo. Si trae ids, la publicación solo la ven el Administrador y el autor** | Ya no se acepta en publicaciones nuevas |

Punto de seguridad: no basta con dejar de leer `grupos`. Una publicación antigua con `grupos` y roles generales pasaría a ser pública si el campo se ignorara. Por eso se conserva el análisis del campo y se **cierra el acceso** (mismo criterio que ya aplica el servicio al JSON corrupto). Esto afecta solo a datos antiguos, y la base de producción (`noti_ice_produccion`) no tiene ninguno.

Cambios en `AudienciaAccesoService`: `PrepararGruposAsync` calcula `_gruposOfertaValidos` y `_academiasValidas` con una consulta por usuario (alumno y docente); `PuedePublicarParaGruposAsync` se sustituye por validadores de `gruposOferta` y `academias`, con los mismos topes (máximo 30, sin repetidos, ids positivos). Los controladores de noticias, eventos y documentos cambian solo la llamada de validación. Las notificaciones por correo reutilizan `PuedeVer`, así que heredan la regla.

## 7. Cambios por capa

**Backend**
- Añadir: llave `idAcademia` en `CatalogoMateriaPlan` y su configuración en `PortalNoticiasContext`; exponer la academia en `CatalogoAcademicoController` y en la oferta; nuevos validadores de audiencia.
- Adaptar `AcademiasController` (sin la relación con `Materia`).
- Retirar: `Grupo`, `Materia`, `GrupoTipo`, `GrupoAlumno`, `GruposController`, `MateriasController`, `GruposTiposController`, sus DTOs y los `DbSet` y configuraciones asociados.
- Chatbot: sin cambios obligatorios (ya usa solo la oferta). Una consulta por academia, por ejemplo «optativas de acústica», sería una mejora posterior.

**Frontend**
- Retirar: `AdminGrupos`, `AdminInscripciones`, `AdminMaterias`, `AdminTiposGrupos`, `MisGruposDocentes`, sus servicios, su almacenamiento en modo local (`academicoStorage`), rutas y accesos del panel de administración.
- Conservar y ajustar `AdminAcademias`.
- `AudienceFields.jsx`: reemplazar el bloque «Grupos destinatarios» por «Grupos de horario» y «Academias».
- Mostrar la academia en el catálogo y en el detalle de una optativa.

**Tesis**
- Capítulo 3: 19 tablas en lugar de 23; las secciones 3.3.3 y 3.9 se reescriben sobre un solo modelo; la figura 3.3 (entidad-relación de la oferta) pasa a incluir `academias`.
- Se elimina de los textos la convivencia de dos modelos.

## 8. Fases y verificación

| Fase | Contenido | Quién ejecuta | Reversible |
|---|---|---|---|
| 0 | Respaldo de la base local y consulta de plan (sección 4.2) | Usuario | — |
| 1 | Normalizar `2004` a `2003` si procede | Usuario (script) | Con respaldo |
| 2 | `ALTER` del catálogo, carga de 5 academias y asignación de 80 filas | Usuario (script) | Sí: la columna acepta vacío |
| 3 | Backend: audiencia nueva con compatibilidad de `grupos`; compilar y correr `Intervencion1.Checks` y `ChatbotLimits.Checks` | Claude | Sí (Git) |
| 4 | Frontend: formulario de audiencia y panel de administración; `npm run lint` y `npm run build -- --mode ollama` | Claude | Sí (Git) |
| 5 | Retirar código del modelo antiguo | Claude | Sí (Git) |
| 6 | Script que elimina las 4 tablas antiguas | Usuario | No: solo con respaldo |

Las fases 0 a 2 son de datos y no dependen del código; las 3 a 5 se pueden revisar con `git diff` antes de integrarse.

## 9. Decisiones abiertas

1. **Tipo de grupo `1CV1`.** El contexto del proyecto indica que se decidió conservarlo. En el modelo nuevo equivale a un código de grupo (`ofertagrupos.CodigoGrupo`) y existiría solo si el horario lo trae. Confirmar si se acepta retirarlo con `grupostipos`.
2. **Las tres variantes de nombre** de la sección 5.
3. **Listado de alumnos de un grupo.** El modelo antiguo lo daba a Docente y Administrador. El nuevo solo muestra el número de alumnos suscritos. Como las suscripciones del portal no son inscripciones oficiales, recomiendo **no** replicar el listado nominal; confirmar.
4. **Inscripción de alumnos hecha por un Administrador** (modelo antiguo). Recomiendo no replicarla: el alumno se suscribe solo.
5. **Plan 2024:** se pospone hasta contar con un horario que incluya los semestres 6 a 9.
6. **Unidad Culhuacán:** fuera de alcance por ahora.
7. **Retiro de tablas:** ejecutar la fase 6 de inmediato o dejarla como último paso, después de la defensa y de pruebas en el VPS.
