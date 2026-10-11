import { materias as materiasIniciales } from "../data/materias";
import { grupos as gruposIniciales } from "../data/grupos";
import { asignacionesAcademicas as asignacionesIniciales } from "../data/asignacionesAcademicas";
import { obtenerItem, guardarItem } from "./localStorage";
import { STORAGE_KEYS } from "./storageKeys";

const LEGACY_MATERIA_IDS = new Set([
  "mat-poo",
  "mat-edd",
  "mat-bd",
  "mat-redes",
  "mat-circuitos",
  "mat-control",
]);

const LEGACY_GRUPO_IDS = new Set([
  "grp-3cm1",
  "grp-4cm2",
  "grp-6cv1",
  "grp-5ev2",
  "grp-3em1",
  "grp-6am1",
]);

const LEGACY_ASIGNACION_IDS = new Set(["asg-poo-3cm1", "asg-bd-6cv1"]);

const combinarPorId = (base, guardados) => {
  if (!Array.isArray(guardados)) return base;

  const elementosGuardados = guardados.filter(Boolean);
  const idsGuardados = new Set(elementosGuardados.map((item) => String(item.id)));

  return [
    ...base.filter((item) => !idsGuardados.has(String(item.id))),
    ...elementosGuardados,
  ];
};

const migrarMaterias = (guardadas) => {
  if (!Array.isArray(guardadas)) return materiasIniciales;

  const materiasPersonalizadas = guardadas
    .filter((materia) => materia?.id && !LEGACY_MATERIA_IDS.has(String(materia.id)))
    .map((materia) => ({
      ...materia,
      plan: materia.plan || "2024",
      tipo: materia.tipo || "Obligatoria",
      opcion: materia.opcion || "",
    }));

  return combinarPorId(materiasIniciales, materiasPersonalizadas);
};

const migrarGrupos = (guardados) => {
  if (!Array.isArray(guardados)) return gruposIniciales;

  const gruposPersonalizados = guardados.filter(
    (grupo) => grupo?.id && !LEGACY_GRUPO_IDS.has(String(grupo.id))
  );

  return combinarPorId(gruposIniciales, gruposPersonalizados);
};

const migrarAsignaciones = (guardadas) => {
  if (!Array.isArray(guardadas)) return asignacionesIniciales;

  const asignacionesPersonalizadas = guardadas.filter(
    (asignacion) => asignacion?.id && !LEGACY_ASIGNACION_IDS.has(String(asignacion.id))
  );

  return combinarPorId(asignacionesIniciales, asignacionesPersonalizadas);
};

export const obtenerMateriasStorage = () =>
  migrarMaterias(obtenerItem(STORAGE_KEYS.MATERIAS, null));

export const guardarMateriasStorage = (materias) =>
  guardarItem(STORAGE_KEYS.MATERIAS, materias);

export const obtenerGruposStorage = () =>
  migrarGrupos(obtenerItem(STORAGE_KEYS.GRUPOS, null));

export const guardarGruposStorage = (grupos) =>
  guardarItem(STORAGE_KEYS.GRUPOS, grupos);

export const obtenerAsignacionesStorage = () =>
  migrarAsignaciones(obtenerItem(STORAGE_KEYS.ASIGNACIONES_ACADEMICAS, null));

export const guardarAsignacionesStorage = (asignaciones) =>
  guardarItem(STORAGE_KEYS.ASIGNACIONES_ACADEMICAS, asignaciones);
