import { ROLES, ROLE_LABELS } from "./roles";
import { SUBSCRIPTION_TOPICS } from "./subscriptions";

export const AUDIENCE_ALL_VALUE = "todos";

export const TARGET_ROLE_OPTIONS = Object.freeze([
  { value: AUDIENCE_ALL_VALUE, label: "Todos los roles" },
  { value: ROLES.ALUMNO, label: ROLE_LABELS[ROLES.ALUMNO] },
  { value: ROLES.DOCENTE, label: ROLE_LABELS[ROLES.DOCENTE] },
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
]);

export const CAREER_OPTIONS = Object.freeze([
  { value: AUDIENCE_ALL_VALUE, label: "Todas las carreras/áreas" },
  { value: "ingenieria-en-computacion", label: "Ingeniería en Computación" },
  { value: "comunicaciones-y-electronica", label: "Comunicaciones y Electrónica" },
  { value: "sistemas-automotrices", label: "Sistemas Automotrices" },
  { value: "control-y-automatizacion", label: "Control y Automatización" },
  { value: "servicios-escolares", label: "Servicios Escolares" },
  { value: "administracion", label: "Administración" },
]);

export const SEMESTER_OPTIONS = Object.freeze([
  { value: AUDIENCE_ALL_VALUE, label: "Todos los semestres" },
  ...Array.from({ length: 9 }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}° semestre`,
  })),
]);

export const TARGET_CATEGORY_OPTIONS = Object.freeze([
  { value: AUDIENCE_ALL_VALUE, label: "Todas las categorías" },
  ...SUBSCRIPTION_TOPICS.map((topic) => ({
    value: topic.value,
    label: topic.label,
  })),
  { value: "tramites", label: "Trámites" },
  { value: "convocatorias", label: "Convocatorias" },
  { value: "urgente", label: "Urgente" },
]);

export const PRIORITY_OPTIONS = Object.freeze([
  { value: "baja", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
]);

export const DEFAULT_AUDIENCE = Object.freeze({
  roles: [AUDIENCE_ALL_VALUE],
  carreras: [AUDIENCE_ALL_VALUE],
  semestres: [AUDIENCE_ALL_VALUE],
  categorias: [AUDIENCE_ALL_VALUE],
  prioridad: "normal",
});
