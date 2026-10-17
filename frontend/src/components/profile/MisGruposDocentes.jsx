import { useEffect, useState } from "react";
import { get } from "../../api/apiClient";
import { useAuth } from "../../context/auth/useAuth";

const AlumnosDelGrupo = ({ idGrupo }) => {
  const [visible, setVisible] = useState(false);
  const [alumnos, setAlumnos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const alternarAlumnos = async () => {
    if (visible) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setCargando(true);
    setError("");

    try {
      // El servidor comprueba en el JWT que el docente imparte este grupo.
      const respuesta = await get(`/grupos/${encodeURIComponent(idGrupo)}/alumnos`);
      setAlumnos(Array.isArray(respuesta) ? respuesta : []);
    } catch (err) {
      setAlumnos(null);
      setError(err.message || "No fue posible consultar los alumnos inscritos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-600">
      <button
        type="button"
        onClick={alternarAlumnos}
        disabled={cargando}
        aria-expanded={visible}
        aria-controls={`alumnos-grupo-${idGrupo}`}
        className="rounded-lg border border-[#6F1D46] px-3 py-2 font-semibold text-[#6F1D46] transition hover:bg-[#6F1D46]/10 disabled:opacity-60 dark:border-pink-300 dark:text-pink-200"
      >
        {visible ? "Ocultar alumnos inscritos" : "Ver alumnos inscritos"}
      </button>

      {visible && (
        <div id={`alumnos-grupo-${idGrupo}`} className="mt-3 space-y-2" aria-live="polite">
          {cargando && <p className="text-slate-500 dark:text-slate-400">Cargando alumnos...</p>}
          {error && <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
          {!cargando && !error && alumnos !== null && (
            <>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Alumnos inscritos ({alumnos.length})
              </p>
              {alumnos.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">Todavía no hay alumnos inscritos.</p>
              ) : (
                <ul className="space-y-2">
                  {alumnos.map((alumno) => (
                    <li
                      key={alumno.idGrupoAlumno}
                      className="rounded-lg border border-slate-200 p-3 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                    >
                      {alumno.alumnoNombre || `Alumno ${alumno.idUsuario}`}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const MisGruposDocentes = () => {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    get("/grupos")
      .then((data) => {
        if (vivo) setGrupos((Array.isArray(data) ? data : []).filter((g) => g.idUsuario === user?.id));
      })
      .catch((err) => { if (vivo) setError(err.message || "No se pudieron cargar los grupos."); });
    return () => { vivo = false; };
  }, [user?.id]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mis materias y grupos oficiales</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">Las asignaciones oficiales las administra el personal autorizado.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {grupos.length === 0 && !error && <p className="text-sm dark:text-slate-300">No tienes grupos asignados actualmente.</p>}
      {grupos.map((g) => (
        <div key={g.idGrupo} className="rounded-xl border p-4 text-sm dark:border-slate-600">
          <p className="font-semibold text-slate-800 dark:text-white">{g.materiaNombre}</p>
          <p className="text-slate-600 dark:text-slate-300">
            {g.grupoTipoNombre} · {g.dias} · {String(g.horaInicio).slice(0, 5)}–{String(g.horaFin).slice(0, 5)}
          </p>
          <AlumnosDelGrupo idGrupo={g.idGrupo} />
        </div>
      ))}
    </section>
  );
};
