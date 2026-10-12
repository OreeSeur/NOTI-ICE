import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { EmptyState } from "../../../components/common/EmptyState";
import { PageHeader } from "../../../components/common/PageHeader";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import {
  actualizarTipoGrupo,
  crearTipoGrupo,
  desactivarTipoGrupo,
  obtenerTiposGrupos,
} from "../../../services/adminGruposTiposService";
import {
  clasesBotonCatalogo,
  clasesCampoCatalogo,
  describirErrorCatalogo,
} from "../../../utils/adminCatalogos";

export const AdminTiposGrupos = () => {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);
  const [tipoDesactivar, setTipoDesactivar] = useState(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    let vigente = true;
    obtenerTiposGrupos()
      .then((datos) => {
        if (vigente) setTipos(Array.isArray(datos) ? datos : []);
      })
      .catch((fallo) => {
        if (vigente) setError(describirErrorCatalogo(fallo));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, []);

  const tiposFiltrados = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase("es");
    return tipos.filter((tipo) =>
      (tipo.tipo || "").toLocaleLowerCase("es").includes(consulta)
    ).sort((a, b) => (a.tipo || "").localeCompare(b.tipo || "", "es"));
  }, [tipos, busqueda]);

  const recargar = async () => {
    const datos = await obtenerTiposGrupos();
    setTipos(Array.isArray(datos) ? datos : []);
  };

  const actualizarListado = async () => {
    if (ocupado || cargando) return;
    setCargando(true);
    setError("");
    setAviso("");
    try {
      await recargar();
    } catch (fallo) {
      setError(describirErrorCatalogo(fallo));
    } finally {
      setCargando(false);
    }
  };

  const abrirNuevo = () => {
    setTipoEditando(null);
    setNombre("");
    setError("");
    setAviso("");
    setFormularioVisible(true);
  };

  const abrirEdicion = (tipo) => {
    setTipoEditando(tipo);
    setNombre(tipo.tipo || "");
    setError("");
    setAviso("");
    setFormularioVisible(true);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    if (ocupado) return;
    const datos = { tipo: nombre.trim() };
    if (!datos.tipo || datos.tipo.length > 100) {
      setError("El nombre del tipo de grupo debe tener entre 1 y 100 caracteres.");
      return;
    }
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      if (tipoEditando) {
        await actualizarTipoGrupo(tipoEditando.idGrupoTipo, datos);
      } else {
        await crearTipoGrupo(datos);
      }
      setFormularioVisible(false);
      setTipoEditando(null);
      setAviso(tipoEditando ? "Tipo de grupo actualizado correctamente." : "Tipo de grupo registrado correctamente.");
      try {
        await recargar();
      } catch {
        setError("El tipo de grupo se guardó, pero no se pudo actualizar el listado. Usa 'Actualizar listado'.");
      }
    } catch (fallo) {
      setError(describirErrorCatalogo(fallo));
    } finally {
      setOcupado(false);
    }
  };

  const confirmarDesactivacion = async () => {
    if (!tipoDesactivar || ocupado) return;
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await desactivarTipoGrupo(tipoDesactivar.idGrupoTipo);
      setTipoDesactivar(null);
      setAviso("Tipo de grupo desactivado correctamente.");
      try {
        await recargar();
      } catch {
        setError("Se desactivó el tipo, pero no se pudo actualizar el listado. Usa 'Actualizar listado'.");
      }
    } catch (fallo) {
      setError(describirErrorCatalogo(fallo));
      setTipoDesactivar(null);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Administración de tipos de grupos"
        eyebrow="Gestión académica"
        description="Gestiona los tipos de grupos académicos, como Teoría, Laboratorio y Mixto. Los cambios se guardan en MySQL." />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={abrirNuevo} disabled={ocupado || cargando}
          className={`${clasesBotonCatalogo} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
          <Plus size={17} /> Nuevo tipo de grupo
        </button>
        <button type="button" onClick={actualizarListado} disabled={ocupado || cargando}
          className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
          <RefreshCw size={17} /> Actualizar listado
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
      {aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{aviso}</p>}

      {formularioVisible && (
        <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {tipoEditando ? "Editar tipo de grupo" : "Registrar tipo de grupo"}
          </h2>
          <label className="block max-w-xl text-sm font-semibold text-slate-700 dark:text-slate-200">
            Nombre del tipo de grupo
            <input value={nombre} onChange={(evento) => setNombre(evento.target.value)}
              required maxLength={100} disabled={ocupado} className={clasesCampoCatalogo} />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={ocupado}
              className={`${clasesBotonCatalogo} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
              {ocupado ? "Guardando…" : "Guardar tipo de grupo"}
            </button>
            <button type="button" disabled={ocupado} onClick={() => setFormularioVisible(false)}
              className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="relative block">
          <span className="sr-only">Buscar tipos de grupos</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre del tipo de grupo…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
        </label>
      </div>

      {cargando ? (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Cargando tipos de grupos…</p>
      ) : tiposFiltrados.length === 0 ? (
        <EmptyState title="No hay tipos de grupos para mostrar"
          message="Prueba con otra búsqueda o registra un nuevo tipo de grupo." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
              <tr>
                <th scope="col" className="p-4">Tipo de grupo</th>
                <th scope="col" className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tiposFiltrados.map((tipo) => (
                <tr key={tipo.idGrupoTipo} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{tipo.tipo}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" disabled={ocupado} onClick={() => abrirEdicion(tipo)}
                        aria-label={`Editar ${tipo.tipo}`}
                        className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button type="button" disabled={ocupado} onClick={() => setTipoDesactivar(tipo)}
                        aria-label={`Desactivar ${tipo.tipo}`}
                        className={`${clasesBotonCatalogo} bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-200`}>
                        <Trash2 size={16} /> Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal isOpen={Boolean(tipoDesactivar)}
        title="Desactivar tipo de grupo"
        message={`¿Deseas desactivar “${tipoDesactivar?.tipo || "este tipo"}”? No se permitirá si existen grupos activos asociados.`}
        confirmLabel={ocupado ? "Procesando…" : "Desactivar"}
        onConfirm={confirmarDesactivacion}
        onCancel={() => { if (!ocupado) setTipoDesactivar(null); }} />
    </section>
  );
};
