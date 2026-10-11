import { useCallback, useEffect, useMemo, useState } from "react";

import {
  obtenerUsuarios,
  guardarUsuarios,
  agregarUsuarioLista,
  editarUsuarioLista,
  eliminarUsuarioLista,
  existeCorreo,
} from "../../services/usuariosService";
import { UsuariosContext } from "./UsuariosContext";

export const UsuariosProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState(() => obtenerUsuarios());

  useEffect(() => {
    guardarUsuarios(usuarios);
  }, [usuarios]);

  const agregarUsuario = useCallback(
    (nuevoUsuario) => {
      const correo = nuevoUsuario.correo || nuevoUsuario.email;

      if (existeCorreo(usuarios, correo)) {
        throw new Error("Ya existe un usuario con ese correo");
      }

      setUsuarios((prev) => agregarUsuarioLista(prev, nuevoUsuario));
    },
    [usuarios]
  );

  const eliminarUsuario = useCallback((id) => {
    setUsuarios((prev) => eliminarUsuarioLista(prev, id));
  }, []);

  const editarUsuario = useCallback(
    (id, datosActualizados) => {
      if (
        datosActualizados.correo &&
        existeCorreo(usuarios, datosActualizados.correo, id)
      ) {
        throw new Error("Ya existe un usuario con ese correo");
      }

      setUsuarios((prev) => editarUsuarioLista(prev, id, datosActualizados));
    },
    [usuarios]
  );

  const value = useMemo(
    () => ({
      usuarios,
      agregarUsuario,
      eliminarUsuario,
      editarUsuario,
    }),
    [usuarios, agregarUsuario, eliminarUsuario, editarUsuario]
  );

  return (
    <UsuariosContext.Provider value={value}>
      {children}
    </UsuariosContext.Provider>
  );
};
