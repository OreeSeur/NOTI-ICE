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

  // Nombre, carrera y semestre se guardan en el backend (PUT /api/auth/perfil).
  // Las preferencias de suscripción y el perfil académico siguen siendo locales
  // (solo de esta sesión). Lanza un error si el servidor rechaza los datos.
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
