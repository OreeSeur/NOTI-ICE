import { ENDPOINTS } from "../../api/endpoints";
import { get, post } from "../../api/apiClient";
import { clearAuthToken, setAuthToken } from "../../api/authToken";

export const loginApi = async (credentials) => {
  const response = await post(ENDPOINTS.auth.login, credentials);

  if (response?.token) {
    setAuthToken(response.token);
  }

  return response;
};

export const obtenerUsuarioActualApi = () => get(ENDPOINTS.auth.me);

export const logoutApi = async () => {
  try {
    await post(ENDPOINTS.auth.logout, {});
  } finally {
    clearAuthToken();
  }
};
