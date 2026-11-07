import { get, post, remove } from "../api/apiClient";

// Solicitudes de docentes para impartir materias/laboratorios de los horarios.
// El backend valida rol, propiedad y estado en cada operación; esto solo hace las llamadas.
const base = "/solicitudes-docentes";

// Docente
export const obtenerMisSolicitudes = () => get(`${base}/mias`);
export const solicitarUnidad = (idUnidadOferta) => post(base, { idUnidadOferta });
export const cancelarSolicitud = (idSolicitud) =>
  remove(`${base}/${encodeURIComponent(idSolicitud)}`);

// Administrador
export const listarSolicitudes = (estado) =>
  get(estado ? `${base}?estado=${encodeURIComponent(estado)}` : base);
export const obtenerTotalPendientes = () => get(`${base}/pendientes/total`);
export const aprobarSolicitud = (idSolicitud) =>
  post(`${base}/${encodeURIComponent(idSolicitud)}/aprobar`, {});
export const rechazarSolicitud = (idSolicitud, motivo) =>
  post(`${base}/${encodeURIComponent(idSolicitud)}/rechazar`, { motivo });
export const revocarSolicitud = (idSolicitud, motivo) =>
  post(`${base}/${encodeURIComponent(idSolicitud)}/revocar`, { motivo });

// Docente y Administrador: materias aprobadas que se pueden elegir como destinatarias.
export const obtenerDestinosPublicacion = () => get(`${base}/destinos`);

export const ESTADOS_SOLICITUD = Object.freeze({
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
  REVOCADA: "Revocada",
});

export const ESTILO_ESTADO = Object.freeze({
  Pendiente: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Aprobada: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Rechazada: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  Cancelada: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  Revocada: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
});

export const describirUnidad = (s) =>
  `${s.codigoGrupo} · ${s.nombrePublicado}${s.esLaboratorio ? " (laboratorio)" : ""}`;
