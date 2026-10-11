import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AcademicTargetSummary } from "../../components/common/AcademicTargetSummary";
import { AudienceSummary } from "../../components/common/AudienceSummary";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useEventos } from "../../context/eventos/useEventos";
import {
  getItemAudience,
  getPriorityLabel,
  getPriorityVariant,
} from "../../utils/audience";
import { mismoId } from "../../utils/id";

export const EventoDetalle = () => {
  const { id } = useParams();
  const { eventos } = useEventos();

  const evento = eventos.find((item) => mismoId(item.id, id));

  if (!evento) {
    return (
      <section className="space-y-6">
        <EmptyState
          icon={CalendarDays}
          title="Evento no encontrado"
          message="El evento pudo haber sido eliminado o la dirección no es correcta."
        />

        <Link
          to="/eventos"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6F1D46] px-5 py-3 font-semibold text-white transition hover:opacity-90"
        >
          <ArrowLeft size={18} />
          Volver a Eventos
        </Link>
      </section>
    );
  }

  const audiencia = getItemAudience(evento);

  return (
    <section className="space-y-6">
      <Link
        to="/eventos"
        className="inline-flex items-center gap-2 font-semibold text-[#6F1D46] transition hover:gap-3 dark:text-pink-100"
      >
        <ArrowLeft size={18} />
        Volver a Eventos
      </Link>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#6F1D46] via-[#750946] to-[#636569] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mb-5 flex flex-wrap items-center gap-3">
            <StatusBadge label={evento.categoria || "Evento"} variant="primary" className="bg-white/15 text-white" />
            <StatusBadge
              label={getPriorityLabel(audiencia.prioridad)}
              variant={getPriorityVariant(audiencia.prioridad)}
              className="bg-white/15 text-white"
            />
          </div>

          <h1 className="relative text-3xl font-black tracking-tight sm:text-4xl">{evento.titulo}</h1>

          <div className="mt-5 grid gap-3 text-sm text-white/85 sm:grid-cols-2 sm:text-base">
            <p className="inline-flex items-center gap-2">
              <CalendarDays size={18} />
              {evento.fecha || "Sin fecha"}
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin size={18} />
              {evento.lugar || "Lugar por confirmar"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] sm:p-8">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/30">
            <h2 className="mb-3 text-lg font-black text-slate-900 dark:text-white">
              Descripción
            </h2>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              {evento.descripcion}
            </p>
          </div>

          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <div>
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#6F1D46] dark:text-slate-300">
                Datos académicos
              </h2>
              <AcademicTargetSummary item={evento} />
            </div>

            <div>
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#6F1D46] dark:text-slate-300">
                Dirigido a
              </h2>
              <AudienceSummary item={evento} />
            </div>
          </aside>
        </div>
      </article>
    </section>
  );
};
