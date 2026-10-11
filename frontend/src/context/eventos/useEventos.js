import { useContext } from "react";
import { EventosContext } from "./EventosContext";

export const useEventos = () => {
  const context = useContext(EventosContext);

  if (!context) {
    throw new Error("useEventos debe usarse dentro de EventosProvider");
  }

  return context;
};
