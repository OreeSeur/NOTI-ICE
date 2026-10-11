import { crearId, mismoId } from "../utils/id";
import { parseGrupoNombre } from "../utils/academic";
import {
  obtenerAsignacionesStorage,
  obtenerGruposStorage,
  obtenerMateriasStorage,
  guardarAsignacionesStorage,
  guardarGruposStorage,
  guardarMateriasStorage,
} from "../storage/academicoStorage";

export const obtenerMaterias = () => obtenerMateriasStorage();
export const guardarMaterias = (materias) => guardarMateriasStorage(materias);

export const obtenerGrupos = () => obtenerGruposStorage();
export const guardarGrupos = (grupos) => guardarGruposStorage(grupos);

export const obtenerAsignaciones = () => obtenerAsignacionesStorage();
export const guardarAsignaciones = (asignaciones) =>
  guardarAsignacionesStorage(asignaciones);

const limpiarTexto = (valor) => String(valor || "").trim();

export const crearMateria = (materia) => ({
  id: crearId(),
  clave: limpiarTexto(materia.clave).toUpperCase(),
  nombre: limpiarTexto(materia.nombre),
  plan: limpiarTexto(materia.plan || "2024"),
  carrera: limpiarTexto(materia.carrera),
  semestre: limpiarTexto(materia.semestre),
  semestreNumero: materia.semestreNumero || null,
  tipo: limpiarTexto(materia.tipo || "Obligatoria"),
  opcion: limpiarTexto(materia.opcion),
  area: limpiarTexto(materia.area),
  createdAt: new Date().toISOString(),
});

export const agregarMateriaLista = (materias, materia) => [
  crearMateria(materia),
  ...materias,
];

export const editarMateriaLista = (materias, id, datosActualizados) =>
  materias.map((materia) =>
    mismoId(materia.id, id)
      ? {
          ...materia,
          ...crearMateria(datosActualizados),
          id: materia.id,
          createdAt: materia.createdAt,
          updatedAt: new Date().toISOString(),
        }
      : materia
  );

export const eliminarMateriaLista = (materias, id) =>
  materias.filter((materia) => !mismoId(materia.id, id));

export const crearGrupo = (grupo) => {
  const datosGrupo = parseGrupoNombre(grupo.nombre);

  return {
    id: crearId(),
    ...(datosGrupo || {}),
    nombre: limpiarTexto(grupo.nombre).toUpperCase(),
    carrera: datosGrupo?.carrera || limpiarTexto(grupo.carrera),
    semestre: datosGrupo?.semestre || limpiarTexto(grupo.semestre),
    semestreNumero: datosGrupo?.semestreNumero || grupo.semestreNumero || null,
    turnoCodigo: datosGrupo?.turnoCodigo || limpiarTexto(grupo.turnoCodigo),
    turno: datosGrupo?.turno || limpiarTexto(grupo.turno),
    numeroGrupo: datosGrupo?.numeroGrupo || grupo.numeroGrupo || null,
    createdAt: new Date().toISOString(),
  };
};

export const agregarGrupoLista = (grupos, grupo) => [crearGrupo(grupo), ...grupos];

export const editarGrupoLista = (grupos, id, datosActualizados) =>
  grupos.map((grupo) =>
    mismoId(grupo.id, id)
      ? {
          ...grupo,
          ...crearGrupo(datosActualizados),
          id: grupo.id,
          createdAt: grupo.createdAt,
          updatedAt: new Date().toISOString(),
        }
      : grupo
  );

export const eliminarGrupoLista = (grupos, id) =>
  grupos.filter((grupo) => !mismoId(grupo.id, id));

export const crearAsignacion = (asignacion) => ({
  id: crearId(),
  profesorId: asignacion.profesorId,
  materiaId: asignacion.materiaId,
  grupoId: asignacion.grupoId,
  plan: limpiarTexto(asignacion.plan || "2024"),
  periodo: limpiarTexto(asignacion.periodo),
  createdAt: new Date().toISOString(),
});

export const agregarAsignacionLista = (asignaciones, asignacion) => [
  crearAsignacion(asignacion),
  ...asignaciones,
];

export const eliminarAsignacionLista = (asignaciones, id) =>
  asignaciones.filter((asignacion) => !mismoId(asignacion.id, id));

export const limpiarAsignacionesPorMateria = (asignaciones, materiaId) =>
  asignaciones.filter((asignacion) => !mismoId(asignacion.materiaId, materiaId));

export const limpiarAsignacionesPorGrupo = (asignaciones, grupoId) =>
  asignaciones.filter((asignacion) => !mismoId(asignacion.grupoId, grupoId));
