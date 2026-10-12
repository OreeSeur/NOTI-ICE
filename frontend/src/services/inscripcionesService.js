import { get } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";

export const obtenerMisInscripciones = () =>
  get(ENDPOINTS.gruposMisInscripciones);
