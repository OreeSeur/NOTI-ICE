import { useContext } from "react";
import { AcademicoContext } from "./AcademicoContext";

export const useAcademico = () => {
  const context = useContext(AcademicoContext);

  if (!context) {
    throw new Error("useAcademico debe usarse dentro de AcademicoProvider");
  }

  return context;
};
