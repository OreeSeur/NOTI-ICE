import { CARRERA_ICE, getSemestreLabel, TURNOS_GRUPO } from "../constants/academic";

export const normalizarTextoId = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const parseGrupoNombre = (nombre = "") => {
  const valor = String(nombre).trim().toUpperCase();
  const match = valor.match(/^([1-9])(CM|CV)([1-9]|1[0-2])$/);

  if (!match) return null;

  const semestreNumero = Number(match[1]);
  const turnoCodigo = match[2];
  const numeroGrupo = Number(match[3]);

  return {
    nombre: valor,
    carrera: CARRERA_ICE,
    semestre: getSemestreLabel(semestreNumero),
    semestreNumero,
    turnoCodigo,
    turno: TURNOS_GRUPO[turnoCodigo],
    numeroGrupo,
  };
};

export const getGrupoFormatoAyuda = () =>
  "Usa el formato 1CM1 a 9CV12. Ejemplo: 3CM4 o 6CV12.";

export const crearGrupoDesdeNombre = (nombre) => {
  const datos = parseGrupoNombre(nombre);

  if (!datos) return null;

  return {
    id: `grp-${datos.nombre.toLowerCase()}`,
    ...datos,
  };
};

export const materiaCoincideConPlan = (materia, plan) =>
  !plan || String(materia.plan) === String(plan);

export const asignacionCoincideConPlan = (asignacion, materias, plan) => {
  if (!plan) return true;
  if (asignacion.plan) return String(asignacion.plan) === String(plan);

  const materia = materias.find((item) => String(item.id) === String(asignacion.materiaId));
  return materia ? String(materia.plan) === String(plan) : false;
};
