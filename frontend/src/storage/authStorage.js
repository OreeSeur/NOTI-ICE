import { obtenerItem, guardarItem, eliminarItem } from "./sessionStorageUtil";
import { STORAGE_KEYS } from "./storageKeys";

export const obtenerUsuarioSesion = () =>
  obtenerItem(STORAGE_KEYS.USER, null);

export const guardarUsuarioSesion = (usuario) => {
  if (!usuario) {
    eliminarItem(STORAGE_KEYS.USER);
    return;
  }

  guardarItem(STORAGE_KEYS.USER, usuario);
};

export const eliminarUsuarioSesion = () =>
  eliminarItem(STORAGE_KEYS.USER);
