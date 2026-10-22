import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RefreshCw, UserPlus, UserMinus } from "lucide-react";

import { PageHeader } from "../../../components/common/PageHeader";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { ROUTES } from "../../../constants/routes";
import {
  obtenerGrupos, obtenerUsuariosAcademicos, obtenerInscritos,
  inscribirAlumno, desinscribirAlumno, rolAcademico,
} from "../../../services/adminGruposService";
import {
  clasesBotonCatalogo, clasesCampoCatalogo, describirErrorCatalogo,
} from "../../../utils/adminCatalogos";

export const AdminInscripciones = () => {
  const [parametros, cambiarParametros] = useSearchParams();
  const parametroGrupo = parametros.get("grupo") || "";
  const [grupos, setGrupos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoInscritos, setCargandoInscritos] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [idAlumno, setIdAlumno] = useState("");
  const [inscripcionEliminar, setInscripcionEliminar] = useState(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerGrupos(), obtenerUsuariosAcademicos()])
      .then(([listaGrupos, listaUsuarios]) => {
        if (!vigente) return;
        setGrupos(Array.isArray(listaGrupos) ? listaGrupos : []);
        setAlumnos(Array.isArray(listaUsuarios)
          ? listaUsuarios.filter((usuario) => usuario.activo && rolAcademico(usuario) === "alumno") : []);
      })
      .catch((fallo) => { if (vigente) setError(describirErrorCatalogo(fallo)); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (!parametroGrupo || !grupos.some((g) => String(g.idGrupo) === parametroGrupo)) {
      return;
    }
    let vigente = true;
    obtenerInscritos(Number(parametroGrupo))
      .then((lista) => { if (vigente) setInscritos(Array.isArray(lista) ? lista : []); })
      .catch((fallo) => { if (vigente) setError(describirErrorCatalogo(fallo)); })
      .finally(() => { if (vigente) setCargandoInscritos(false); });
    return () => { vigente = false; };
  }, [parametroGrupo, grupos]);

  const grupoActual = grupos.find((g) => String(g.idGrupo) === parametroGrupo);
  const inscritosIds = useMemo(() => new Set(inscritos.map((i) => i.idUsuario)), [inscritos]);
  const disponibles = alumnos.filter((alumno) => !inscritosIds.has(alumno.idUsuario));

  const seleccionarGrupo = (evento) => {
    const id = evento.target.value;
    cambiarParametros(id ? { grupo: id } : {}, { replace: true });
    setInscritos([]);
    setIdAlumno("");
    setError(""); setAviso("");
    setCargandoInscritos(Boolean(id));
  };

  const actualizarListado = async () => {
    if (ocupado || cargando || cargandoInscritos) return;
    setCargandoInscritos(Boolean(grupoActual));
    setError(""); setAviso("");
    try {
      const [listaGrupos, listaUsuarios] = await Promise.all([obtenerGrupos(), obtenerUsuariosAcademicos()]);
      const nuevosGrupos = Array.isArray(listaGrupos) ? listaGrupos : [];
      setGrupos(nuevosGrupos);
      setAlumnos(Array.isArray(listaUsuarios)
        ? listaUsuarios.filter((usuario) => usuario.activo && rolAcademico(usuario) === "alumno") : []);
      if (parametroGrupo && nuevosGrupos.some((g) => String(g.idGrupo) === parametroGrupo)) {
        const lista = await obtenerInscritos(Number(parametroGrupo));
        setInscritos(Array.isArray(lista) ? lista : []);
      } else {
        setInscritos([]);
        if (parametroGrupo) cambiarParametros({}, { replace: true });
      }
    } catch (fallo) { setError(describirErrorCatalogo(fallo)); }
    finally { setCargandoInscritos(false); }
  };

  const inscribir = async (evento) => {
    evento.preventDefault();
    if (ocupado || !grupoActual) return;
    const alumnoId = Number(idAlumno);
    if (!Number.isInteger(alumnoId) || !disponibles.some((a) => a.idUsuario === alumnoId)) {
      setError("Selecciona un alumno activo que todavía no esté inscrito en el grupo.");
      return;
    }
    setOcupado(true); setError(""); setAviso("");
    try {
      await inscribirAlumno(grupoActual.idGrupo, alumnoId);
      setIdAlumno("");
      setAviso("Inscripción guardada correctamente.");
      try {
        const lista = await obtenerInscritos(grupoActual.idGrupo);
        setInscritos(Array.isArray(lista) ? lista : []);
      } catch { setError("La inscripción se guardó, pero no se pudo actualizar la lista."); }
    } catch (fallo) { setError(describirErrorCatalogo(fallo)); }
    finally { setOcupado(false); }
  };

  const confirmarDesinscripcion = async () => {
    if (!inscripcionEliminar || !grupoActual || ocupado) return;
    setOcupado(true); setError(""); setAviso("");
    try {
      await desinscribirAlumno(inscripcionEliminar.idGrupoAlumno);
      setAviso("Alumno desinscrito correctamente. Podrás reinscribirlo si es necesario.");
      try {
        const lista = await obtenerInscritos(grupoActual.idGrupo);
        setInscritos(Array.isArray(lista) ? lista : []);
      } catch { setError("La desinscripción se realizó, pero no se pudo actualizar la lista."); }
    } catch (fallo) { setError(describirErrorCatalogo(fallo)); }
    finally { setInscripcionEliminar(null); setOcupado(false); }
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Suscripciones a grupos" eyebrow="Gestión académica"
        description="Consulta y gestiona a los alumnos suscritos a cada grupo para recibir sus avisos. Son suscripciones voluntarias del portal, no inscripciones escolares del IPN; se conservan en MySQL." />
      <div className="flex flex-wrap gap-3">
        <Link to={ROUTES.ADMIN_GRUPOS} className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
          Volver a grupos
        </Link>
        <button type="button" onClick={actualizarListado} disabled={ocupado || cargando || cargandoInscritos}
          className={`${clasesBotonCatalogo} bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-white`}>
          <RefreshCw size={17} /> Actualizar listado
        </button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
      {aviso && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{aviso}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="block max-w-2xl text-sm font-semibold text-slate-700 dark:text-slate-200">
          Seleccionar grupo académico
          <select value={grupoActual ? parametroGrupo : ""} onChange={seleccionarGrupo}
            disabled={cargando || ocupado} className={clasesCampoCatalogo}>
            <option value="">Selecciona un grupo activo</option>
            {grupos.map((grupo) => (
              <option key={grupo.idGrupo} value={grupo.idGrupo}>
                #{grupo.idGrupo} · {grupo.materiaNombre} · {grupo.profesorNombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {cargando ? <p role="status">Cargando grupos y alumnos…</p> : !grupoActual ? (
        <EmptyState title="Selecciona un grupo" message="Elige un grupo activo para consultar y gestionar sus suscripciones." />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Inscribir alumno en el grupo #{grupoActual.idGrupo}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{grupoActual.materiaNombre} · {grupoActual.grupoTipoNombre} · {grupoActual.profesorNombre}</p>
            <form onSubmit={inscribir} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Alumno activo no inscrito
                <select value={idAlumno} onChange={(e) => setIdAlumno(e.target.value)} required
                  disabled={ocupado || cargandoInscritos || disponibles.length === 0} className={clasesCampoCatalogo}>
                  <option value="">Selecciona un alumno</option>
                  {disponibles.map((alumno) => (
                    <option key={alumno.idUsuario} value={alumno.idUsuario}>
                      {alumno.nombre} · {alumno.noIdentificacion || `ID ${alumno.idUsuario}`}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={ocupado || cargandoInscritos || !disponibles.length}
                className={`${clasesBotonCatalogo} bg-[#6F1D46] text-white hover:bg-[#822552]`}>
                <UserPlus size={17} /> Inscribir alumno
              </button>
            </form>
            {!disponibles.length && !cargandoInscritos && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No hay alumnos activos disponibles para inscribir en este grupo.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="border-b border-slate-200 p-5 text-lg font-bold text-slate-900 dark:border-slate-700 dark:text-white">
              Alumnos inscritos {cargandoInscritos ? "(cargando…)" : `(${inscritos.length})`}
            </h2>
            {cargandoInscritos ? (
              <p role="status" className="p-5 text-sm text-slate-500">Consultando inscripciones…</p>
            ) : inscritos.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Este grupo no tiene alumnos inscritos actualmente.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {inscritos.map((inscripcion) => (
                  <li key={inscripcion.idGrupoAlumno} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{inscripcion.alumnoNombre || `Alumno ID ${inscripcion.idUsuario}`}</p>
                      <p className="text-xs text-slate-500">ID de alumno: {inscripcion.idUsuario} · Inscripción: {inscripcion.idGrupoAlumno}</p>
                    </div>
                    <button type="button" onClick={() => setInscripcionEliminar(inscripcion)} disabled={ocupado}
                      className={`${clasesBotonCatalogo} bg-red-50 text-red-700 hover:bg-red-100`}>
                      <UserMinus size={17} /> Desinscribir
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      <ConfirmModal isOpen={Boolean(inscripcionEliminar)} title="Desinscribir alumno"
        message={`¿Deseas desinscribir a ${inscripcionEliminar?.alumnoNombre || "este alumno"} del grupo #${grupoActual?.idGrupo || ""}? La inscripción se conservará como inactiva para permitir una reinscripción.`}
        confirmLabel="Desinscribir" onConfirm={confirmarDesinscripcion}
        onCancel={() => { if (!ocupado) setInscripcionEliminar(null); }} />
    </section>
  );
};
