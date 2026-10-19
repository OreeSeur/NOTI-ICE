import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isApiDataSource } from "../../config/appConfig";
import { ROUTES } from "../../constants/routes";
import { obtenerMisMateriasOferta, quitarMateriaOferta } from "../../services/ofertaAcademicaService";

const dias = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const hora = (valor) => typeof valor === "string" ? valor.slice(0, 5) : String(valor ?? "");

export const MisMateriasOferta = () => {
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [quitando, setQuitando] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isApiDataSource()) { setCargando(false); return; }
    let vigente = true;
    obtenerMisMateriasOferta()
      .then((respuesta) => { if (vigente) setMaterias(Array.isArray(respuesta) ? respuesta : []); })
      .catch((err) => { if (vigente) setError(err?.message || "No se pudieron consultar tus materias."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  const quitar = async (idUnidadOferta) => {
    if (quitando !== null) return;
    setQuitando(idUnidadOferta);
    setError("");
    try {
      await quitarMateriaOferta(idUnidadOferta);
      setMaterias((anteriores) => anteriores.filter((m) => m.idUnidadOferta !== idUnidadOferta));
    } catch (err) {
      setError(err?.message || "No se pudo quitar la materia.");
    } finally {
      setQuitando(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mis materias de los horarios</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Selecciones voluntarias guardadas en NOTI ICE; no equivalen a una inscripción escolar certificada.
      </p>
      {!isApiDataSource() && <p className="mt-3 text-sm text-slate-500">Disponible al conectar la API.</p>}
      {cargando && <p className="mt-3 text-sm text-slate-500">Cargando tus materias…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      {!cargando && !error && materias.length === 0 && isApiDataSource() && (
        <p className="mt-3 text-sm text-slate-500">Todavía no has agregado materias de los horarios.</p>
      )}
      <ul className="mt-4 space-y-3">
        {materias.map((materia) => (
          <li key={materia.idUnidadOferta} className="rounded-xl border border-slate-200 p-4 dark:border-slate-600">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  {materia.nombrePublicado}{materia.esLaboratorio ? " · Laboratorio" : ""}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {materia.periodo} · Plan {materia.plan} · Grupo {materia.codigoGrupo}
                </p>
                {(materia.sesiones || []).map((sesion, indice) => (
                  <p key={indice} className="text-sm text-slate-600 dark:text-slate-300">
                    {dias[sesion.diaSemana] || "Día no especificado"} · {hora(sesion.horaInicio)}–{hora(sesion.horaFin)}
                    {sesion.aula ? ` · Aula ${sesion.aula}` : ""}
                  </p>
                ))}
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Docencia: {(materia.docentes || []).map((d) => d.tipo === "VACANTE" ? "Vacante" : d.nombrePublicado || "Sin publicar").join(", ") || "Sin información publicada"}
                </p>
              </div>
              <button
                type="button"
                disabled={quitando !== null}
                onClick={() => quitar(materia.idUnidadOferta)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300"
              >
                {quitando === materia.idUnidadOferta ? "Quitando…" : "Quitar"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Link to={ROUTES.HORARIOS} className="mt-4 inline-block text-sm font-semibold text-[#6F1D46] hover:underline dark:text-pink-200">
        Consultar más materias y horarios
      </Link>
    </section>
  );
};
