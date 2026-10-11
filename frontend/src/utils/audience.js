import {
  AUDIENCE_ALL_VALUE,
  CAREER_OPTIONS,
  DEFAULT_AUDIENCE,
  PRIORITY_OPTIONS,
  SEMESTER_OPTIONS,
  TARGET_CATEGORY_OPTIONS,
  TARGET_ROLE_OPTIONS,
} from "../constants/audience";
import { ROLES, getRoleLabel, normalizeRole } from "../constants/roles";
import { normalizeSearchText } from "./search";

const ensureArray = (value, fallback = [AUDIENCE_ALL_VALUE]) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.length > 0 ? value : fallback;
  return [value];
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const optionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value;

const normalizeSemestreValue = (value) => {
  if (value === undefined || value === null) return "";

  const text = normalizeSearchText(value).replace("semestre", "").trim();
  const match = text.match(/\d+/);

  return match ? match[0] : text;
};

export const normalizeAudience = (audiencia = {}) => ({
  ...DEFAULT_AUDIENCE,
  ...audiencia,
  roles: unique(ensureArray(audiencia.roles)),
  carreras: unique(ensureArray(audiencia.carreras)),
  semestres: unique(ensureArray(audiencia.semestres)),
  categorias: unique(ensureArray(audiencia.categorias)),
  prioridad: audiencia.prioridad || DEFAULT_AUDIENCE.prioridad,
});

export const getItemAudience = (item = {}) => {
  if (item.audiencia) return normalizeAudience(item.audiencia);

  return normalizeAudience({
    roles: item.destinatarios || item.destinatario || item.rolesDestino,
    carreras: item.carreras || item.carrera,
    semestres: item.semestres || item.semestre,
    categorias: item.categorias || item.categoria,
    prioridad: item.prioridad,
  });
};

const selectionIncludesAll = (values = []) => values.includes(AUDIENCE_ALL_VALUE);

const valueMatchesSelection = (values = [], value = "") => {
  if (selectionIncludesAll(values)) return true;
  if (!value) return false;

  // Las opciones de audiencia usan guiones ("comunicaciones-y-electronica") y el perfil del
  // usuario usa el nombre completo; se igualan para poder compararlos.
  const comparable = (texto) => normalizeSearchText(texto).replace(/-/g, " ");

  const normalizedValue = comparable(value);

  return values.some((selectedValue) => {
    const normalizedSelected = comparable(selectedValue);

    return (
      normalizedValue === normalizedSelected ||
      normalizedValue.includes(normalizedSelected) ||
      normalizedSelected.includes(normalizedValue)
    );
  });
};

export const canReceiveAudience = (audiencia, user) => {
  const normalizedAudience = normalizeAudience(audiencia);

  if (!user) {
    return (
      selectionIncludesAll(normalizedAudience.roles) &&
      selectionIncludesAll(normalizedAudience.carreras) &&
      selectionIncludesAll(normalizedAudience.semestres)
    );
  }

  const userRole = normalizeRole(user.rol);

  if (userRole === ROLES.ADMIN) return true;

  const matchesRole = valueMatchesSelection(normalizedAudience.roles, userRole);
  const matchesCareer = valueMatchesSelection(normalizedAudience.carreras, user.carrera);
  const profile = user.academicProfile || {};
  const enrollments = normalizeEnrollmentList(profile);
  const semesterCandidates = [
    normalizeSemestreValue(user.semestre),
    ...enrollments.map((enrollment) => normalizeSemestreValue(enrollment.semestre)),
  ].filter(Boolean);
  const matchesSemester = selectionIncludesAll(normalizedAudience.semestres)
    ? true
    : semesterCandidates.some((semester) => valueMatchesSelection(normalizedAudience.semestres, semester));

  return matchesRole && matchesCareer && matchesSemester;
};

export const getAcademicTarget = (item = {}) => item.academicTarget || null;

const normalizeEnrollmentList = (profile = {}) => {
  if (Array.isArray(profile.inscripciones) && profile.inscripciones.length > 0) {
    return profile.inscripciones.map((inscripcion) => ({
      plan: inscripcion.plan,
      periodo: inscripcion.periodo,
      materiaId: inscripcion.materiaId,
      grupoId: inscripcion.grupoId,
      semestre: inscripcion.semestre || inscripcion.semestreNumero,
      semestreNumero: inscripcion.semestreNumero,
    }));
  }

  const materiasIds = Array.isArray(profile.materiasIds)
    ? profile.materiasIds.map(String)
    : [];

  if (!profile.grupoId || materiasIds.length === 0) return [];

  return materiasIds.map((materiaId) => ({
    plan: profile.plan,
    periodo: profile.periodo,
    materiaId,
    grupoId: profile.grupoId,
  }));
};

