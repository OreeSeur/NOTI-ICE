import { get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS, withId } from "../api/endpoints";

// Operaciones oficiales de grupos e inscripciones en MySQL.
export const obtenerGrupos = () => get(ENDPOINTS.grupos);
export const crearGrupo = (datos) => post(ENDPOINTS.grupos, datos);
export const actualizarGrupo = (id, datos) =>
  put(withId(ENDPOINTS.grupos, id), datos);
export const desactivarGrupo = (id) =>
  remove(withId(ENDPOINTS.grupos, id));

export const obtenerUsuariosAcademicos = () => get(ENDPOINTS.usuarios);
export const obtenerInscritos = (idGrupo) =>
  get(`${withId(ENDPOINTS.grupos, idGrupo)}/alumnos`);
export const inscribirAlumno = (idGrupo, idUsuario) =>
  post(ENDPOINTS.gruposInscribir, { idGrupo, idUsuario });
export const desinscribirAlumno = (idGrupoAlumno) =>
  remove(`${ENDPOINTS.grupos}/desinscribir/${idGrupoAlumno}`);

export const rolAcademico = (usuario) =>
  String(usuario.rolNombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
