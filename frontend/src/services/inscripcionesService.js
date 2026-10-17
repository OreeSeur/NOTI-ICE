import { get, post, remove } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";

export const obtenerMisInscripciones = () =>
  get(ENDPOINTS.gruposMisInscripciones);

export const obtenerGruposParaInscripcion = () => get(ENDPOINTS.grupos);

// Solo se envía el grupo. El backend identifica al alumno con su JWT.
export const inscribirmeEnGrupo = (idGrupo) =>
  post(`${ENDPOINTS.grupos}/inscribir-me`, { idGrupo });

export const desinscribirmeDeGrupo = (idGrupo) =>
  remove(`${ENDPOINTS.grupos}/desinscribir-me/${encodeURIComponent(idGrupo)}`);
