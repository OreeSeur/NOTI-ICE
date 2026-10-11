import { CalendarDays, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { InfoCard } from "../../components/cards/InfoCard";
import { AcademicTargetSummary } from "../../components/common/AcademicTargetSummary";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "../../components/common/PageHeader";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useEventos } from "../../context/eventos/useEventos";
import { useAuth } from "../../context/auth/useAuth";
import { ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import {
  buildAudienceSearchText,
  getItemAudience,
  getPriorityLabel,
  getPriorityVariant,
} from "../../utils/audience";
import { buildAcademicTargetSearchText } from "../../utils/academicTarget";
import { matchesSearch } from "../../utils/search";

export const Eventos = () => {
  const { eventos } = useEventos();
  const { hasRole } = useAuth();
  const puedeCrear = hasRole([ROLES.ADMIN, ROLES.DOCENTE]);
  const [categoria, setCategoria] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");

  const categorias = useMemo(
    () => ["Todos", ...new Set(eventos.map((evento) => evento.categoria).filter(Boolean))],
    [eventos]
  );

  const eventosFiltrados = useMemo(
    () =>
      eventos
        .filter((evento) => categoria === "Todos" || evento.categoria === categoria)
        .filter((evento) =>
          matchesSearch(
            evento,
            [
              "titulo",
              "descripcion",
              "fecha",
              "lugar",
              "categoria",
              (item) => getPriorityLabel(getItemAudience(item).prioridad),
              buildAudienceSearchText,
              buildAcademicTargetSearchText,
            ],
            busqueda
          )
        ),
    [eventos, categoria, busqueda]
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Agenda"
        title="Eventos"
        description="Consulta próximas actividades académicas, conferencias, ferias, concursos y eventos institucionales."
        actionLabel={puedeCrear ? "Nuevo evento" : undefined}
        actionTo={puedeCrear ? ROUTES.EVENTOS_NUEVO : undefined}
        actionIcon={Plus}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <SearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar eventos por título, lugar o categoría..."
        />

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden lg:justify-end">
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoria(cat)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                categoria === cat
                  ? "bg-[#6F1D46] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#6F1D46]/40 hover:text-[#6F1D46] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-pink-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {eventosFiltrados.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No se encontraron eventos"
          message="Cambia la categoría, prueba otra búsqueda o revisa el calendario para explorar otros meses."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {eventosFiltrados.map((evento) => {
            const audiencia = getItemAudience(evento);

            return (
              <Link key={evento.id} to={`/eventos/${evento.id}`}>
                <InfoCard
                  icon="📅"
                  title={evento.titulo}
                  subtitle={`${evento.fecha || "Sin fecha"} • ${evento.lugar || "Lugar por confirmar"}`}
                  description={evento.descripcion}
                  metadata={<AcademicTargetSummary item={evento} compact />}
                  badge={
                    <StatusBadge
                      label={evento.categoria || getPriorityLabel(audiencia.prioridad)}
                      variant={getPriorityVariant(audiencia.prioridad)}
                    />
                  }
                />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
