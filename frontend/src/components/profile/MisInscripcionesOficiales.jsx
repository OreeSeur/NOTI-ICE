import { useEffect, useState } from "react";
import { obtenerMisInscripciones } from "../../services/inscripcionesService";

export const MisInscripcionesOficiales = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerMisInscripciones()
      .then((datos) => {
        if (!activo) return;
        setInscripciones(Array.isArray(datos) ? datos : []);
        setError("");
      })
      .catch(() => {
        if (!activo) return;
        setInscripciones([]);
        setError("No fue posible cargar tus inscripciones.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">
        Mis inscripciones académicas
      </h2>

      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Materias y grupos registrados oficialmente en el sistema.
      </p>

      {cargando && <p className="mt-4 text-sm">Cargando inscripciones...</p>}

      {!cargando && error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {!cargando && !error && inscripciones.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No tienes inscripciones académicas registradas.
        </p>
      )}

      {!cargando && !error && (
        <div className="mt-4 space-y-3">
          {inscripciones.map((inscripcion) => (
            <div
              key={inscripcion.idGrupoAlumno}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-600"
            >
              <h3 className="font-semibold text-slate-800 dark:text-white">
                {inscripcion.materiaNombre}
              </h3>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Docente: {inscripcion.docenteNombre}
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                Grupo {inscripcion.idGrupo} · {inscripcion.grupoTipoNombre}
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                {inscripcion.dias} ·{" "}
                {String(inscripcion.horaInicio).slice(0, 5)} a{" "}
                {String(inscripcion.horaFin).slice(0, 5)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
