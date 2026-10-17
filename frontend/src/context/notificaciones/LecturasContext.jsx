import { createContext, useContext } from "react";

export const LecturasContext = createContext(null);
export const useLecturas = () => {
  const contexto = useContext(LecturasContext);
  if (!contexto) throw new Error("LecturasProvider no está disponible.");
  return contexto;
};
