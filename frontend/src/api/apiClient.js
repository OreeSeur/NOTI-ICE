import axios from "axios";
import { appConfig } from "../config/appConfig";
import { getAuthToken, clearAuthToken } from "./authToken";
import { eliminarUsuarioSesion } from "../storage/authStorage";
import { ApiError } from "./apiError";

const normalizeBaseUrl = (url) => String(url || "").replace(/\/$/, "");

// Instancia de Axios centralizada: toda petición al backend pasa por aquí
const axiosInstance = axios.create({
  baseURL: normalizeBaseUrl(appConfig.apiUrl),
});

// Interceptor de petición: agrega el token JWT automáticamente si existe
axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta: normaliza los errores de Axios a nuestra clase ApiError
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data ?? null;
    const message =
      data?.mensaje ||
      data?.message ||
      data?.title ||
      error.message ||
      `Error HTTP ${status} al consultar el servidor.`;

    // El token ya no es válido (expiró, cambió la Key del servidor, etc.):
    // cerramos sesión localmente y mandamos al login, en vez de dejar
    // al usuario atorado viendo un 401 sin saber qué pasó.
    if (status === 401) {
      clearAuthToken();
      eliminarUsuarioSesion();
      if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(new ApiError(message, status, data));
  }
);

export const apiClient = (path, options = {}) => {
  const { body, method = "GET", headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  return axiosInstance.request({
    url: path,
    method,
    data: body,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...rest,
  });
};

export const get = (path) => apiClient(path, { method: "GET" });
export const post = (path, body) => apiClient(path, { method: "POST", body });
export const put = (path, body) => apiClient(path, { method: "PUT", body });
export const patch = (path, body) => apiClient(path, { method: "PATCH", body });
export const remove = (path) => apiClient(path, { method: "DELETE" });
