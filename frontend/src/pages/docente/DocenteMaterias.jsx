import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ROUTES } from "../../constants/routes";
import { isApiDataSource } from "../../config/appConfig";
import {
  obtenerGruposOferta,
  obtenerHorarioGrupo,
  obtenerPeriodosOferta,
} from "../../services/ofertaAcademicaService";
import {
  ESTADOS_SOLICITUD,
  ESTILO_ESTADO,
  cancelarSolicitud,
  describirUnidad,
  obtenerMisSolicitudes,
  solicitarUnidad,
} from "../../services/solicitudesDocentesService";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800";
const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-white";
const boton = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
const lista = (valor) => (Array.isArray(valor) ? valor : []);
const mensajeError = (error) => error?.message || "No se pudo completar la operación.";
const fecha = (valor) => (valor ? new Date(valor).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "");
const docentesTexto = (docentes = []) =>
  docentes.map((d) => (d.tipo === "VACANTE" ? "Vacante" : d.nombrePublicado || "Sin nombre")).join(", ") ||
  "Sin docente publicado";

const vigente = (s) => s.estado === ESTADOS_SOLICITUD.PENDIENTE || s.estado === ESTADOS_SOLICITUD.APROBADA;

export const DocenteMaterias = () => {
  const [solicitudes, setSolicitudes] = useState(null);
  const [periodos, setPeriodos] = useState([]);
  const [periodo, setPeriodo] = useState("");
  const [plan, setPlan] = useState("2024");
  const [grupos, setGrupos] = useState({ clave: "", items: [] });
  const [codigoGrupo, setCodigoGrupo] = useState("");
  const [detalle, setDetalle] = useState({ clave: "", datos: null });
  const [enOperacion, setEnOperacion] = useState(null);
  const [aviso, setAviso] = useState({ tipo: "", texto: "" });

  const claveGrupos = `${periodo}|${plan}`;
  const claveDetalle = `${periodo}|${plan}|${codigoGrupo}`;
  const cargandoGrupos = Boolean(periodo) && grupos.clave !== claveGrupos;
  const cargandoDetalle = Boolean(codigoGrupo) && detalle.clave !== claveDetalle;

  const recargarSolicitudes = useCallback(
    () => obtenerMisSolicitudes()
      .then((r) => setSolicitudes(lista(r)))
      .catch((err) => { setSolicitudes([]); setAviso({ tipo: "error", texto: mensajeError(err) }); }),
    []
  );

  useEffect(() => {
    if (!isApiDataSource()) return;
    recargarSolicitudes();
    obtenerPeriodosOferta()
      .then((r) => {
        const items = lista(r);
        setPeriodos(items);
        setPeriodo((actual) => actual || items[0]?.clave || "");
      })
      .catch((err) => setAviso({ tipo: "error", texto: mensajeError(err) }));
  }, [recargarSolicitudes]);

  useEffect(() => {
    if (!periodo || !isApiDataSource()) return;
    let activo = true;
    obtenerGruposOferta({ periodo, plan })
      .then((r) => { if (activo) setGrupos({ clave: claveGrupos, items: lista(r) }); })
      .catch((err) => {
        if (!activo) return;
        setGrupos({ clave: claveGrupos, items: [] });
        setAviso({ tipo: "error", texto: mensajeError(err) });
      });
    return () => { activo = false; };
  }, [periodo, plan, claveGrupos]);

  useEffect(() => {
    if (!periodo || !codigoGrupo || !isApiDataSource()) return;
    let activo = true;
    obtenerHorarioGrupo({ codigoGrupo, periodo, plan })
      .then((r) => { if (activo) setDetalle({ clave: claveDetalle, datos: r }); })
      .catch((err) => {
        if (!activo) return;
        setDetalle({ clave: claveDetalle, datos: null });
        setAviso({ tipo: "error", texto: mensajeError(err) });
      });
    return () => { activo = false; };
  }, [codigoGrupo, periodo, plan, claveDetalle]);

  // Solicitud vigente del docente por unidad, para mostrar su estado junto al botón.
  const vigentesPorUnidad = useMemo(() => {
    const mapa = new Map();
    lista(solicitudes).filter(vigente).forEach((s) => mapa.set(s.idUnidadOferta, s));
    return mapa;
  }, [solicitudes]);

  const solicitar = async (unidad) => {
    if (enOperacion !== null) return;
    setEnOperacion(`u-${unidad.idUnidadOferta}`);
    setAviso({ tipo: "", texto: "" });
    try {
      const r = await solicitarUnidad(unidad.idUnidadOferta);
      setAviso({ tipo: "ok", texto: r?.mensaje || "Solicitud enviada." });
      await recargarSolicitudes();
    } catch (err) {
      setAviso({ tipo: "error", texto: mensajeError(err) });
    } finally {
      setEnOperacion(null);
    }
  };

  // Confirmación con el modal del portal (window.confirm puede estar bloqueado en el navegador).
  const [porCancelar, setPorCancelar] = useState(null);

  const cancelar = async (s) => {
    setPorCancelar(null);
    if (enOperacion !== null) return;
    setEnOperacion(`s-${s.idSolicitud}`);
    setAviso({ tipo: "", texto: "" });
    try {
      await cancelarSolicitud(s.idSolicitud);
      setAviso({ tipo: "ok", texto: "Solicitud actualizada." });
      await recargarSolicitudes();
    } catch (err) {
      setAviso({ tipo: "error", texto: mensajeError(err) });
    } finally {
      setEnOperacion(null);
    }
  };

  const unidades = detalle.clave === claveDetalle ? lista(detalle.datos?.unidades) : [];
  const aprobadas = lista(solicitudes).filter((s) => s.estado === ESTADOS_SOLICITUD.APROBADA).length;

  if (!isApiDataSource()) {
    return (
      <section className={card} role="status">
        La solicitud de materias está disponible únicamente cuando NOTI ICE utiliza la API.
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mis materias como docente</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Solicita las materias y laboratorios que impartes. Un Administrador revisará cada solicitud;
          cuando la apruebe podrás elegir esa materia como destinataria al publicar eventos y documentos,
          y los verán los alumnos que la agregaron a su perfil.
        </p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          La aprobación es un permiso dentro del portal: no es una asignación oficial del IPN ni cambia el horario publicado.
          Cada materia de un grupo puede tener un solo docente aprobado.
        </p>
        {aprobadas > 0 && (
          <Link to={ROUTES.EVENTOS_NUEVO} className="inline-block text-sm font-semibold text-[#6F1D46] hover:underline dark:text-pink-200">
            Publicar un evento para mis materias aprobadas
          </Link>
        )}
      </header>

      {aviso.texto && (
        <p
          role={aviso.tipo === "error" ? "alert" : "status"}
          className={`rounded-lg p-3 text-sm ${aviso.tipo === "error"
            ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
            : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"}`}
        >
          {aviso.texto}
        </p>
      )}

      <section className={card} aria-label="Mis solicitudes">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-white">Mis solicitudes</h2>
        {solicitudes === null && <p className="text-sm text-slate-500" role="status">Cargando…</p>}
        {solicitudes?.length === 0 && (
          <p className="text-sm text-slate-500">Todavía no has solicitado materias. Elige un grupo abajo.</p>
        )}
        <ul className="space-y-3">
          {lista(solicitudes).map((s) => (
            <li key={s.idSolicitud} className="rounded-xl border border-slate-200 p-4 dark:border-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTILO_ESTADO[s.estado] || ""}`}>
                  {s.estado}
                </span>
                <strong className="text-slate-800 dark:text-white">{describirUnidad(s)}</strong>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Periodo {s.periodo} · plan {s.plan} · semestre {s.semestre}
                {s.turno ? ` · ${s.turno}` : ""} · solicitada el {fecha(s.fechaSolicitud)}
              </p>
              {s.motivo && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Motivo{s.administradorNombre ? ` (${s.administradorNombre})` : ""}: {s.motivo}
                </p>
              )}
              {vigente(s) && (
                <button
                  type="button"
                  onClick={() => setPorCancelar(s)}
                  disabled={enOperacion !== null}
                  className={`${boton} mt-3 border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700`}
                >
                  {enOperacion === `s-${s.idSolicitud}` ? "Guardando…"
                    : s.estado === ESTADOS_SOLICITUD.APROBADA ? "Dejar esta materia" : "Retirar solicitud"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={card} aria-label="Solicitar materias">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-white">Solicitar materias</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Periodo
            <select className={campo} value={periodo} onChange={(e) => { setPeriodo(e.target.value); setCodigoGrupo(""); }}>
              {!periodo && <option value="">Sin periodos disponibles</option>}
              {periodos.map((p) => <option key={p.clave} value={p.clave}>{p.clave}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Plan
            <select className={campo} value={plan} onChange={(e) => { setPlan(e.target.value); setCodigoGrupo(""); }}>
              <option value="2024">2024</option>
              <option value="2004">2004</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Grupo
            <select className={campo} value={codigoGrupo} onChange={(e) => setCodigoGrupo(e.target.value)} disabled={!periodo || cargandoGrupos}>
              <option value="">Seleccionar grupo</option>
              {grupos.items.map((g) => (
                <option key={g.idGrupoOferta} value={g.codigoGrupo}>{g.codigoGrupo} — {g.semestre}° semestre</option>
              ))}
            </select>
          </label>
        </div>
        {cargandoGrupos && <p className="mt-3 text-sm text-slate-500" role="status">Consultando grupos…</p>}

        <div className="mt-4 space-y-3">
          {!codigoGrupo && <p className="text-sm text-slate-500">Selecciona un grupo para ver sus materias y laboratorios.</p>}
          {cargandoDetalle && <p className="text-sm text-slate-500" role="status">Cargando materias…</p>}
          {unidades.map((u) => {
            const mia = vigentesPorUnidad.get(u.idUnidadOferta);
            return (
              <article key={u.idUnidadOferta} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-600">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-white">
                    {u.nombrePublicado}{u.esLaboratorio ? " (laboratorio)" : ""}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Docencia publicada: {docentesTexto(u.docentes)}</p>
                </div>
                {mia ? (
                  <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${ESTILO_ESTADO[mia.estado] || ""}`}>
                    {mia.estado === ESTADOS_SOLICITUD.APROBADA ? "Aprobada" : "Solicitud pendiente"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => solicitar(u)}
                    disabled={enOperacion !== null || solicitudes === null}
                    className={`${boton} shrink-0 bg-[#6F1D46] text-white hover:opacity-90`}
                  >
                    {enOperacion === `u-${u.idUnidadOferta}` ? "Enviando…" : "Solicitar"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <ConfirmModal
        isOpen={Boolean(porCancelar)}
        title={porCancelar?.estado === ESTADOS_SOLICITUD.APROBADA ? "Dejar materia" : "Retirar solicitud"}
        message={!porCancelar ? "" : porCancelar.estado === ESTADOS_SOLICITUD.APROBADA
          ? `¿Dejar ${describirUnidad(porCancelar)}? Ya no podrás publicar para sus alumnos; para recuperarla tendrás que solicitarla de nuevo.`
          : `¿Retirar la solicitud de ${describirUnidad(porCancelar)}?`}
        confirmLabel={porCancelar?.estado === ESTADOS_SOLICITUD.APROBADA ? "Dejar materia" : "Retirar"}
        onConfirm={() => cancelar(porCancelar)}
        onCancel={() => setPorCancelar(null)}
      />
    </div>
  );
};