const enrollmentMatchesAcademicTarget = (enrollment = {}, target = {}) => {
  const matchesPlan = !target.plan || String(enrollment.plan || "") === String(target.plan);
  const matchesGrupo = !target.grupoId || String(enrollment.grupoId || "") === String(target.grupoId);
  const matchesPeriodo =
    !target.periodo || !enrollment.periodo || String(enrollment.periodo) === String(target.periodo);
  const matchesMateria =
    !target.materiaId || String(enrollment.materiaId || "") === String(target.materiaId);

  return matchesPlan && matchesGrupo && matchesPeriodo && matchesMateria;
};

const userMatchesAcademicTarget = (target, user) => {
  if (!target) return true;
  if (!user) return false;

  const userRole = normalizeRole(user.rol);

  if (userRole === ROLES.ADMIN) return true;

  if (userRole === ROLES.DOCENTE) {
    return String(target.profesorId || target.docenteId || "") === String(user.id || "");
  }

  const profile = user.academicProfile || {};
  const enrollments = normalizeEnrollmentList(profile);

  return enrollments.some((enrollment) => enrollmentMatchesAcademicTarget(enrollment, target));
};

export const canReceiveItem = (item, user) => {
  const target = getAcademicTarget(item);

  if (!target) return canReceiveAudience(getItemAudience(item), user);

  const userRole = normalizeRole(user?.rol);
  const isOwnerTeacher =
    userRole === ROLES.DOCENTE &&
    String(target.profesorId || target.docenteId || "") === String(user?.id || "");

  if (isOwnerTeacher) return true;

  return canReceiveAudience(getItemAudience(item), user) && userMatchesAcademicTarget(target, user);
};

export const itemMatchesTargetCategory = (item, topicValue) => {
  const audiencia = getItemAudience(item);

  if (selectionIncludesAll(audiencia.categorias)) return false;

  return audiencia.categorias.some(
    (categoria) => normalizeSearchText(categoria) === normalizeSearchText(topicValue)
  );
};

export const getAudienceSummary = (audiencia) => {
  const normalizedAudience = normalizeAudience(audiencia);

  const roleText = selectionIncludesAll(normalizedAudience.roles)
    ? "Todos los roles"
    : normalizedAudience.roles.map((role) => getRoleLabel(role)).join(", ");

  const careerText = selectionIncludesAll(normalizedAudience.carreras)
    ? "Todas las carreras/áreas"
    : normalizedAudience.carreras
        .map((career) => optionLabel(CAREER_OPTIONS, career))
        .join(", ");

  const semesterText = selectionIncludesAll(normalizedAudience.semestres)
    ? "Todos los semestres"
    : normalizedAudience.semestres
        .map((semester) => optionLabel(SEMESTER_OPTIONS, semester))
        .join(", ");

  const categoryText = selectionIncludesAll(normalizedAudience.categorias)
    ? "Todas las categorías"
    : normalizedAudience.categorias
        .map((category) => optionLabel(TARGET_CATEGORY_OPTIONS, category))
        .join(", ");

  return {
    roles: roleText,
    carreras: careerText,
    semestres: semesterText,
    categorias: categoryText,
    prioridad: optionLabel(PRIORITY_OPTIONS, normalizedAudience.prioridad),
  };
};

export const getPriorityVariant = (prioridad = "normal") => {
  const variants = {
    baja: "default",
    normal: "info",
    alta: "warning",
    urgente: "danger",
  };

  return variants[prioridad] || "default";
};

export const getPriorityLabel = (prioridad = "normal") =>
  optionLabel(PRIORITY_OPTIONS, prioridad);

export const buildAudienceSearchText = (item) => {
  const summary = getAudienceSummary(getItemAudience(item));
  const target = getAcademicTarget(item);

  return [
    summary.roles,
    summary.carreras,
    summary.semestres,
    summary.categorias,
    summary.prioridad,
    target?.plan,
    target?.periodo,
    target?.profesorNombre,
    target?.materiaNombre,
    target?.grupoNombre,
    target?.semestre,
    target?.turno,
  ].join(" ");
};

export const getAudienceSelectOptions = () => ({
  roles: TARGET_ROLE_OPTIONS,
  carreras: CAREER_OPTIONS,
  semestres: SEMESTER_OPTIONS,
  categorias: TARGET_CATEGORY_OPTIONS,
  prioridades: PRIORITY_OPTIONS,
});
