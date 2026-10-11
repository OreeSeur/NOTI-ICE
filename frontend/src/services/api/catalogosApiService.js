import { createResourceClient } from "../../api/resourceClient";
import { ENDPOINTS } from "../../api/endpoints";

export const usuariosApi = createResourceClient(ENDPOINTS.usuarios);
export const materiasApi = createResourceClient(ENDPOINTS.materias);
export const gruposApi = createResourceClient(ENDPOINTS.grupos);
export const asignacionesDocentesApi = createResourceClient(
  ENDPOINTS.asignacionesDocentes
);
