import { get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS, withId } from "../api/endpoints";

// Catálogo oficial de materias almacenado en MySQL mediante la API.
export const obtenerMaterias = () => get(ENDPOINTS.materias);
export const crearMateria = (datos) => post(ENDPOINTS.materias, datos);
export const actualizarMateria = (id, datos) =>
  put(withId(ENDPOINTS.materias, id), datos);
export const desactivarMateria = (id) =>
  remove(withId(ENDPOINTS.materias, id));
