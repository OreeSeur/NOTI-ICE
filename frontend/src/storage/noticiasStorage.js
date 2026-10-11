import { noticias as noticiasIniciales } from "../data/noticias";
import { obtenerItem, guardarItem } from "./localStorage";
import { STORAGE_KEYS } from "./storageKeys";

export const obtenerNoticiasStorage = () =>
  obtenerItem(STORAGE_KEYS.NOTICIAS, noticiasIniciales);

export const guardarNoticiasStorage = (noticias) =>
  guardarItem(STORAGE_KEYS.NOTICIAS, noticias);
