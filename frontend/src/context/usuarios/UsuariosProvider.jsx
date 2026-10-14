import { useCallback, useEffect, useMemo, useState } from "react";

import { ROLES, normalizeRole } from "../../constants/roles";
import { useAuth } from "../auth/useAuth";
import { obtenerUsuarios } from "../../services/usuariosService";
import {
  obtenerUsuariosAdministrativos,
  crearUsuarioAdministrativo,
  editarUsuarioAdministrativo,
  desactivarUsuarioAdministrativo,
} from "../../services/adminUsuariosService";
import { UsuariosContext } from "./UsuariosContext";

export const UsuariosProvider = ({ children }) => {
  const { user } = useAuth();
  const esAdmin = normalizeRole(user?.rol) === ROLES.ADMIN;
  const sesion = esAdmin ? String(user.id) : null;

  // El perfil académico heredado todavía utiliza catálogos locales.
  // No se mezclan con la administración real de usuarios de MySQL.
  const usuariosAcademicosLocales = useMemo(() => obtenerUsuarios(), []);
  const [consulta, setConsulta] = useState({ sesion: null, usuarios: [], error: "" });
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (!esAdmin) return undefined;
    let vigente = true;
    obtenerUsuariosAdministrativos()
      .then((usuarios) => {
        if (vigente) setConsulta({ sesion, usuarios, error: "" });
      })
      .catch((fallo) => {
        if (vigente) setConsulta({ sesion, usuarios: [], error: fallo.message || "No se pudieron consultar los usuarios." });
      });
    return () => { vigente = false; };
  }, [esAdmin, sesion]);

  const recargarUsuarios = useCallback(async () => {
    if (!esAdmin) throw new Error("Se requiere una sesión de administrador.");
    setActualizando(true);
    try {
      const usuarios = await obtenerUsuariosAdministrativos();
      setConsulta({ sesion, usuarios, error: "" });
      return usuarios;
    } catch (fallo) {
      setConsulta({ sesion, usuarios: [], error: fallo.message || "No se pudo cargar el listado." });
      throw fallo;
    } finally {
      setActualizando(false);
    }
  }, [esAdmin, sesion]);

  const agregarUsuario = useCallback(async (datos) => {
    if (!esAdmin) throw new Error("No autorizado.");
    await crearUsuarioAdministrativo(datos);
    await recargarUsuarios();
  }, [esAdmin, recargarUsuarios]);

  const editarUsuario = useCallback(async (id, datos) => {
    if (!esAdmin) throw new Error("No autorizado.");
    await editarUsuarioAdministrativo(id, datos);
    await recargarUsuarios();
  }, [esAdmin, recargarUsuarios]);

  const eliminarUsuario = useCallback(async (id) => {
    if (!esAdmin) throw new Error("No autorizado.");
    if (String(id) === sesion) throw new Error("No puedes desactivar tu propia cuenta desde esta pantalla.");
    await desactivarUsuarioAdministrativo(id);
    await recargarUsuarios();
  }, [esAdmin, recargarUsuarios, sesion]);

  const sesionCargada = esAdmin && consulta.sesion === sesion;
  const usuarios = useMemo(() => {
    if (esAdmin) return sesionCargada ? consulta.usuarios : [];
    return user ? usuariosAcademicosLocales : [];
  }, [esAdmin, sesionCargada, consulta.usuarios, user, usuariosAcademicosLocales]);
  const cargando = esAdmin && !sesionCargada;
  const errorCarga = esAdmin && sesionCargada ? consulta.error : "";

  const value = useMemo(() => ({
    usuarios,
    cargando,
    actualizando,
    errorCarga,
    recargarUsuarios,
    agregarUsuario,
    editarUsuario,
    eliminarUsuario,
  }), [usuarios, cargando, actualizando, errorCarga, recargarUsuarios,
    agregarUsuario, editarUsuario, eliminarUsuario]);

  return <UsuariosContext.Provider value={value}>{children}</UsuariosContext.Provider>;
};
