import { eventos as eventosIniciales } from "../data/eventos";
import { obtenerItem, guardarItem } from "./localStorage";
import { STORAGE_KEYS } from "./storageKeys";

export const obtenerEventosStorage = () =>
  obtenerItem(STORAGE_KEYS.EVENTOS, eventosIniciales);

export const guardarEventosStorage = (eventos) =>
  guardarItem(STORAGE_KEYS.EVENTOS, eventos);
