# Flujo académico

## Objetivo

El sistema busca que los alumnos reciban contenido relevante según las materias que cursan, el grupo correspondiente, el plan de estudios y el periodo.

## Conceptos principales

### Plan de estudios

El sistema trabaja con dos planes:

- Plan 2003
- Plan 2024

Las materias están separadas por plan, semestre y tipo.

### Materia

Representa una unidad de aprendizaje del plan correspondiente.

Campos importantes en frontend:

- `id`
- `nombre`
- `plan`
- `semestre`
- `tipo`
- `opcion`
- `carrera`

### Grupo

Los grupos usan nomenclatura real:

```text
6CV1
3CM2
1CM12
```

Interpretación:

```text
6  → semestre
CV → vespertino
1  → número de grupo
```

Turnos:

| Código | Turno |
|---|---|
| CM | Matutino |
| CV | Vespertino |

### Asignación docente

Relaciona:

```text
Docente + Materia + Grupo + Plan + Periodo
```

Sirve para saber qué profesor imparte una materia en un grupo específico.

### Suscripción académica del alumno

El alumno no queda limitado a un solo grupo general.

Puede tener varias suscripciones:

```text
Materia A → Grupo 2CM1 → Plan 2024 → Periodo 2026-1
Materia B → Grupo 6CV1 → Plan 2024 → Periodo 2026-1
Materia C → Grupo 4CM2 → Plan 2003 → Periodo 2026-1
```

Esto representa el caso real donde un alumno cursa materias de distintos semestres o grupos en el mismo periodo.

## Flujo alumno

```text
Alumno selecciona plan
        ↓
Selecciona materia
        ↓
El sistema detecta semestre
        ↓
Selecciona grupo compatible
        ↓
Selecciona periodo
        ↓
Agrega suscripción académica
```

El alumno puede eliminar suscripciones si da de baja una materia.

## Flujo docente

```text
Docente selecciona plan
        ↓
Selecciona materia
        ↓
El sistema detecta semestre
        ↓
Selecciona grupo compatible
        ↓
Selecciona periodo
        ↓
Guarda asignación
```

El docente puede quitar asignaciones si deja de impartir una materia.

## Publicaciones académicas

Cuando el docente publica, la publicación debe incluir:

- Profesor
- Materia
- Grupo
- Plan
- Periodo
- Semestre
- Turno

El alumno debe ver esos datos en avisos, eventos, documentos y notificaciones.

## Regla de recepción

Una publicación docente debe mostrarse al alumno sólo si coincide con alguna de sus suscripciones académicas:

```text
Plan + Materia + Grupo + Periodo
```

## Revisión administrativa

El módulo `/admin/academico` permite revisar:

- Docentes con asignación.
- Alumnos con materias inscritas.
- Publicaciones docentes.
- Inconsistencias académicas.
