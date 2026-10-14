import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";

import { PageHeader } from "../../../components/common/PageHeader";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { ROUTES } from "../../../constants/routes";
import { obtenerMaterias } from "../../../services/adminMateriasService";
import { obtenerTiposGrupos } from "../../../services/adminGruposTiposService";
import {
  actualizarGrupo, crearGrupo, desactivarGrupo,
  obtenerGrupos, obtenerUsuariosAcademicos, rolAcademico,
} from "../../../services/adminGruposService";
import {
  clasesBotonCatalogo, clasesCampoCatalogo, describirErrorCatalogo,
} from "../../../utils/adminCatalogos";

const inicial = {
  idMateria: "", idUsuario: "", idGrupoTipo: "",
  fechaInicio: "", fechaFin: "", horaInicio: "", horaFin: "", dias: "",
};
const fechaParaCampo = (valor) => String(valor || "").slice(0, 10);
const horaParaCampo = (valor) => String(valor || "").slice(0, 5);
const validarGrupo = (datos) => {
  if (![datos.idMateria, datos.idUsuario, datos.idGrupoTipo]
    .every((id) => Number.isInteger(id) && id > 0)) {
    return "Selecciona una materia, un docente y un tipo de grupo válidos.";
  }
  if (!datos.fechaInicio || !datos.fechaFin || datos.fechaInicio > datos.fechaFin) {
    return "La fecha de término debe ser igual o posterior a la fecha de inicio.";
  }
  if (!datos.horaInicio || !datos.horaFin || datos.horaInicio >= datos.horaFin) {
    return "La hora de término debe ser posterior a la hora de inicio.";
  }
  if (!datos.dias || datos.dias.length > 50) {
    return "Indica los días de clase (máximo 50 caracteres).";
  }
  return "";
};

