import { get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
import { normalizeAudience } from "../utils/audience";

// ---- Mapeo backend -> frontend ----
// El backend usa: idNoticia, titulo, contenido, fechaPublicacion, audiencia{...}
// El frontend (formularios/páginas) usa: id, titulo, fecha, descripcion, audiencia{...}
const mapNoticiaFromApi = (n) => ({
  id: n.idNoticia,
  titulo: n.titulo,
  descripcion: n.contenido,
  fecha: n.fechaPublicacion ? n.fechaPublicacion.substring(0, 10) : "",
  autor: n.autorNombre,
  idUsuario: n.idUsuario,
  categoria: n.categoriaNombre,
  idCategoria: n.idCategoria,
  activo: n.activo,
  audiencia: normalizeAudience(n.audiencia),
  createdAt: n.fechaAlta,
});

// ---- Mapeo frontend -> backend ----
const mapNoticiaToApi = (n, idUsuario, fechaPublicacion) => ({
  titulo: n.titulo,
  contenido: n.descripcion,
  idUsuario,
  idCategoria: n.idCategoria ?? null,
  fechaPublicacion,
  audiencia: normalizeAudience(n.audiencia),
});

const hoyISO = () => new Date().toISOString().substring(0, 10);

export const obtenerNoticias = async () => {
  const data = await get(ENDPOINTS.noticias);
  return data.map(mapNoticiaFromApi);
};

// La fecha de publicación se asigna sola: es "ahora mismo", no la elige quien publica.
export const crearNoticiaApi = async (datosFormulario, idUsuario) => {
  const creada = await post(
    ENDPOINTS.noticias,
    mapNoticiaToApi(datosFormulario, idUsuario, hoyISO())
  );
  return mapNoticiaFromApi(creada);
};

// Al editar, se conserva la fecha de publicación original (fechaOriginal),
// porque el formulario ya no permite cambiarla.
export const editarNoticiaApi = async (id, datosFormulario, fechaOriginal) => {
  await put(`${ENDPOINTS.noticias}/${id}`, {
    titulo: datosFormulario.titulo,
    contenido: datosFormulario.descripcion,
    idCategoria: datosFormulario.idCategoria ?? null,
    fechaPublicacion: fechaOriginal,
    audiencia: normalizeAudience(datosFormulario.audiencia),
  });
};

export const eliminarNoticiaApi = async (id) => {
  await remove(`${ENDPOINTS.noticias}/${id}`);
};
