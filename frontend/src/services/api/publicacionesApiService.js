import { buildEndpoint, ENDPOINTS, withId } from "../../api/endpoints";
import { createResourceClient } from "../../api/resourceClient";
import { get, put } from "../../api/apiClient";

export const noticiasApi = createResourceClient(ENDPOINTS.noticias);
export const eventosApi = createResourceClient(ENDPOINTS.eventos);
export const documentosApi = createResourceClient(ENDPOINTS.documentos);
export const publicacionesApi = createResourceClient(ENDPOINTS.publicaciones);

export const obtenerPublicacionesParaMiApi = (params = {}) =>
  get(buildEndpoint(`${ENDPOINTS.publicaciones}/para-mi`, params));

export const obtenerPublicacionesDocenteApi = (docenteId, params = {}) =>
  get(buildEndpoint(`${ENDPOINTS.publicaciones}/docente/${docenteId}`, params));

export const notificacionesApi = {
  list: (params) => get(buildEndpoint(ENDPOINTS.notificaciones, params)),
  marcarLeida: (id) => put(`${withId(ENDPOINTS.notificaciones, id)}/leer`, {}),
  marcarNoLeida: (id) => put(`${withId(ENDPOINTS.notificaciones, id)}/no-leida`, {}),
  marcarTodasLeidas: () => put(`${ENDPOINTS.notificaciones}/marcar-todas-leidas`, {}),
};
