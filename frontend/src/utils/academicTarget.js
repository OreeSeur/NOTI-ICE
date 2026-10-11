import { getPlanLabel } from "../constants/academic";

export const getAcademicTarget = (item = {}) => item?.academicTarget || null;

export const hasAcademicTarget = (item = {}) => Boolean(getAcademicTarget(item));

export const getAcademicTargetSummary = (itemOrTarget = {}) => {
  const target = itemOrTarget?.academicTarget || itemOrTarget || {};

  return {
    profesor: target.profesorNombre || target.docenteNombre || "Profesor no especificado",
    materia: target.materiaNombre || "Materia no especificada",
    grupo: target.grupoNombre || "Grupo no especificado",
    plan: target.plan ? getPlanLabel(target.plan) : "Plan no especificado",
    periodo: target.periodo || "Periodo no especificado",
    semestre: target.semestre || "Semestre no especificado",
    turno: target.turno || "Turno no especificado",
  };
};

export const getAcademicTargetShortLabel = (itemOrTarget = {}) => {
  const summary = getAcademicTargetSummary(itemOrTarget);

  return `${summary.materia} · ${summary.grupo}`;
};

export const buildAcademicTargetSearchText = (itemOrTarget = {}) => {
  const target = itemOrTarget?.academicTarget || itemOrTarget || {};
  const summary = getAcademicTargetSummary(target);

  return [
    summary.profesor,
    summary.materia,
    summary.grupo,
    summary.plan,
    summary.periodo,
    summary.semestre,
    summary.turno,
    target.profesorId,
    target.materiaId,
    target.grupoId,
  ]
    .filter(Boolean)
    .join(" ");
};
