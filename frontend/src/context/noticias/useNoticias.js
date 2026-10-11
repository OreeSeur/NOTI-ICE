import { useContext } from "react";
import { NoticiasContext } from "./NoticiasContext";

export const useNoticias = () => {
  const context = useContext(NoticiasContext);

  if (!context) {
    throw new Error("useNoticias debe usarse dentro de NoticiasProvider");
  }

  return context;
};
