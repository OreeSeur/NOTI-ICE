export const DATA_SOURCES = Object.freeze({
  MOCK: "mock",
  API: "api",
});

const normalizeDataSource = (value) => {
  const normalized = String(value || DATA_SOURCES.MOCK).toLowerCase().trim();
  return normalized === DATA_SOURCES.API ? DATA_SOURCES.API : DATA_SOURCES.MOCK;
};

export const appConfig = Object.freeze({
  dataSource: normalizeDataSource(import.meta.env.VITE_DATA_SOURCE),
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  authTokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || "noti_ice_auth_token",
  // Vite incorpora este valor al compilar. Deshabilitado salvo VITE_CHATBOT_ENABLED=true explícito.
  // Ocultar la interfaz no sustituye el bloqueo en la API.
  chatbotEnabled:
    String(import.meta.env.VITE_CHATBOT_ENABLED ?? "").trim().toLowerCase() === "true",
});

export const isMockDataSource = () => appConfig.dataSource === DATA_SOURCES.MOCK;

export const isApiDataSource = () => appConfig.dataSource === DATA_SOURCES.API;
