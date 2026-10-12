import { apiClient, get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
import { normalizeAudience } from "../utils/audience";

// El backend guarda el archivo como "GUID_nombreOriginal.ext".
// Para mostrarlo bonito, quitamos el prefijo del GUID.
const extraerNombreArchivo = (rutaArchivo) => {
  if (!rutaArchivo) return "";
  const nombre = String(rutaArchivo).split("/").pop() || "";
  return nombre.replace(/^[0-9a-fA-F-]{36}_/, "");
};

// ---- Mapeo backend -> frontend ----
const mapDocumentoFromApi = (d) => ({
  id: d.idNoticiaDocumento,
  idUsuario: d.idUsuario,
  autor: d.autorNombre,
  titulo: d.titulo,
  descripcion: d.descripcion,
  tipo: d.tipoDocumento,
  fecha: d.fechaPublicacion ? d.fechaPublicacion.substring(0, 10) : "",
  url: d.url || "",
  archivoNombre: extraerNombreArchivo(d.rutaArchivo),
  archivoUrl: d.rutaArchivo ? `${ENDPOINTS.documentos}/${d.idNoticiaDocumento}/archivo` : "",
  activo: d.activo,
  audiencia: normalizeAudience(d.audiencia),
});

// ---- Mapeo frontend -> backend ----
// Como puede llevar un archivo real, se manda como multipart/form-data.
// La audiencia viaja como texto JSON (el backend la deserializa).
const buildFormData = (doc) => {
  const formData = new FormData();

  formData.append("titulo", doc.titulo ?? "");
  formData.append("tipoDocumento", doc.tipo ?? "");
  formData.append("descripcion", doc.descripcion ?? "");
  formData.append("audienciaJson", JSON.stringify(normalizeAudience(doc.audiencia)));

  if (doc.url) formData.append("url", doc.url);
  if (doc.fecha) formData.append("fechaPublicacion", doc.fecha);
  if (typeof File !== "undefined" && doc.archivo instanceof File) {
    formData.append("archivo", doc.archivo);
  }

  return formData;
};

export const obtenerDocumentos = async () => {
  const data = await get(ENDPOINTS.documentos);
  return data.map(mapDocumentoFromApi);
};

export const crearDocumentoApi = async (datosFormulario) => {
  const creado = await post(ENDPOINTS.documentos, buildFormData(datosFormulario));
  return mapDocumentoFromApi(creado);
};

// Si no se manda un archivo nuevo, el backend conserva el que ya tenía.
export const editarDocumentoApi = async (id, datosFormulario) => {
  await put(`${ENDPOINTS.documentos}/${id}`, buildFormData(datosFormulario));
};

export const eliminarDocumentoApi = async (id) => {
  await remove(`${ENDPOINTS.documentos}/${id}`);
};

// Archivo protegido: usa el cliente Axios que agrega Authorization automáticamente.
export const descargarArchivoDocumentoApi = async (documento) => {
  const blob = await apiClient(`${ENDPOINTS.documentos}/${documento.id}/archivo`, {
    responseType: "blob",
  });
  const urlTemporal = URL.createObjectURL(blob);
  try {
    const enlace = document.createElement("a");
    enlace.href = urlTemporal;
    enlace.download = documento.archivoNombre || "documento";
    enlace.style.display = "none";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(urlTemporal), 1000);
  }
};
