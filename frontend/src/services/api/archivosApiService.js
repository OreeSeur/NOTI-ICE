import { ENDPOINTS, withId } from "../../api/endpoints";
import { apiClient, remove } from "../../api/apiClient";

export const subirArchivoApi = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient(`${ENDPOINTS.archivos}/upload`, {
    method: "POST",
    body: formData,
    headers: {},
  });
};

export const eliminarArchivoApi = (id) => remove(withId(ENDPOINTS.archivos, id));
