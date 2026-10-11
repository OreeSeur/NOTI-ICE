import { useContext } from "react";
import { UsuariosContext } from "./UsuariosContext";

export const useUsuarios = () => {
  const context = useContext(UsuariosContext);

  if (!context) {
    throw new Error("useUsuarios debe usarse dentro de UsuariosProvider");
  }

  return context;
};
