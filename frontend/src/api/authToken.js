import { appConfig } from "../config/appConfig";

const canUseStorage = () => typeof window !== "undefined" && window.sessionStorage;

export const getAuthToken = () => {
  if (!canUseStorage()) return null;
  return window.sessionStorage.getItem(appConfig.authTokenKey);
};

export const setAuthToken = (token) => {
  if (!canUseStorage()) return;

  if (!token) {
    window.sessionStorage.removeItem(appConfig.authTokenKey);
    return;
  }

  window.sessionStorage.setItem(appConfig.authTokenKey, token);
};

export const clearAuthToken = () => setAuthToken(null);
