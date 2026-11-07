import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, CalendarDays, Plus } from "lucide-react";

import { ConfirmModal } from "../ui/ConfirmModal";
import { isApiDataSource } from "../../config/appConfig";
import { ROUTES } from "../../constants/routes";
import {
  obtenerMisMateriasOferta,
  quitarMateriaOferta,
  quitarTodasMisMateriasOferta,
} from "../../services/ofertaAcademicaService";

// Sección única del perfil del Alumno: sus materias de los horarios (oferta por periodo),
// presentadas como horario semanal y como lista. Son selecciones voluntarias del portal,
// no inscripciones escolares del IPN. Para agregar materias se usa la consulta de horarios.

export const ID_SECCION_MIS_MATERIAS = "mis-materias";

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_CORTOS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
// Colores por materia, legibles en modo claro y oscuro.
const COLORES = [
  "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100",
  "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100",
  "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100",
  "bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100",
  "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-900/40 dark:text-fuchsia-100",
];

const hora = (valor) => (typeof valor === "string" ? valor.slice(0, 5) : String(valor ?? ""));
const minutos = (valor) => {
  const [h, m] = hora(valor).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
// "(lab.)" solo si el nombre publicado no dice ya que es laboratorio.
const nombreMateria = (m) =>
  `${m.nombrePublicado}${m.esLaboratorio && !/^laboratorio/i.test(m.nombrePublicado || "") ? " (lab.)" : ""}`;
const docentesTexto = (docentes = []) =>
  docentes.map((d) => (d.tipo === "VACANTE" ? "Vacante" : d.nombrePublicado || "Sin publicar")).join(", ") ||
  "Sin información publicada";

// Sesiones planas con su materia, para armar la tabla y detectar empalmes.
const aplanarSesiones = (materias) =>
  materias.flatMap((m, indice) =>
    (m.sesiones || []).map((s) => ({
      ...s,
      inicio: minutos(s.horaInicio),
      fin: minutos(s.horaFin),
      materia: m,
      color: COLORES[indice % COLORES.length],
    }))
  );

const detectarEmpalmes = (sesiones) => {
  const empalmes = [];
  for (let dia = 1; dia <= 7; dia += 1) {
    const delDia = sesiones.filter((s) => s.diaSemana === dia).sort((a, b) => a.inicio - b.inicio);
    for (let i = 0; i < delDia.length; i += 1) {
      for (let j = i + 1; j < delDia.length && delDia[j].inicio < delDia[i].fin; j += 1) {
        if (delDia[i].materia.idUnidadOferta === delDia[j].materia.idUnidadOferta) continue;
        empalmes.push({ dia, a: delDia[i], b: delDia[j] });
      }
    }
  }
  return empalmes;
};

const HorarioSemanal = ({ sesiones }) => {
  // Columnas: lunes a viernes siempre; sábado y domingo solo si hay clases.
  const dias = [1, 2, 3, 4, 5, 6, 7].filter((d) => d <= 5 || sesiones.some((s) => s.diaSemana === d));
  // Filas: cada franja horaria distinta (inicio–fin) que aparece en las sesiones.
  const franjas = [...new Map(sesiones.map((s) => [`${s.inicio}-${s.fin}`, s])).values()]
    .sort((a, b) => a.inicio - b.inicio || a.fin - b.fin);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <caption className="sr-only">Horario semanal de mis materias</caption>
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/40">
            <th scope="col" className="w-24 p-2 text-left font-semibold text-slate-600 dark:text-slate-300">Hora</th>
            {dias.map((d) => (
              <th key={d} scope="col" className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">
                <span className="hidden sm:inline">{DIAS[d]}</span>
                <span className="sm:hidden">{DIAS_CORTOS[d]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {franjas.map((f) => (
            <tr key={`${f.inicio}-${f.fin}`} className="border-t border-slate-200 align-top dark:border-slate-600">
              <th scope="row" className="whitespace-nowrap p-2 text-left font-medium text-slate-600 dark:text-slate-300">
                {hora(f.horaInicio)}–{hora(f.horaFin)}
              </th>
              {dias.map((d) => {
                const clases = sesiones.filter((s) => s.diaSemana === d && s.inicio === f.inicio && s.fin === f.fin);
                return (
                  <td key={d} className="p-1.5">
                    <div className="space-y-1">
                      {clases.map((s, i) => (
                        <div key={`${s.materia.idUnidadOferta}-${i}`} className={`rounded-md px-2 py-1 ${s.color}`}>
                          <p className="font-semibold leading-tight">{nombreMateria(s.materia)}</p>
                          <p className="opacity-80">
                            {s.materia.codigoGrupo}{s.aula ? ` · ${s.aula}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const MisMateriasOferta = () => {
  const api = isApiDataSource();
  const [materias, setMaterias] = useState(null); // null = cargando
  const [quitando, setQuitando] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!api) return;
    let vigente = true;
    obtenerMisMateriasOferta()
      .then((respuesta) => { if (vigente) setMaterias(Array.isArray(respuesta) ? respuesta : []); })
      .catch((err) => {
        if (!vigente) return;
        setMaterias([]);
        setError(err?.message || "No se pudieron consultar tus materias.");
      });
    return () => { vigente = false; };
  }, [api]);

  // Al llegar desde «Ver mi horario en el perfil» (#mis-materias), desplazarse a la sección
  // cuando ya cargó su contenido (el resto del perfil puede cambiar de altura antes).
  const { hash } = useLocation();
  useEffect(() => {
    if (materias !== null && hash === `#${ID_SECCION_MIS_MATERIAS}`) {
      document.getElementById(ID_SECCION_MIS_MATERIAS)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [materias, hash]);

  const lista = useMemo(() => materias || [], [materias]);
  const sesiones = useMemo(() => aplanarSesiones(lista), [lista]);
  const empalmes = useMemo(() => detectarEmpalmes(sesiones), [sesiones]);
  const sinHorario = lista.filter((m) => !m.sesiones || m.sesiones.length === 0);

  // Confirmación con el modal del portal: los diálogos nativos (window.confirm) pueden estar
  // bloqueados en algunos navegadores y devolver "Cancelar" sin mostrarse.
  const [porQuitar, setPorQuitar] = useState(null);
  const [confirmarTodas, setConfirmarTodas] = useState(false);
  const [quitandoTodas, setQuitandoTodas] = useState(false);

  const quitarTodas = async () => {
    setConfirmarTodas(false);
    if (quitandoTodas || quitando !== null) return;
    setQuitandoTodas(true);
    setError("");
    try {
      await quitarTodasMisMateriasOferta();
      setMaterias([]);
    } catch (err) {
      setError(err?.message || "No se pudieron quitar las materias.");
    } finally {
      setQuitandoTodas(false);
    }
  };

  const quitar = async (materia) => {
    setPorQuitar(null);
    if (quitando !== null) return;
    setQuitando(materia.idUnidadOferta);
    setError("");
    try {
      await quitarMateriaOferta(materia.idUnidadOferta);
      setMaterias((anteriores) => (anteriores || []).filter((m) => m.idUnidadOferta !== materia.idUnidadOferta));
    } catch (err) {
      setError(err?.message || "No se pudo quitar la materia.");
    } finally {
      setQuitando(null);
    }
  };

  return (
    <section
      id={ID_SECCION_MIS_MATERIAS}
      className="scroll-mt-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-[#6F1D46]/10 p-2 text-[#6F1D46] dark:bg-pink-200/10 dark:text-pink-200">
            <CalendarDays size={22} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mis materias y horario</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Agrega las materias y laboratorios que cursas para ver tu horario y recibir los avisos que sus docentes
              publiquen. Es una selección voluntaria del portal, no una inscripción escolar del IPN.
            </p>
          </div>
        </div>
        {api && (
          <Link
            to={ROUTES.HORARIOS}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={16} aria-hidden="true" />
            Agregar materias
          </Link>
        )}
      </div>

      {!api && <p className="text-sm text-slate-500">Disponible al conectar la API.</p>}
      {api && materias === null && <p className="text-sm text-slate-500" role="status">Cargando tus materias…</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}

      {api && materias !== null && lista.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          Todavía no has agregado materias. Usa «Agregar materias», elige tu grupo y pulsa
          «Agregar a mis materias» en cada materia que cursas.
        </div>
      )}

      {sesiones.length > 0 && <HorarioSemanal sesiones={sesiones} />}

      {empalmes.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} aria-hidden="true" />
            {empalmes.length === 1 ? "Hay un empalme de horario" : `Hay ${empalmes.length} empalmes de horario`}
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-6">
            {empalmes.map((e, i) => (
              <li key={i}>
                {DIAS[e.dia]}: {nombreMateria(e.a.materia)} ({e.a.materia.codigoGrupo}, {hora(e.a.horaInicio)}–{hora(e.a.horaFin)})
                {" "}y {nombreMateria(e.b.materia)} ({e.b.materia.codigoGrupo}, {hora(e.b.horaInicio)}–{hora(e.b.horaFin)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {lista.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-white">
            {lista.length} materia{lista.length === 1 ? "" : "s"} seleccionada{lista.length === 1 ? "" : "s"}
          </h3>
          <button
            type="button"
            disabled={quitandoTodas || quitando !== null}
            onClick={() => setConfirmarTodas(true)}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            {quitandoTodas ? "Quitando…" : "Quitar todas las materias"}
          </button>
        </div>
      )}

      {lista.length > 0 && (
        <ul className="space-y-3">
          {lista.map((materia, indice) => (
            <li key={materia.idUnidadOferta} className="rounded-xl border border-slate-200 p-4 dark:border-slate-600">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                    <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${COLORES[indice % COLORES.length]}`} aria-hidden="true" />
                    {nombreMateria(materia)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Grupo {materia.codigoGrupo} · {materia.periodo} · Plan {materia.plan}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {(materia.sesiones || []).length > 0
                      ? (materia.sesiones || []).map((s) => `${DIAS_CORTOS[s.diaSemana] || "?"} ${hora(s.horaInicio)}–${hora(s.horaFin)}`).join(" · ")
                      : "Horario pendiente de publicación"}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Docencia: {docentesTexto(materia.docentes)}</p>
                </div>
                <button
                  type="button"
                  disabled={quitando !== null}
                  onClick={() => setPorQuitar(materia)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  {quitando === materia.idUnidadOferta ? "Quitando…" : "Quitar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {sinHorario.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {sinHorario.length === 1 ? "Una materia no tiene" : `${sinHorario.length} materias no tienen`} horario publicado
          y no aparece{sinHorario.length === 1 ? "" : "n"} en la tabla.
        </p>
      )}

      <ConfirmModal
        isOpen={Boolean(porQuitar)}
        title="Quitar materia"
        message={porQuitar
          ? `¿Quitar ${nombreMateria(porQuitar)} (${porQuitar.codigoGrupo}) de tus materias? Dejarás de ver su horario y de recibir sus avisos. Puedes volver a agregarla cuando quieras.`
          : ""}
        confirmLabel="Quitar"
        onConfirm={() => quitar(porQuitar)}
        onCancel={() => setPorQuitar(null)}
      />

      <ConfirmModal
        isOpen={confirmarTodas}
        title="Quitar todas las materias"
        message={`¿Quitar las ${lista.length} materias de tu perfil? Tu horario quedará vacío y dejarás de recibir sus avisos. Puedes volver a agregarlas desde la consulta de horarios.`}
        confirmLabel="Quitar todas"
        onConfirm={quitarTodas}
        onCancel={() => setConfirmarTodas(false)}
      />
    </section>
  );
};
