import { PERIODOS_ACADEMICOS } from "../constants/academic";

export const DEFAULT_ACADEMIC_PROFILE = Object.freeze({
  plan: "2024",
  periodo: PERIODOS_ACADEMICOS[0],
  grupoId: "",
  materiasIds: [],
  inscripciones: [],
});

const normalizeId = (value) => (value === undefined || value === null ? "" : String(value));

export const getInscripcionKey = (inscripcion = {}) =>
  [
    inscripcion.plan,
    inscripcion.periodo,
    inscripcion.materiaId,
    inscripcion.grupoId,
  ]
    .map((value) => normalizeId(value).trim())
    .join("::");

export const normalizeAcademicEnrollment = (inscripcion = {}, index = 0) => ({
  id:
    normalizeId(inscripcion.id) ||
    getInscripcionKey(inscripcion) ||
    `inscripcion-${index + 1}`,
  plan: normalizeId(inscripcion.plan || "2024"),
  periodo: normalizeId(inscripcion.periodo || PERIODOS_ACADEMICOS[0]),
  materiaId: normalizeId(inscripcion.materiaId),
  grupoId: normalizeId(inscripcion.grupoId),
  semestre: inscripcion.semestre || "",
  semestreNumero: inscripcion.semestreNumero || null,
  carrera: inscripcion.carrera || "",
  createdAt: inscripcion.createdAt || new Date().toISOString(),
});

const buildLegacyEnrollments = (profile = {}) => {
  const materiasIds = Array.isArray(profile?.materiasIds)
    ? profile.materiasIds.map(String)
    : [];

  if (!profile?.grupoId || materiasIds.length === 0) return [];

  return materiasIds.map((materiaId, index) =>
    normalizeAcademicEnrollment(
      {
        id: `legacy-${profile.plan || "2024"}-${profile.periodo || PERIODOS_ACADEMICOS[0]}-${materiaId}-${profile.grupoId}`,
        plan: profile.plan || "2024",
        periodo: profile.periodo || PERIODOS_ACADEMICOS[0],
        materiaId,
        grupoId: profile.grupoId,
        createdAt: profile.createdAt,
      },
      index
    )
  );
};

