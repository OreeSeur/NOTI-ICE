import { useCallback, useEffect, useState } from "react";

import { isApiDataSource } from "../../../config/appConfig";
import { SuscritosUnidad } from "../../../components/common/SuscritosUnidad";
import {
  ESTADOS_SOLICITUD,
  ESTILO_ESTADO,
  aprobarSolicitud,
  describirUnidad,
  listarSolicitudes,
  rechazarSolicitud,
  revocarSolicitud,
} from "../../../services/solicitudesDocentesService";

const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800";
const boton = "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
const lista = (valor) => (Array.isArray(valor) ? valor : []);
const mensajeError = (error) => error?.message || "No se pudo completar la operación.";
const fecha = (valor) =>
  valor ? new Date(valor).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "";

const FILTROS = [
  { valor: ESTADOS_SOLICITUD.PENDIENTE, etiqueta: "Pendientes" },
  { valor: ESTADOS_SOLICITUD.APROBADA, etiqueta: "Aprobadas" },
  { valor: "", etiqueta: "Historial completo" },
];

// Formulario breve para rechazar o revocar: el motivo es obligatorio y lo ve el docente.
const FormularioMotivo = ({ accion, onConfirmar, onCancelar, ocupado }) => {
  const [motivo, setMotivo] = useState("");
  const valido = motivo.trim().length >= 5;
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => { e.preventDefault(); if (valido) onConfirmar(motivo.trim()); }}
    >
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
        Motivo ({accion === "rechazar" ? "se mostrará al docente" : "se mostrará al docente al revocar"})
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          rows={2}
          maxLength={300}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          autoFocus
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!valido || ocupado} className={`${boton} bg-red-700 text-white hover:opacity-90`}>
          {ocupado ? "Guardando…" : accion === "rechazar" ? "Confirmar rechazo" : "Confirmar revocación"}
        </button>
        <button type="button" onClick={onCancelar} disabled={ocupado} className={`${boton} border border-slate-300 dark:border-slate-500 dark:text-slate-200`}>
          Cancelar
        </button>
      </div>
      {!valido && motivo.length > 0 && <p className="text-xs text-slate-500">Escribe al menos 5 caracteres.</p>}
    </form>
  );
};

