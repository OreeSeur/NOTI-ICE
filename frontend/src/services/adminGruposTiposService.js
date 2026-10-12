import { get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS, withId } from "../api/endpoints";

// Catálogo oficial de tipos de grupos; no utiliza almacenamiento local.
export const obtenerTiposGrupos = () => get(ENDPOINTS.gruposTipos);
export const crearTipoGrupo = (datos) => post(ENDPOINTS.gruposTipos, datos);
export const actualizarTipoGrupo = (id, datos) =>
  put(withId(ENDPOINTS.gruposTipos, id), datos);
export const desactivarTipoGrupo = (id) =>
  remove(withId(ENDPOINTS.gruposTipos, id));
