import { useContext } from "react";
import { DocumentosContext } from "./DocumentosContext";

export const useDocumentos = () => {
  const context = useContext(DocumentosContext);

  if (!context) {
    throw new Error("useDocumentos debe usarse dentro de DocumentosProvider");
  }

  return context;
};
