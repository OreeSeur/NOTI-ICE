import { get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
import { normalizeAudience } from "../utils/audience";

// ---- Mapeo backend -> frontend ----
const mapEventoFromApi = (e) => ({
  id: e.idEvento,
  titulo: e.titulo,
  descripcion: e.descripcion,
  lugar: e.lugar,
  fecha: e.fechaInicio ? e.fechaInicio.substring(0, 10) : "",
  categoria: e.categoriaEvento,
  autor: e.organizadorNombre,
  idUsuario: e.idUsuario,
  activo: e.activo,
  audiencia: normalizeAudience(e.audiencia),
});

// ---- Mapeo frontend -> backend ----
// El formulario solo pide una fecha; la mandamos como inicio y fin del mismo día.
const mapEventoToApi = (e, idUsuario) => ({
  titulo: e.titulo,
  descripcion: e.descripcion,
  lugar: e.lugar,
  fechaInicio: e.fecha,
  fechaFin: e.fecha,
  idUsuario,
  audiencia: normalizeAudience(e.audiencia),
});

export const obtenerEventos = async () => {
  const data = await get(ENDPOINTS.eventos);
  return data.map(mapEventoFromApi);
};

export const crearEventoApi = async (datosFormulario, idUsuario) => {
  const creado = await post(ENDPOINTS.eventos, mapEventoToApi(datosFormulario, idUsuario));
  return mapEventoFromApi(creado);
};

export const editarEventoApi = async (id, datosFormulario, idUsuario) => {
  await put(`${ENDPOINTS.eventos}/${id}`, mapEventoToApi(datosFormulario, idUsuario));
};

export const eliminarEventoApi = async (id) => {
  await remove(`${ENDPOINTS.eventos}/${id}`);
};
