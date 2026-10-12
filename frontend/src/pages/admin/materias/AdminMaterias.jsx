import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { EmptyState } from "../../../components/common/EmptyState";
import { PageHeader } from "../../../components/common/PageHeader";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { obtenerAcademias } from "../../../services/academiasService";
import {
  actualizarMateria,
  crearMateria,
  desactivarMateria,
  obtenerMaterias,
} from "../../../services/adminMateriasService";
import {
  clasesBotonCatalogo,
  clasesCampoCatalogo,
  describirErrorCatalogo,
} from "../../../utils/adminCatalogos";

export const AdminMaterias = () => {
  const [materias, setMaterias] = useState([]);
  const [academias, setAcademias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formularioVisible, setFormularioVisible] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState(null);
  const [materiaDesactivar, setMateriaDesactivar] = useState(null);
  const [idAcademia, setIdAcademia] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerMaterias(), obtenerAcademias()])
      .then(([listaMaterias, listaAcademias]) => {
        if (!vigente) return;
        setMaterias(Array.isArray(listaMaterias) ? listaMaterias : []);
        setAcademias(Array.isArray(listaAcademias) ? listaAcademias : []);
      })
      .catch((fallo) => {
        if (vigente) setError(describirErrorCatalogo(fallo));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, []);

  const materiasFiltradas = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase("es");
    return materias.filter((materia) =>
      `${materia.materiaNombre || ""} ${materia.academiaNombre || ""} ${materia.descripcion || ""}`
        .toLocaleLowerCase("es")
        .includes(consulta)
    ).sort((a, b) => (a.materiaNombre || "").localeCompare(b.materiaNombre || "", "es"));
  }, [materias, busqueda]);

  const recargar = async () => {
    const [listaMaterias, listaAcademias] = await Promise.all([
      obtenerMaterias(), obtenerAcademias(),
    ]);
    setMaterias(Array.isArray(listaMaterias) ? listaMaterias : []);
    setAcademias(Array.isArray(listaAcademias) ? listaAcademias : []);
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
    setMateriaEditando(null);
    setIdAcademia("");
    setNombre("");
    setDescripcion("");
    setError("");
    setAviso("");
    setFormularioVisible(true);
  };

  const abrirEdicion = (materia) => {
    setMateriaEditando(materia);
    setIdAcademia(String(materia.idAcademia));
    setNombre(materia.materiaNombre || "");
    setDescripcion(materia.descripcion || "");
    setError("");
    setAviso("");
    setFormularioVisible(true);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    if (ocupado) return;
    const datos = {
      idAcademia: Number(idAcademia),
      materiaNombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
    };
    if (!Number.isInteger(datos.idAcademia) || datos.idAcademia <= 0 ||
        !academias.some((academia) => academia.idAcademia === datos.idAcademia) ||
        !datos.materiaNombre || datos.materiaNombre.length > 150 ||
        (datos.descripcion && datos.descripcion.length > 255)) {
      setError("Selecciona una academia activa y revisa el nombre (1 a 150 caracteres) y la descripción (máximo 255).");
      return;
    }

    setOcupado(true);
    setError("");
    setAviso("");
    try {
      if (materiaEditando) {
        await actualizarMateria(materiaEditando.idMateria, datos);
      } else {
        await crearMateria(datos);
      }
      setFormularioVisible(false);
      setMateriaEditando(null);
      setAviso(materiaEditando ? "Materia actualizada correctamente." : "Materia registrada correctamente.");
      try {
        await recargar();
      } catch {
        setError("La materia se guardó, pero no se pudo actualizar el listado. Usa 'Actualizar listado'.");
      }
    } catch (fallo) {
      setError(describirErrorCatalogo(fallo));
    } finally {
      setOcupado(false);
    }
  };

  const confirmarDesactivacion = async () => {
    if (!materiaDesactivar || ocupado) return;
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      await desactivarMateria(materiaDesactivar.idMateria);
      setMateriaDesactivar(null);
      setAviso("Materia desactivada correctamente.");
      try {
        await recargar();
      } catch {
        setError("La materia se desactivó, pero no se pudo actualizar el listado. Usa 'Actualizar listado'.");
      }
    } catch (fallo) {
      setError(describirErrorCatalogo(fallo));
      setMateriaDesactivar(null);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Administración de materias"
        eyebrow="Gestión académica"
        description="Consulta, registra, edita y desactiva materias oficiales vinculadas a academias. Los cambios se guardan en MySQL." />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={abrirNuevo} disabled={ocupado || cargando || academias.length === 0}
          className={`${clasesBotonCatalogo} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
          <Plus size={17} /> Nueva materia
        </button>
        <button type="button" onClick={actualizarListado} disabled={ocupado || cargando}
          className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
          <RefreshCw size={17} /> Actualizar listado
        </button>
      </div>

      {!cargando && academias.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          Para registrar materias necesitas al menos una academia activa.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
      {aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{aviso}</p>}

      {formularioVisible && (
        <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {materiaEditando ? "Editar materia" : "Registrar materia"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Academia
              <select value={idAcademia} onChange={(evento) => setIdAcademia(evento.target.value)}
                required disabled={ocupado} className={clasesCampoCatalogo}>
                <option value="">Selecciona una academia</option>
                {academias.map((academia) => (
                  <option key={academia.idAcademia} value={academia.idAcademia}>{academia.nombre}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nombre de la materia
              <input value={nombre} onChange={(evento) => setNombre(evento.target.value)}
                required maxLength={150} disabled={ocupado} className={clasesCampoCatalogo} />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
              Descripción (opcional)
              <textarea value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)}
                maxLength={255} rows={3} disabled={ocupado} className={clasesCampoCatalogo} />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={ocupado}
              className={`${clasesBotonCatalogo} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
              {ocupado ? "Guardando…" : "Guardar materia"}
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
          <span className="sr-only">Buscar materias</span>
          <Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por materia, academia o descripción…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
        </label>
      </div>

      {cargando ? (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Cargando materias…</p>
      ) : materiasFiltradas.length === 0 ? (
        <EmptyState title="No hay materias para mostrar"
          message="Prueba con otra búsqueda o registra una materia nueva." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
              <tr>
                <th scope="col" className="p-4">Materia</th>
                <th scope="col" className="p-4">Academia</th>
                <th scope="col" className="p-4">Descripción</th>
                <th scope="col" className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiasFiltradas.map((materia) => (
                <tr key={materia.idMateria} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">{materia.materiaNombre}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{materia.academiaNombre}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{materia.descripcion || "Sin descripción"}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" disabled={ocupado} onClick={() => abrirEdicion(materia)}
                        aria-label={`Editar ${materia.materiaNombre}`}
                        className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button type="button" disabled={ocupado} onClick={() => setMateriaDesactivar(materia)}
                        aria-label={`Desactivar ${materia.materiaNombre}`}
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

      <ConfirmModal isOpen={Boolean(materiaDesactivar)}
        title="Desactivar materia"
        message={`¿Deseas desactivar “${materiaDesactivar?.materiaNombre || "esta materia"}”? No se permitirá si tiene grupos activos asociados.`}
        confirmLabel={ocupado ? "Procesando…" : "Desactivar"}
        onConfirm={confirmarDesactivacion}
        onCancel={() => { if (!ocupado) setMateriaDesactivar(null); }} />
    </section>
  );
};