const dedupeEnrollments = (inscripciones = []) => {
  const seen = new Set();

  return inscripciones.filter((inscripcion) => {
    const key = getInscripcionKey(inscripcion);
    if (!key || key.includes("::::")) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeAcademicProfile = (profile = {}) => {
  const directEnrollments = Array.isArray(profile?.inscripciones)
    ? profile.inscripciones.map(normalizeAcademicEnrollment)
    : [];
  const legacyEnrollments = buildLegacyEnrollments(profile);
  const inscripciones = dedupeEnrollments([...directEnrollments, ...legacyEnrollments]);
  const firstEnrollment = inscripciones[0];
  const materiasIds = inscripciones.length
    ? [...new Set(inscripciones.map((inscripcion) => String(inscripcion.materiaId)).filter(Boolean))]
    : Array.isArray(profile?.materiasIds)
      ? profile.materiasIds.map(String)
      : [];

  return {
    ...DEFAULT_ACADEMIC_PROFILE,
    ...profile,
    plan: profile?.plan || firstEnrollment?.plan || DEFAULT_ACADEMIC_PROFILE.plan,
    periodo: profile?.periodo || firstEnrollment?.periodo || DEFAULT_ACADEMIC_PROFILE.periodo,
    grupoId: profile?.grupoId || firstEnrollment?.grupoId || "",
    materiasIds,
    inscripciones,
  };
};

export const getMateriaById = (materias = [], materiaId) =>
  materias.find((materia) => String(materia.id) === String(materiaId));

export const getGrupoById = (grupos = [], grupoId) =>
  grupos.find((grupo) => String(grupo.id) === String(grupoId));

export const getUsuarioById = (usuarios = [], usuarioId) =>
  usuarios.find((usuario) => String(usuario.id) === String(usuarioId));

export const getMateriasPorPlanYSemestre = ({ materias = [], plan, semestreNumero }) =>
  materias
    .filter((materia) => String(materia.plan) === String(plan))
    .filter((materia) =>
      semestreNumero ? Number(materia.semestreNumero) === Number(semestreNumero) : true
    )
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

export const getMateriasPorPlan = ({ materias = [], plan }) =>
  materias
    .filter((materia) => String(materia.plan) === String(plan))
    .sort((a, b) => {
      const semestre = (a.semestreNumero || 99) - (b.semestreNumero || 99);
      if (semestre !== 0) return semestre;
      return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
    });

export const getGruposOrdenados = (grupos = []) =>
  [...grupos].sort((a, b) => {
    const semestre = (a.semestreNumero || 99) - (b.semestreNumero || 99);
    if (semestre !== 0) return semestre;

    const turno = String(a.turnoCodigo || "").localeCompare(String(b.turnoCodigo || ""));
    if (turno !== 0) return turno;

    return (a.numeroGrupo || 99) - (b.numeroGrupo || 99);
  });

export const getGruposCompatiblesConMateria = ({ grupos = [], materia }) => {
  if (!materia) return [];

  return getGruposOrdenados(
    grupos.filter(
      (grupo) =>
        grupo.carrera === materia.carrera &&
        Number(grupo.semestreNumero) === Number(materia.semestreNumero)
    )
  );
};

export const getAsignacionesPorDocente = ({ asignaciones = [], docenteId }) =>
  asignaciones.filter((asignacion) => String(asignacion.profesorId) === String(docenteId));

export const getAsignacionesPorMateriaGrupo = ({
  asignaciones = [],
  materiaId,
  grupoId,
  plan,
  periodo = "",
}) =>
  asignaciones.filter((asignacion) => {
    const matchesMateria = String(asignacion.materiaId) === String(materiaId);
    const matchesGrupo = String(asignacion.grupoId) === String(grupoId);
    const matchesPlan = !plan || String(asignacion.plan) === String(plan);
    const matchesPeriodo = !periodo || asignacion.periodo === periodo;

    return matchesMateria && matchesGrupo && matchesPlan && matchesPeriodo;
  });

export const existeAsignacionDocente = ({
  asignaciones = [],
  profesorId,
  materiaId,
  grupoId,
  plan,
  periodo,
}) =>
  asignaciones.some(
    (asignacion) =>
      String(asignacion.profesorId) === String(profesorId) &&
      String(asignacion.materiaId) === String(materiaId) &&
      String(asignacion.grupoId) === String(grupoId) &&
      String(asignacion.plan) === String(plan) &&
      asignacion.periodo === periodo
  );

export const buildAsignacionDetalle = ({ asignacion, materias = [], grupos = [], usuarios = [] }) => {
  const materia = getMateriaById(materias, asignacion.materiaId);
  const grupo = getGrupoById(grupos, asignacion.grupoId);
  const profesor = getUsuarioById(usuarios, asignacion.profesorId);

  return {
    ...asignacion,
    materia,
    grupo,
    profesor,
    materiaNombre: materia?.nombre || "Materia no encontrada",
    grupoNombre: grupo?.nombre || "Grupo no encontrado",
    profesorNombre: profesor?.nombre || "Docente no encontrado",
    profesorCorreo: profesor?.correo || "",
    semestre: grupo?.semestre || materia?.semestre || "Sin semestre",
    semestreNumero: grupo?.semestreNumero || materia?.semestreNumero || null,
    turno: grupo?.turno || "Sin turno",
  };
};

export const buildInscripcionDetalle = ({ inscripcion, materias = [], grupos = [], asignaciones = [], usuarios = [] }) => {
  const materia = getMateriaById(materias, inscripcion.materiaId);
  const grupo = getGrupoById(grupos, inscripcion.grupoId);
  const docentes = getAsignacionesPorMateriaGrupo({
    asignaciones,
    materiaId: inscripcion.materiaId,
    grupoId: inscripcion.grupoId,
    plan: inscripcion.plan,
    periodo: inscripcion.periodo,
  }).map((asignacion) => buildAsignacionDetalle({ asignacion, materias, grupos, usuarios }));

  return {
    ...inscripcion,
    materia,
    grupo,
    docentes,
    materiaNombre: materia?.nombre || "Materia no encontrada",
    grupoNombre: grupo?.nombre || "Grupo no encontrado",
    semestre: grupo?.semestre || materia?.semestre || "Sin semestre",
    semestreNumero: grupo?.semestreNumero || materia?.semestreNumero || null,
    turno: grupo?.turno || "Sin turno",
  };
};

export const buildInscripcionesDetalle = ({ inscripciones = [], materias = [], grupos = [], asignaciones = [], usuarios = [] }) =>
  inscripciones
    .map((inscripcion) =>
      buildInscripcionDetalle({ inscripcion, materias, grupos, asignaciones, usuarios })
    )
    .sort((a, b) => {
      const periodo = String(b.periodo || "").localeCompare(String(a.periodo || ""));
      if (periodo !== 0) return periodo;
      const semestre = (a.semestreNumero || 99) - (b.semestreNumero || 99);
      if (semestre !== 0) return semestre;
      return String(a.materiaNombre || "").localeCompare(String(b.materiaNombre || ""), "es");
    });

export const getAcademicProfileOverview = ({ profile, grupos = [], materias = [] }) => {
  const normalizedProfile = normalizeAcademicProfile(profile);
  const inscripciones = normalizedProfile.inscripciones;

  if (inscripciones.length === 0) {
    const grupo = getGrupoById(grupos, normalizedProfile.grupoId);
    return {
      plan: normalizedProfile.plan,
      grupo: grupo?.nombre || "No definido",
      semestre: grupo?.semestre || "No definido",
      materias: normalizedProfile.materiasIds.length,
    };
  }

  const planes = [...new Set(inscripciones.map((item) => item.plan).filter(Boolean))];
  const gruposNombres = [
    ...new Set(
      inscripciones
        .map((item) => getGrupoById(grupos, item.grupoId)?.nombre)
        .filter(Boolean)
    ),
  ];
  const semestres = [
    ...new Set(
      inscripciones
        .map((item) => {
          const grupo = getGrupoById(grupos, item.grupoId);
          const materia = getMateriaById(materias, item.materiaId);
          return grupo?.semestre || materia?.semestre;
        })
        .filter(Boolean)
    ),
  ];

  return {
    plan: planes.length === 1 ? planes[0] : `${planes.length} planes`,
    grupo:
      gruposNombres.length === 0
        ? "No definido"
        : gruposNombres.length === 1
          ? gruposNombres[0]
          : `${gruposNombres.length} grupos`,
    semestre:
      semestres.length === 0
        ? "No definido"
        : semestres.length === 1
          ? semestres[0]
          : "Materias mixtas",
    materias: inscripciones.length,
  };
};