export const AdminGrupos = () => {
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [grupoEliminar, setGrupoEliminar] = useState(null);
  const [formulario, setFormulario] = useState(inicial);

  const recargar = async () => {
    const [datosGrupos, datosMaterias, datosTipos, datosUsuarios] = await Promise.all([
      obtenerGrupos(), obtenerMaterias(), obtenerTiposGrupos(), obtenerUsuariosAcademicos(),
    ]);
    setGrupos(Array.isArray(datosGrupos) ? datosGrupos : []);
    setMaterias(Array.isArray(datosMaterias) ? datosMaterias : []);
    setTipos(Array.isArray(datosTipos) ? datosTipos : []);
    setDocentes(Array.isArray(datosUsuarios)
      ? datosUsuarios.filter((u) => u.activo && rolAcademico(u) === "docente") : []);
  };

  useEffect(() => {
    let vigente = true;
    Promise.all([
      obtenerGrupos(), obtenerMaterias(), obtenerTiposGrupos(), obtenerUsuariosAcademicos(),
    ]).then(([listaGrupos, listaMaterias, listaTipos, listaUsuarios]) => {
      if (!vigente) return;
      setGrupos(Array.isArray(listaGrupos) ? listaGrupos : []);
      setMaterias(Array.isArray(listaMaterias) ? listaMaterias : []);
      setTipos(Array.isArray(listaTipos) ? listaTipos : []);
      setDocentes(Array.isArray(listaUsuarios)
        ? listaUsuarios.filter((u) => u.activo && rolAcademico(u) === "docente") : []);
    }).catch((fallo) => {
      if (vigente) setError(describirErrorCatalogo(fallo));
    }).finally(() => {
      if (vigente) setCargando(false);
    });
    return () => { vigente = false; };
  }, []);

  const gruposFiltrados = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase("es");
    return grupos.filter((grupo) =>
      `${grupo.idGrupo} ${grupo.materiaNombre || ""} ${grupo.profesorNombre || ""} ${grupo.grupoTipoNombre || ""} ${grupo.dias || ""}`
        .toLocaleLowerCase("es").includes(consulta)
    ).sort((a, b) => a.idGrupo - b.idGrupo);
  }, [grupos, busqueda]);

  const actualizarListado = async () => {
    if (cargando || ocupado) return;
    setCargando(true);
    setError("");
    setAviso("");
    try { await recargar(); }
    catch (fallo) { setError(describirErrorCatalogo(fallo)); }
    finally { setCargando(false); }
  };

  const abrirNuevo = () => {
    setGrupoEditando(null);
    setFormulario({ ...inicial });
    setError(""); setAviso(""); setFormularioVisible(true);
  };
  const abrirEdicion = (grupo) => {
    setGrupoEditando(grupo);
    setFormulario({
      idMateria: String(grupo.idMateria),
      idUsuario: String(grupo.idUsuario),
      idGrupoTipo: String(grupo.idGrupoTipo),
      fechaInicio: fechaParaCampo(grupo.fechaInicio),
      fechaFin: fechaParaCampo(grupo.fechaFin),
      horaInicio: horaParaCampo(grupo.horaInicio),
      horaFin: horaParaCampo(grupo.horaFin),
      dias: grupo.dias || "",
    });
    setError(""); setAviso(""); setFormularioVisible(true);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    if (ocupado) return;
    const datos = {
      idMateria: Number(formulario.idMateria),
      idUsuario: Number(formulario.idUsuario),
      idGrupoTipo: Number(formulario.idGrupoTipo),
      fechaInicio: formulario.fechaInicio,
      fechaFin: formulario.fechaFin,
      horaInicio: `${formulario.horaInicio}:00`,
      horaFin: `${formulario.horaFin}:00`,
      dias: formulario.dias.trim(),
    };
    const problema = validarGrupo({
      ...datos, horaInicio: formulario.horaInicio, horaFin: formulario.horaFin,
    });
    if (problema) { setError(problema); return; }
    setOcupado(true); setError(""); setAviso("");
    try {
      if (grupoEditando) await actualizarGrupo(grupoEditando.idGrupo, datos);
      else await crearGrupo(datos);
      setFormularioVisible(false);
      setAviso(grupoEditando ? "Grupo actualizado correctamente." : "Grupo registrado correctamente.");
      setGrupoEditando(null);
      try { await recargar(); }
      catch { setError("El grupo se guardó, pero no se pudo actualizar el listado."); }
    } catch (fallo) { setError(describirErrorCatalogo(fallo)); }
    finally { setOcupado(false); }
  };

  const confirmarDesactivacion = async () => {
    if (!grupoEliminar || ocupado) return;
    setOcupado(true); setError(""); setAviso("");
    try {
      await desactivarGrupo(grupoEliminar.idGrupo);
      setAviso("Grupo desactivado correctamente.");
      try { await recargar(); }
      catch { setError("El grupo se desactivó, pero no se pudo actualizar el listado."); }
    } catch (fallo) { setError(describirErrorCatalogo(fallo)); }
    finally { setGrupoEliminar(null); setOcupado(false); }
  };

  const editarCampo = (clave) => (evento) =>
    setFormulario((actual) => ({ ...actual, [clave]: evento.target.value }));

  return (
    <section className="space-y-6">
      <PageHeader title="Administración de grupos" eyebrow="Gestión académica"
        description="Crea y actualiza grupos oficiales, asigna docentes y define horarios. Los datos se guardan en MySQL." />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={abrirNuevo}
          disabled={cargando || ocupado || !materias.length || !tipos.length || !docentes.length}
          className={`${clasesBotonCatalogo} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
          <Plus size={17} /> Nuevo grupo
        </button>
        <button type="button" onClick={actualizarListado} disabled={cargando || ocupado}
          className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
          <RefreshCw size={17} /> Actualizar listado
        </button>
        <Link to={ROUTES.ADMIN_INSCRIPCIONES}
          className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
          <Users size={17} /> Gestionar inscripciones
        </Link>
      </div>

      {!cargando && (!materias.length || !tipos.length || !docentes.length) && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Para crear grupos necesitas al menos una materia, un tipo de grupo y un usuario con rol Docente activos.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
      {aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{aviso}</p>}

      {formularioVisible && (
        <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{grupoEditando ? `Editar grupo #${grupoEditando.idGrupo}` : "Registrar grupo"}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { clave: "idMateria", titulo: "Materia", opciones: materias, id: "idMateria", nombre: "materiaNombre" },
              { clave: "idUsuario", titulo: "Docente", opciones: docentes, id: "idUsuario", nombre: "nombre" },
              { clave: "idGrupoTipo", titulo: "Tipo de grupo", opciones: tipos, id: "idGrupoTipo", nombre: "tipo" },
            ].map((campo) => (
              <label key={campo.clave} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {campo.titulo}
                <select required value={formulario[campo.clave]} onChange={editarCampo(campo.clave)}
                  disabled={ocupado} className={clasesCampoCatalogo}>
                  <option value="">Selecciona una opción</option>
                  {campo.opciones.map((opcion) => (
                    <option key={opcion[campo.id]} value={opcion[campo.id]}>{opcion[campo.nombre]}</option>
                  ))}
                </select>
              </label>
            ))}
            {[
              { clave: "fechaInicio", titulo: "Fecha de inicio", tipo: "date" },
              { clave: "fechaFin", titulo: "Fecha de término", tipo: "date" },
              { clave: "dias", titulo: "Días (ej. Lunes, Miércoles)", tipo: "text" },
              { clave: "horaInicio", titulo: "Hora de inicio", tipo: "time" },
              { clave: "horaFin", titulo: "Hora de término", tipo: "time" },
            ].map((campo) => (
              <label key={campo.clave} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {campo.titulo}
                <input type={campo.tipo} value={formulario[campo.clave]} onChange={editarCampo(campo.clave)}
                  maxLength={campo.clave === "dias" ? 50 : undefined}
                  required disabled={ocupado} className={clasesCampoCatalogo} />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={ocupado}
              className={`${clasesBotonCatalogo} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
              {ocupado ? "Guardando…" : "Guardar grupo"}
            </button>
            <button type="button" disabled={ocupado} onClick={() => { setFormularioVisible(false); setError(""); }}
              className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="relative block">
          <span className="sr-only">Buscar grupos</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por materia, docente, tipo o número de grupo…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
        </label>
      </div>
      {cargando ? (
        <p role="status" className="text-sm text-slate-600">Cargando grupos…</p>
      ) : gruposFiltrados.length === 0 ? (
        <EmptyState title="No hay grupos para mostrar" message="Prueba con otra búsqueda o registra un grupo académico." />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {gruposFiltrados.map((grupo) => (
              <article key={grupo.idGrupo} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6F1D46] dark:text-pink-300">Grupo #{grupo.idGrupo} · {grupo.grupoTipoNombre}</p>
                <h3 className="break-words font-semibold [overflow-wrap:anywhere]">{grupo.materiaNombre}</h3>
                <p className="break-words text-sm [overflow-wrap:anywhere]">Docente: {grupo.profesorNombre}</p>
                <p className="break-words text-sm [overflow-wrap:anywhere]">{grupo.dias} · {horaParaCampo(grupo.horaInicio)}–{horaParaCampo(grupo.horaFin)}</p>
                <p className="text-xs text-slate-500">{fechaParaCampo(grupo.fechaInicio)} a {fechaParaCampo(grupo.fechaFin)}</p>
                <div className="flex flex-wrap gap-2">
                  <Link to={`${ROUTES.ADMIN_INSCRIPCIONES}?grupo=${grupo.idGrupo}`}
                    className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
                    <Users size={16} /> Alumnos
                  </Link>
                  <button type="button" onClick={() => abrirEdicion(grupo)} disabled={ocupado}
                    className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
                    <Pencil size={16} /> Editar
                  </button>
                  <button type="button" onClick={() => setGrupoEliminar(grupo)} disabled={ocupado}
                    className={`${clasesBotonCatalogo} bg-red-50 text-red-700 hover:bg-red-100`}>
                    <Trash2 size={16} /> Desactivar
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white">
              <tr>
                <th className="p-4">Grupo</th><th className="p-4">Materia y tipo</th>
                <th className="p-4">Docente</th><th className="p-4">Horario</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gruposFiltrados.map((grupo) => (
                <tr key={grupo.idGrupo} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-semibold">#{grupo.idGrupo}</td>
                  <td className="p-4">{grupo.materiaNombre}<div className="text-xs text-slate-500">{grupo.grupoTipoNombre}</div></td>
                  <td className="p-4">{grupo.profesorNombre}</td>
                  <td className="p-4">
                    {grupo.dias} · {horaParaCampo(grupo.horaInicio)}–{horaParaCampo(grupo.horaFin)}
                    <div className="text-xs text-slate-500">{fechaParaCampo(grupo.fechaInicio)} a {fechaParaCampo(grupo.fechaFin)}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link to={`${ROUTES.ADMIN_INSCRIPCIONES}?grupo=${grupo.idGrupo}`}
                        className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
                        <Users size={16} /> Alumnos
                      </Link>
                      <button type="button" onClick={() => abrirEdicion(grupo)} disabled={ocupado}
                        className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200`}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button type="button" onClick={() => setGrupoEliminar(grupo)} disabled={ocupado}
                        className={`${clasesBotonCatalogo} bg-red-50 text-red-700 hover:bg-red-100`}>
                        <Trash2 size={16} /> Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      <ConfirmModal isOpen={Boolean(grupoEliminar)} title="Desactivar grupo"
        message={`¿Deseas desactivar el grupo #${grupoEliminar?.idGrupo || ""}? No se permite desactivar grupos con alumnos inscritos.`}
        confirmLabel="Desactivar grupo" onConfirm={confirmarDesactivacion}
        onCancel={() => { if (!ocupado) setGrupoEliminar(null); }} />
    </section>
  );
};
