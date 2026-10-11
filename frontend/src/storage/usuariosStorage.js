import { usuarios as usuariosIniciales } from "../data/usuarios";
import { obtenerItem, guardarItem } from "./localStorage";
import { STORAGE_KEYS } from "./storageKeys";

export const obtenerUsuariosStorage = () =>
  obtenerItem(STORAGE_KEYS.USUARIOS, usuariosIniciales);

export const guardarUsuariosStorage = (usuarios) =>
  guardarItem(STORAGE_KEYS.USUARIOS, usuarios);