export const AdminSolicitudesDocentes = () => {
  const [filtro, setFiltro] = useState(ESTADOS_SOLICITUD.PENDIENTE);
  const [datos, setDatos] = useState({ filtro: null, items: [], error: false });
  const [formulario, setFormulario] = useState(null); // { id, accion }
  const [enOperacion, setEnOperacion] = useState(null);
  const [aviso, setAviso] = useState({ tipo: "", texto: "" });
  const cargando = datos.filtro !== filtro;

  const recargar = useCallback(
    (estado) => listarSolicitudes(estado)
      .then((r) => setDatos({ filtro: estado, items: lista(r), error: false }))
      .catch((err) => {
        setDatos({ filtro: estado, items: [], error: true });
        setAviso({ tipo: "error", texto: mensajeError(err) });
      }),
    []
  );

  useEffect(() => {
    if (isApiDataSource()) recargar(filtro);
  }, [filtro, recargar]);

  const ejecutar = async (id, operacion, textoOk) => {
    if (enOperacion !== null) return;
    setEnOperacion(id);
    setAviso({ tipo: "", texto: "" });
    try {
      const r = await operacion();
      setAviso({ tipo: "ok", texto: r?.mensaje || textoOk });
      setFormulario(null);
    } catch (err) {
      setAviso({ tipo: "error", texto: mensajeError(err) });
    } finally {
      setEnOperacion(null);
      // Se recarga también en error: otro Administrador pudo resolverla antes.
      await recargar(filtro);
    }
  };

  if (!isApiDataSource()) {
    return <section className={card} role="status">Esta sección está disponible únicamente con la API.</section>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Solicitudes de docentes</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Los docentes solicitan las materias y laboratorios que imparten. Al aprobar, el docente puede publicar
          eventos y documentos para los alumnos que agregaron esa materia. Cada materia de un grupo admite un solo
          docente aprobado: al aprobar una solicitud, las demás pendientes de esa materia se rechazan.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar solicitudes">
        {FILTROS.map((f) => (
          <button
            key={f.etiqueta}
            type="button"
            role="tab"
            aria-selected={filtro === f.valor}
            onClick={() => { setFiltro(f.valor); setFormulario(null); }}
            className={`${boton} ${filtro === f.valor
              ? "bg-[#6F1D46] text-white"
              : "border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700"}`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

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

      <section className={card} aria-label="Lista de solicitudes">
        {cargando && <p className="text-sm text-slate-500" role="status">Cargando…</p>}
        {!cargando && !datos.error && datos.items.length === 0 && (
          <p className="text-sm text-slate-500">
            {filtro === ESTADOS_SOLICITUD.PENDIENTE ? "No hay solicitudes pendientes." : "No hay solicitudes en esta vista."}
          </p>
        )}
        <ul className="space-y-3">
          {!cargando && datos.items.map((s) => (
            <li key={s.idSolicitud} className="rounded-xl border border-slate-200 p-4 dark:border-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTILO_ESTADO[s.estado] || ""}`}>
                  {s.estado}
                </span>
                <strong className="text-slate-800 dark:text-white">{describirUnidad(s)}</strong>
              </div>
              <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-2 dark:text-slate-300">
                <div><dt className="inline font-semibold">Docente solicitante: </dt><dd className="inline break-words">{s.docenteNombre} · {s.docenteCorreo}</dd></div>
                <div><dt className="inline font-semibold">Docencia en el horario: </dt><dd className="inline">{s.docentesPublicados?.join(", ") || "Sin docente publicado"}</dd></div>
                <div><dt className="inline font-semibold">Grupo: </dt><dd className="inline">Periodo {s.periodo} · plan {s.plan} · semestre {s.semestre}{s.turno ? ` · ${s.turno}` : ""}</dd></div>
                <div><dt className="inline font-semibold">Solicitada: </dt><dd className="inline">{fecha(s.fechaSolicitud)}</dd></div>
                {s.fechaResolucion && (
                  <div className="sm:col-span-2">
                    <dt className="inline font-semibold">Resolución: </dt>
                    <dd className="inline">{fecha(s.fechaResolucion)}{s.administradorNombre ? ` por ${s.administradorNombre}` : ""}{s.motivo ? ` — ${s.motivo}` : ""}</dd>
                  </div>
                )}
              </dl>

              {s.estado === ESTADOS_SOLICITUD.PENDIENTE && formulario?.id !== s.idSolicitud && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={enOperacion !== null}
                    onClick={() => ejecutar(s.idSolicitud, () => aprobarSolicitud(s.idSolicitud), "Solicitud aprobada.")}
                    className={`${boton} bg-emerald-700 text-white hover:opacity-90`}
                  >
                    {enOperacion === s.idSolicitud ? "Guardando…" : "Aprobar"}
                  </button>
                  <button
                    type="button"
                    disabled={enOperacion !== null}
                    onClick={() => setFormulario({ id: s.idSolicitud, accion: "rechazar" })}
                    className={`${boton} border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30`}
                  >
                    Rechazar
                  </button>
                </div>
              )}
              {s.estado === ESTADOS_SOLICITUD.APROBADA && <SuscritosUnidad idUnidadOferta={s.idUnidadOferta} />}
              {s.estado === ESTADOS_SOLICITUD.APROBADA && formulario?.id !== s.idSolicitud && (
                <button
                  type="button"
                  disabled={enOperacion !== null}
                  onClick={() => setFormulario({ id: s.idSolicitud, accion: "revocar" })}
                  className={`${boton} mt-3 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30`}
                >
                  Revocar asignación
                </button>
              )}
              {formulario?.id === s.idSolicitud && (
                <FormularioMotivo
                  accion={formulario.accion}
                  ocupado={enOperacion === s.idSolicitud}
                  onCancelar={() => setFormulario(null)}
                  onConfirmar={(motivo) => ejecutar(
                    s.idSolicitud,
                    () => (formulario.accion === "rechazar"
                      ? rechazarSolicitud(s.idSolicitud, motivo)
                      : revocarSolicitud(s.idSolicitud, motivo)),
                    formulario.accion === "rechazar" ? "Solicitud rechazada." : "Asignación revocada."
                  )}
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
