export const PLANES_ESTUDIO = Object.freeze(["2024", "2003"]);

export const PLAN_ESTUDIO_LABELS = Object.freeze({
  2024: "Plan 2024",
  2003: "Plan 2003",
});

export const CARRERA_ICE = "Ingeniería en Comunicaciones y Electrónica";

export const CARRERAS_ACADEMICAS = Object.freeze([
  CARRERA_ICE,
  "Ingeniería en Computación",
  "Ingeniería Eléctrica",
  "Ingeniería en Control y Automatización",
  "Tronco común",
]);

export const SEMESTRES_ACADEMICOS = Object.freeze([
  "1° Semestre",
  "2° Semestre",
  "3° Semestre",
  "4° Semestre",
  "5° Semestre",
  "6° Semestre",
  "7° Semestre",
  "8° Semestre",
  "9° Semestre",
]);

export const TURNOS_ACADEMICOS = Object.freeze(["Matutino", "Vespertino"]);

export const TURNOS_GRUPO = Object.freeze({
  CM: "Matutino",
  CV: "Vespertino",
});

export const PERIODOS_ACADEMICOS = Object.freeze([
  "2026-1",
  "2026-2",
  "2027-1",
]);

export const TIPOS_MATERIA = Object.freeze([
  "Obligatoria",
  "Optativa",
  "Electiva",
]);

export const OPCIONES_OPTATIVAS = Object.freeze([
  "Acústica",
  "Computación",
  "Electrónica",
  "Comunicaciones",
  "Control",
  "Cibernética / Control",
]);

export const AREAS_MATERIA = Object.freeze([
  "Matemáticas",
  "Física",
  "Programación",
  "Electrónica",
  "Comunicaciones",
  "Acústica",
  "Control",
  "Redes",
  "Gestión académica",
  "Formación institucional",
  "Optativa",
]);

export const getSemestreNumero = (semestre = "") => {
  const match = String(semestre).match(/\d+/);
  return match ? Number(match[0]) : null;
};

export const getSemestreLabel = (semestre) => {
  const numero = Number(semestre);
  return Number.isFinite(numero) ? `${numero}° Semestre` : String(semestre || "");
};

export const getPlanLabel = (plan) => PLAN_ESTUDIO_LABELS[String(plan)] || `Plan ${plan}`;
