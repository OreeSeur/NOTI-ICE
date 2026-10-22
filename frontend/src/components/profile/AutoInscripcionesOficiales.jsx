import { useEffect, useMemo, useState } from "react";
import {
  obtenerMisInscripciones,
  obtenerGruposParaInscripcion,
  inscribirmeEnGrupo,
  desinscribirmeDeGrupo,
} from "../../services/inscripcionesService";

// El catálogo y las inscripciones proceden de la API, nunca de localStorage.
export const AutoInscripcionesOficiales = () => {
  const [grupos, setGrupos] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [materiaId, setMateriaId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const recargar = async () => {
    const [catalogo, actuales] = await Promise.all([
      obtenerGruposParaInscripcion(),
      obtenerMisInscripciones(),
    ]);
    setGrupos(Array.isArray(catalogo) ? catalogo : []);
    setInscripciones(Array.isArray(actuales) ? actuales : []);
  };

  useEffect(() => {
    let vivo = true;
    Promise.all([obtenerGruposParaInscripcion(), obtenerMisInscripciones()])
      .then(([catalogo, actuales]) => {
        if (!vivo) return;
        setGrupos(Array.isArray(catalogo) ? catalogo : []);
        setInscripciones(Array.isArray(actuales) ? actuales : []);
      })
      .catch((err) => { if (vivo) setError(err.message || "No se pudieron consultar tus inscripciones."); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);

  const materias = useMemo(() => {
    const mapa = new Map();
    for (const grupo of grupos) {
      if (grupo.activo && !mapa.has(grupo.idMateria)) {
        mapa.set(grupo.idMateria, { id: grupo.idMateria, nombre: grupo.materiaNombre });
      }
    }
    return [...mapa.values()].sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
  }, [grupos]);

  const inscritos = useMemo(() => new Set(inscripciones.map((i) => i.idGrupo)), [inscripciones]);
  const gruposDeMateria = grupos.filter((g) => String(g.idMateria) === String(materiaId) && g.activo);

  const ejecutar = async (accion, mensaje) => {
    setOcupado(true); setError(""); setAviso("");
    try {
      await accion();
      await recargar();
      setAviso(mensaje);
      setGrupoId("");
    } catch (err) {
      setError(err.message || "No fue posible completar la operación.");
    } finally { setOcupado(false); }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mis suscripciones a materias y grupos</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Suscríbete libremente a las materias y grupos que te interesen para recibir sus avisos y publicaciones.
          No es una inscripción escolar ni NOTI ICE la verifica con el IPN; puedes darte de baja cuando quieras.
        </p>
      </div>
      {cargando && <p className="text-sm">Cargando grupos y suscripciones...</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {aviso && <p role="status" className="text-sm text-green-700">{aviso}</p>}
      {!cargando && (
        <>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => {
            e.preventDefault();
            if (!grupoId) return;
            ejecutar(() => inscribirmeEnGrupo(Number(grupoId)), "Suscripción registrada. Recibirás los avisos de este grupo.");
          }}>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Materia
              <select className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-800" value={materiaId}
                onChange={(e) => { setMateriaId(e.target.value); setGrupoId(""); }} required>
                <option value="">Selecciona una materia</option>
                {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Grupo
              <select className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-800" value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)} required disabled={!materiaId}>
                <option value="">Selecciona un grupo</option>
                {gruposDeMateria.map((g) => <option key={g.idGrupo} value={g.idGrupo}>
                  Grupo {g.idGrupo} · {g.grupoTipoNombre} · {g.profesorNombre} · {g.dias} {String(g.horaInicio).slice(0, 5)}
                </option>)}
              </select>
            </label>
            <button disabled={ocupado || !grupoId || inscritos.has(Number(grupoId))}
              className="rounded-xl bg-[#6F1D46] px-5 py-3 font-semibold text-white disabled:opacity-50 md:col-span-2">
              {ocupado ? "Guardando..." : "Suscribirme"}
            </button>
          </form>
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800 dark:text-white">Grupos a los que estoy suscrito</h3>
            {inscripciones.length === 0 && <p className="text-sm text-slate-500">Todavía no tienes suscripciones a grupos.</p>}
            {inscripciones.map((i) => <div key={i.idGrupoAlumno}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-600">
              <div className="text-sm text-slate-700 dark:text-slate-200">
                <p className="font-semibold">{i.materiaNombre}</p>
                <p>Grupo {i.idGrupo} · {i.grupoTipoNombre} · {i.docenteNombre} · {i.dias}</p>
                <p>{String(i.horaInicio).slice(0, 5)} a {String(i.horaFin).slice(0, 5)}</p>
              </div>
              <button type="button" disabled={ocupado}
                onClick={() => ejecutar(() => desinscribirmeDeGrupo(i.idGrupo), "Suscripción cancelada. Ya no recibirás los avisos de este grupo.")}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50 dark:text-red-300">
                Darme de baja
              </button>
            </div>)}
          </div>
        </>
      )}
    </section>
  );
};
