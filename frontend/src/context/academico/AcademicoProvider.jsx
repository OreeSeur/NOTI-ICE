import { useCallback, useEffect, useMemo, useState } from "react";

import {
  agregarAsignacionLista,
  agregarGrupoLista,
  agregarMateriaLista,
  eliminarAsignacionLista,
  eliminarGrupoLista,
  eliminarMateriaLista,
  guardarAsignaciones,
  guardarGrupos,
  guardarMaterias,
  limpiarAsignacionesPorGrupo,
  limpiarAsignacionesPorMateria,
  obtenerAsignaciones,
  obtenerGrupos,
  obtenerMaterias,
} from "../../services/academicoService";
import { AcademicoContext } from "./AcademicoContext";

export const AcademicoProvider = ({ children }) => {
  const [materias, setMaterias] = useState(() => obtenerMaterias());
  const [grupos, setGrupos] = useState(() => obtenerGrupos());
  const [asignaciones, setAsignaciones] = useState(() => obtenerAsignaciones());

  useEffect(() => {
    guardarMaterias(materias);
  }, [materias]);

  useEffect(() => {
    guardarGrupos(grupos);
  }, [grupos]);

  useEffect(() => {
    guardarAsignaciones(asignaciones);
  }, [asignaciones]);

  const agregarMateria = useCallback((materia) => {
    setMaterias((prev) => agregarMateriaLista(prev, materia));
  }, []);

  const eliminarMateria = useCallback((id) => {
    setMaterias((prev) => eliminarMateriaLista(prev, id));
    setAsignaciones((prev) => limpiarAsignacionesPorMateria(prev, id));
  }, []);

  const agregarGrupo = useCallback((grupo) => {
    setGrupos((prev) => agregarGrupoLista(prev, grupo));
  }, []);

  const eliminarGrupo = useCallback((id) => {
    setGrupos((prev) => eliminarGrupoLista(prev, id));
    setAsignaciones((prev) => limpiarAsignacionesPorGrupo(prev, id));
  }, []);

  const agregarAsignacion = useCallback((asignacion) => {
    setAsignaciones((prev) => agregarAsignacionLista(prev, asignacion));
  }, []);

  const eliminarAsignacion = useCallback((id) => {
    setAsignaciones((prev) => eliminarAsignacionLista(prev, id));
  }, []);

  const value = useMemo(
    () => ({
      materias,
      grupos,
      asignaciones,
      agregarMateria,
      eliminarMateria,
      agregarGrupo,
      eliminarGrupo,
      agregarAsignacion,
      eliminarAsignacion,
    }),
    [
      asignaciones,
      grupos,
      materias,
      agregarAsignacion,
      agregarGrupo,
      agregarMateria,
      eliminarAsignacion,
      eliminarGrupo,
      eliminarMateria,
    ]
  );

  return (
    <AcademicoContext.Provider value={value}>
      {children}
    </AcademicoContext.Provider>
  );
};
