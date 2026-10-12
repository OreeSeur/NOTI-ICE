import { get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS, withId } from "../api/endpoints";

// Consultar todas las academias activas.
export const obtenerAcademias = () => {
  return get(ENDPOINTS.academias);
};

// Consultar una academia por su identificador.
export const obtenerAcademia = (id) => {
  return get(withId(ENDPOINTS.academias, id));
};

// Registrar una nueva academia.
export const crearAcademia = (datos) => {
  return post(ENDPOINTS.academias, datos);
};

// Actualizar una academia existente.
export const actualizarAcademia = (id, datos) => {
  return put(withId(ENDPOINTS.academias, id), datos);
};

// Desactivar una academia.
export const desactivarAcademia = (id) => {
  return remove(withId(ENDPOINTS.academias, id));
};
