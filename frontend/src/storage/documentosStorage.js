import { documentos as documentosIniciales } from "../data/documentos";
import { obtenerItem, guardarItem } from "./localStorage";
import { STORAGE_KEYS } from "./storageKeys";

export const obtenerDocumentosStorage = () =>
  obtenerItem(STORAGE_KEYS.DOCUMENTOS, documentosIniciales);

export const guardarDocumentosStorage = (documentos) =>
  guardarItem(STORAGE_KEYS.DOCUMENTOS, documentos);
