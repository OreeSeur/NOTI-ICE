import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth/useAuth";
import { ROUTES } from "../../constants/routes";
import { ID_SECCION_MIS_MATERIAS } from "../../components/profile/MisMateriasOferta";
import { ROLES, normalizeRole } from "../../constants/roles";
import { isApiDataSource } from "../../config/appConfig";
import {
  agregarMateriaOferta,
  quitarMateriaOferta,
  obtenerMisMateriasOferta,
  buscarUnidadesOferta,
  obtenerGruposOferta,
  obtenerHorarioGrupo,
  obtenerMateriasCatalogo,
  obtenerPeriodosOferta,
} from "../../services/ofertaAcademicaService";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800";
const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
const dias = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const lista = (valor) => Array.isArray(valor) ? valor : Array.isArray(valor?.items) ? valor.items : Array.isArray(valor?.materias) ? valor.materias : Array.isArray(valor?.resultados) ? valor.resultados : [];
const hora = (valor) => typeof valor === "string" ? valor.slice(0, 5) : String(valor ?? "");
const mensajeError = (error) => error?.message || "No se pudo consultar la información académica.";

export const HorariosAcademicos = () => {
  const { user } = useAuth();
  const esAlumno = normalizeRole(user?.rol) === ROLES.ALUMNO;
  const [misMaterias, setMisMaterias] = useState([]);
  const [cargandoMisMaterias, setCargandoMisMaterias] = useState(false);
  const [unidadEnOperacion, setUnidadEnOperacion] = useState(null);
  const [errorMisMaterias, setErrorMisMaterias] = useState("");
  const [periodos, setPeriodos] = useState([]);
  const [periodo, setPeriodo] = useState("");
  const [plan, setPlan] = useState("2024");
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [codigoGrupo, setCodigoGrupo] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState(null);
  const [cargandoBase, setCargandoBase] = useState(false);
  const [cargandoGrupo, setCargandoGrupo] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isApiDataSource()) return;
    let vigente = true;
    obtenerPeriodosOferta()
      .then((respuesta) => {
        if (!vigente) return;
        const elementos = lista(respuesta);
        setPeriodos(elementos);
        setPeriodo((actual) => actual || elementos[0]?.clave || "");
      })
      .catch((err) => { if (vigente) setError(mensajeError(err)); });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    if (!periodo || !isApiDataSource()) return;
    let vigente = true;
    setCargandoBase(true);
    setError("");
    setCodigoGrupo("");
    setDetalle(null);
    setResultados(null);
    Promise.all([
      obtenerGruposOferta({ periodo, plan }),
      obtenerMateriasCatalogo(plan),
    ]).then(([gruposRespuesta, materiasRespuesta]) => {
      if (!vigente) return;
      setGrupos(lista(gruposRespuesta));
      setMaterias(lista(materiasRespuesta));
    }).catch((err) => {
      if (vigente) { setError(mensajeError(err)); setGrupos([]); setMaterias([]); }
    }).finally(() => { if (vigente) setCargandoBase(false); });
    return () => { vigente = false; };
  }, [periodo, plan]);

  useEffect(() => {
    if (!periodo || !codigoGrupo || !isApiDataSource()) return;
    let vigente = true;
    setCargandoGrupo(true);
    setError("");
    setDetalle(null);
    obtenerHorarioGrupo({ codigoGrupo, periodo, plan })
      .then((respuesta) => { if (vigente) setDetalle(respuesta); })
      .catch((err) => { if (vigente) setError(mensajeError(err)); })
      .finally(() => { if (vigente) setCargandoGrupo(false); });
    return () => { vigente = false; };
  }, [codigoGrupo, periodo, plan]);

  useEffect(() => {
    if (!esAlumno || !isApiDataSource()) return;
    let vigente = true;
    setCargandoMisMaterias(true);
    obtenerMisMateriasOferta()
      .then((respuesta) => { if (vigente) setMisMaterias(lista(respuesta)); })
      .catch((err) => { if (vigente) setErrorMisMaterias(mensajeError(err)); })
      .finally(() => { if (vigente) setCargandoMisMaterias(false); });
    return () => { vigente = false; };
  }, [esAlumno]);

  const alternarMateria = async (unidad) => {
    const id = unidad.idUnidadOferta;
    if (!esAlumno || unidadEnOperacion !== null) return;
    const agregada = misMaterias.some((m) => m.idUnidadOferta === id);
    setUnidadEnOperacion(id);
    setErrorMisMaterias("");
    try {
      if (agregada) {
        await quitarMateriaOferta(id);
        setMisMaterias((anteriores) => anteriores.filter((m) => m.idUnidadOferta !== id));
      } else {
        await agregarMateriaOferta(id);
        setMisMaterias((anteriores) => [...anteriores, { idUnidadOferta: id }]);
      }
    } catch (err) {
      setErrorMisMaterias(mensajeError(err));
    } finally {
      setUnidadEnOperacion(null);
    }
  };

  const realizarBusqueda = async (evento) => {
    evento.preventDefault();
    const materia = busqueda.trim();
    if (!periodo || !materia || buscando) return;
    setBuscando(true);
    setError("");
    setResultados(null);
    try {
      setResultados(lista(await buscarUnidadesOferta({ periodo, materia, plan })));
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Materias y horarios académicos</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Consulta la oferta de grupos, laboratorios, aulas y docentes publicados por periodo escolar.
        </p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          Información de referencia académica. Los horarios del periodo 2027-1 son una muestra documental;
          confirma su vigencia en los canales oficiales del IPN antes de tomar decisiones escolares.
        </p>
      </header>

      {!isApiDataSource() ? (
        <section className={card} role="status">
          La consulta institucional está disponible únicamente cuando NOTI ICE utiliza la API.
          No se mostrarán datos locales como si fueran horarios oficiales.
        </section>
      ) : (
        <>
          <section className={card} aria-label="Filtros de oferta académica">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Periodo
                <select className={campo} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                  {!periodo && <option value="">Sin periodos disponibles</option>}
                  {periodos.map((p) => <option key={p.clave} value={p.clave}>{p.clave}{p.descripcion ? ` — ${p.descripcion}` : ""}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Plan
                <select className={campo} value={plan} onChange={(e) => setPlan(e.target.value)}>
                  <option value="2024">2024</option>
                  <option value="2004">2004</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Grupo
                <select className={campo} value={codigoGrupo} onChange={(e) => setCodigoGrupo(e.target.value)} disabled={!periodo || cargandoBase}>
                  <option value="">Seleccionar grupo</option>
                  {grupos.map((g) => <option key={g.idGrupoOferta} value={g.codigoGrupo}>{g.codigoGrupo} — {g.semestre}° semestre</option>)}
                </select>
              </label>
            </div>
            {cargandoBase && <p className="mt-3 text-sm text-slate-500" role="status">Consultando grupos y materias…</p>}
            {!cargandoBase && periodo && grupos.length === 0 && <p className="mt-3 text-sm text-slate-500">No hay grupos disponibles para este periodo y plan.</p>}
            {error && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{error}</p>}
          </section>

          {esAlumno && (
            <div className="flex flex-col gap-2 rounded-xl border border-[#6F1D46]/20 bg-[#6F1D46]/5 p-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between dark:border-pink-300/20 dark:bg-pink-300/5 dark:text-slate-200">
              <p>
                Elige tu grupo y pulsa «Agregar a mis materias» en cada materia o laboratorio que cursas
                ({misMaterias.length} agregada{misMaterias.length === 1 ? "" : "s"}). No son inscripciones escolares certificadas.
              </p>
              <Link
                to={`${ROUTES.PERFIL}#${ID_SECCION_MIS_MATERIAS}`}
                className="shrink-0 font-semibold text-[#6F1D46] hover:underline dark:text-pink-200"
              >
                Ver mi horario en el perfil
              </Link>
            </div>
          )}
          {esAlumno && errorMisMaterias && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {errorMisMaterias}
            </p>
          )}

          <section className={card} aria-label="Detalle del horario">
            <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-white">Horario por grupo</h2>
            {!codigoGrupo && <p className="text-sm text-slate-500">Selecciona un grupo para ver las sesiones y sus docentes.</p>}
            {cargandoGrupo && <p className="text-sm text-slate-500" role="status">Cargando horario…</p>}
            {detalle && !cargandoGrupo && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {detalle.grupo?.codigoGrupo} · {detalle.grupo?.periodo} · Plan {detalle.grupo?.plan}
                </p>
                {(detalle.unidades || []).map((unidad) => (
                  <article key={unidad.idUnidadOferta} className="rounded-xl border border-slate-200 p-4 dark:border-slate-600">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-800 dark:text-white">{unidad.nombrePublicado}</h3>
                      {unidad.esLaboratorio && <span className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">Laboratorio</span>}
                    </div>
                    {esAlumno && (
                      <button
                        type="button"
                        onClick={() => alternarMateria(unidad)}
                        disabled={cargandoMisMaterias || unidadEnOperacion !== null}
                        className="mt-3 rounded-lg bg-[#6F1D46] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        {unidadEnOperacion === unidad.idUnidadOferta
                          ? "Guardando…"
                          : misMaterias.some((m) => m.idUnidadOferta === unidad.idUnidadOferta)
                            ? "Quitar de mis materias"
                            : "Agregar a mis materias"}
                      </button>
                    )}
                    <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      {(unidad.sesiones || []).map((sesion, indice) => (
                        <p key={`${unidad.idUnidadOferta}-${indice}`}>
                          {dias[sesion.diaSemana] || `Día ${sesion.diaSemana}`}: {hora(sesion.horaInicio)}–{hora(sesion.horaFin)}
                          {sesion.aula ? ` · Aula ${sesion.aula}` : ""}
                        </p>
                      ))}
                      {(!unidad.sesiones || unidad.sesiones.length === 0) && <p>Horario pendiente de publicación.</p>}
                      <p>
                        Docencia: {(unidad.docentes || []).map((d) => d.tipo === "VACANTE" ? "Vacante" : d.nombrePublicado || "Sin nombre publicado").join(", ") || "Sin información publicada"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={card} aria-label="Búsqueda de materias">
            <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-white">Buscar materia o laboratorio</h2>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={realizarBusqueda}>
              <input
                className={campo}
                type="search"
                maxLength={120}
                placeholder="Ej. Fundamentos de programación"
                aria-label="Nombre de materia a buscar"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button className="rounded-lg bg-[#6F1D46] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={!periodo || !busqueda.trim() || buscando}>
                {buscando ? "Buscando…" : "Buscar"}
              </button>
            </form>
            {resultados && (
              <div className="mt-4 space-y-2" role="status">
                <p className="text-sm text-slate-500">{resultados.length} coincidencias.</p>
                {resultados.map((unidad, indice) => (
                  <p key={`${unidad.codigoGrupo}-${unidad.nombrePublicado}-${indice}`} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-600">
                    <strong>{unidad.codigoGrupo}</strong> — {unidad.nombrePublicado}
                    {unidad.esLaboratorio ? " (laboratorio)" : ""}
                    {unidad.aulaPublicada ? ` · Aula ${unidad.aulaPublicada}` : ""}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section className={card} aria-label="Catálogo de materias">
            <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-white">Materias del catálogo · plan {plan}</h2>
            <p className="mb-3 text-sm text-slate-500">Las claves oficiales del IPN solo se muestran cuando han sido verificadas.</p>
            {materias.length === 0 && !cargandoBase && <p className="text-sm text-slate-500">No hay materias cargadas para este plan.</p>}
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {materias.map((materia) => (
                <li key={materia.idMateriaCatalogo} className="rounded-lg border border-slate-200 p-3 dark:border-slate-600">
                  <strong>{materia.nombre}</strong> · Semestre {materia.semestre}
                  {materia.claveOficialVerificada && materia.claveOficialIPN ? ` · Clave IPN: ${materia.claveOficialIPN}` : " · Clave oficial pendiente de verificación"}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};
