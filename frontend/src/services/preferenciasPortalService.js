import { get, put } from "../api/apiClient";

const RUTA = "/auth/preferencias-portal";
export const obtenerPreferenciasPortal = () => get(RUTA);
export const guardarPreferenciasPortal = (preferencias) => put(RUTA, preferencias);
