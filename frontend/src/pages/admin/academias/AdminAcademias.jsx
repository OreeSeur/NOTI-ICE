import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { EmptyState } from "../../../components/common/EmptyState";
import { PageHeader } from "../../../components/common/PageHeader";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import {
  actualizarAcademia,
  crearAcademia,
  desactivarAcademia,
  obtenerAcademias,
} from "../../../services/academiasService";

const clasesBoton =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const mensajeError = (error) => {
  const errores = error?.details?.errors;
  if (errores && typeof errores === "object") {
    const primerMensaje = Object.values(errores)
      .flat()
      .find((mensaje) => typeof mensaje === "string" && mensaje.trim());
    if (primerMensaje) return primerMensaje;
  }

  if (error?.status === 409) {
    return error?.details?.mensaje ||
      "No se puede desactivar esta academia porque tiene materias activas asociadas.";
  }

  if (error?.status === 0) {
    return "No se pudo conectar con el servidor. Verifica que el backend esté iniciado.";
  }

  return error?.message || "No se pudo completar la operación.";
};

export const AdminAcademias = () => {
  const [academias, setAcademias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [academiaEditando, setAcademiaEditando] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [academiaDesactivar, setAcademiaDesactivar] = useState(null);

  useEffect(() => {
    let vigente = true;

    obtenerAcademias()
      .then((datos) => {
        if (vigente) setAcademias(Array.isArray(datos) ? datos : []);
      })
      .catch((fallo) => {
        if (vigente) setError(mensajeError(fallo));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const academiasFiltradas = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase("es");
    return academias
      .filter((academia) =>
        `${academia.nombre || ""} ${academia.descripcion || ""}`
          .toLocaleLowerCase("es")
          .includes(consulta)
      )
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
  }, [academias, busqueda]);

  const recargar = async () => {
    const datos = await obtenerAcademias();
    setAcademias(Array.isArray(datos) ? datos : []);
  };

  const actualizarListado = async () => {
    if (ocupado) return;
    setCargando(true);
    setError("");
    try {
      await recargar();
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      setCargando(false);
    }
  };

  const abrirNuevo = () => {
    setAcademiaEditando(null);
    setNombre("");
    setDescripcion("");
    setError("");
    setAviso("");
    setFormularioVisible(true);
  };

  const abrirEdicion = (academia) => {
    setAcademiaEditando(academia);
    setNombre(academia.nombre || "");
    setDescripcion(academia.descripcion || "");
    setError("");
    setAviso("");
    setFormularioVisible(true);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    if (ocupado) return;

    const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() || null };
    if (!datos.nombre || datos.nombre.length > 150 ||
        (datos.descripcion && datos.descripcion.length > 255)) {
      setError("Revisa el nombre (1 a 150 caracteres) y la descripción (máximo 255).");
      return;
    }

    setOcupado(true);
    setError("");
    setAviso("");
    try {
      if (academiaEditando) {
        await actualizarAcademia(academiaEditando.idAcademia, datos);
      } else {
        await crearAcademia(datos);
      }
      setFormularioVisible(false);
      setAcademiaEditando(null);
      setAviso(academiaEditando ? "Academia actualizada correctamente." :
        "Academia registrada correctamente.");
      try {
        await recargar();
      } catch {
        setError("La academia se guardó, pero no se pudo actualizar el listado. Usa 'Actualizar listado'.");
      }
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      setOcupado(false);
    }
  };

  const confirmarDesactivacion = async () => {
    if (!academiaDesactivar || ocupado) return;
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await desactivarAcademia(academiaDesactivar.idAcademia);
      setAcademiaDesactivar(null);
      setAviso("Academia desactivada correctamente.");
      try {
        await recargar();
      } catch {
        setError("La academia se desactivó, pero no se pudo actualizar el listado. Usa 'Actualizar listado'.");
      }
    } catch (fallo) {
      setError(mensajeError(fallo));
      setAcademiaDesactivar(null);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Administración de academias"
        description="Consulta, registra, edita y desactiva academias oficiales. Los cambios se guardan en MySQL."
        eyebrow="Gestión académica"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={abrirNuevo} disabled={ocupado}
          className={`${clasesBoton} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
          <Plus size={17} /> Nueva academia
        </button>
        <button type="button" onClick={actualizarListado} disabled={ocupado || cargando}
          className={`${clasesBoton} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
          <RefreshCw size={17} /> Actualizar listado
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
      {aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{aviso}</p>}

      {formularioVisible && (
        <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {academiaEditando ? "Editar academia" : "Registrar academia"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nombre de la academia
              <input value={nombre} onChange={(evento) => setNombre(evento.target.value)}
                required maxLength={150} disabled={ocupado}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Descripción (opcional)
              <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)}
                maxLength={255} rows={3} disabled={ocupado}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={ocupado} className={`${clasesBoton} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
              {ocupado ? "Guardando…" : "Guardar academia"}
            </button>
            <button type="button" disabled={ocupado} onClick={() => setFormularioVisible(false)}
              className={`${clasesBoton} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="relative block">
          <span className="sr-only">Buscar academias</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
        </label>
      </div>

      {cargando ? (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Cargando academias…</p>
      ) : academiasFiltradas.length === 0 ? (
        <EmptyState title="No hay academias para mostrar"
          message="Prueba con otra búsqueda o registra una academia nueva." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
              <tr>
                <th scope="col" className="p-4">Academia</th>
                <th scope="col" className="p-4">Descripción</th>
                <th scope="col" className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {academiasFiltradas.map((academia) => (
                <tr key={academia.idAcademia} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{academia.nombre}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{academia.descripcion || "Sin descripción"}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" disabled={ocupado} onClick={() => abrirEdicion(academia)}
                        aria-label={`Editar ${academia.nombre}`}
                        className={`${clasesBoton} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button type="button" disabled={ocupado} onClick={() => setAcademiaDesactivar(academia)}
                        aria-label={`Desactivar ${academia.nombre}`}
                        className={`${clasesBoton} bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-200`}>
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

      <ConfirmModal
        isOpen={Boolean(academiaDesactivar)}
        title="Desactivar academia"
        message={`¿Deseas desactivar “${academiaDesactivar?.nombre || "esta academia"}”? No se permitirá si tiene materias activas asociadas.`}
        confirmLabel={ocupado ? "Procesando…" : "Desactivar"}
        onConfirm={confirmarDesactivacion}
        onCancel={() => { if (!ocupado) setAcademiaDesactivar(null); }}
      />
    </section>
  );
};
