import { useCallback, useEffect, useMemo, useState } from "react";

import {
  autenticarUsuario,
  registrarUsuario,
  actualizarPerfilApi,
  obtenerSesion,
  guardarSesion,
  cerrarSesion,
} from "../../services/authService";
import { hasRole, canAccessAdmin } from "../../utils/permissions";
import { normalizeSubscriptions } from "../../constants/subscriptions";
import { normalizeAcademicProfile } from "../../utils/academicProfile";
import { obtenerPreferenciasPortal, guardarPreferenciasPortal } from "../../services/preferenciasPortalService";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = obtenerSesion();

    return storedUser
      ? {
          ...storedUser,
          subscriptions: normalizeSubscriptions(storedUser.subscriptions),
          academicProfile: storedUser.academicProfile
            ? normalizeAcademicProfile(storedUser.academicProfile)
            : null,
        }
      : null;
  });

  useEffect(() => {
    guardarSesion(user);
  }, [user]);

  // Recuperar las preferencias al reabrir la aplicación o cambiar de cuenta.
  useEffect(() => {
    if (!user?.id) return;
    let activo = true;
    const id = user.id;
    obtenerPreferenciasPortal()
      .then((preferencias) => {
        if (activo) setUser((actual) => actual?.id === id
          ? { ...actual, subscriptions: normalizeSubscriptions(preferencias) } : actual);
      })
      .catch(() => { /* El resto del portal sigue funcionando si el servicio está caído. */ });
    return () => { activo = false; };
  }, [user?.id]);

  // Ahora es asíncrono porque llama al backend real.
  // Devuelve { ok: true } o { ok: false, mensaje } en vez de solo true/false,
  // para poder mostrar el motivo real del rechazo (ej. "Correo o contraseña incorrectos").
  const login = useCallback(async (correo, password) => {
    try {
      const usuario = await autenticarUsuario(correo, password);
      setUser({
        ...usuario,
        subscriptions: normalizeSubscriptions(usuario.subscriptions),
        academicProfile: usuario.academicProfile
          ? normalizeAcademicProfile(usuario.academicProfile)
          : null,
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, mensaje: error.message || "Credenciales incorrectas" };
    }
  }, []);

  const register = useCallback(async (nuevoUsuario) => {
    try {
      const usuarioCreado = await registrarUsuario(nuevoUsuario);
      setUser(usuarioCreado);
      return { ok: true };
    } catch (error) {
      return { ok: false, mensaje: error.message || "No se pudo completar el registro" };
    }
  }, []);

  // Los datos personales y las preferencias de temas se guardan en MySQL.
  // El perfil académico local heredado se conserva solo para la demostración mock.
  const updateUserProfile = useCallback(
    async (datosActualizados) => {
      if (!user) return null;

      const cambiaPerfil = ["nombre", "carrera", "semestre"].some(
        (campo) =>
          campo in datosActualizados &&
          String(datosActualizados[campo] ?? "") !== String(user[campo] ?? "")
      );

      let datosDelServidor = {};

      if (cambiaPerfil) {
        datosDelServidor = await actualizarPerfilApi({
          nombre: datosActualizados.nombre ?? user.nombre,
          carrera: datosActualizados.carrera ?? user.carrera,
          semestre: datosActualizados.semestre ?? user.semestre,
        });
      }

      if ("subscriptions" in datosActualizados) {
        await guardarPreferenciasPortal(normalizeSubscriptions(datosActualizados.subscriptions));
      }

      const usuarioActualizado = {
        ...user,
        ...datosActualizados,
        ...datosDelServidor, // lo que el servidor guardó manda sobre lo escrito en el formulario
        subscriptions: normalizeSubscriptions(
          datosActualizados.subscriptions || user.subscriptions
        ),
        academicProfile: datosActualizados.academicProfile
          ? normalizeAcademicProfile(datosActualizados.academicProfile)
          : user.academicProfile,
      };

      setUser(usuarioActualizado);

      return usuarioActualizado;
    },
    [user]
  );

  const logout = useCallback(() => {
    setUser(null);
    cerrarSesion();
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      register,
      updateUserProfile,
      hasRole: (rolesPermitidos) => hasRole(user, rolesPermitidos),
      canAccessAdmin: () => canAccessAdmin(user),
    }),
    [user, login, logout, register, updateUserProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
