import { Megaphone, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { InfoCard } from "../../components/cards/InfoCard";
import { AcademicTargetSummary } from "../../components/common/AcademicTargetSummary";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "../../components/common/PageHeader";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useNoticias } from "../../context/noticias/useNoticias";
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

export const Noticias = () => {
  const { noticias } = useNoticias();
  const { hasRole } = useAuth();
  const puedeCrear = hasRole([ROLES.ADMIN]);
  const [busqueda, setBusqueda] = useState("");

  const noticiasFiltrados = useMemo(
    () =>
      noticias.filter((noticia) =>
        matchesSearch(
          noticia,
          [
            "titulo",
            "descripcion",
            "fecha",
            (item) => getPriorityLabel(getItemAudience(item).prioridad),
            buildAudienceSearchText,
            buildAcademicTargetSearchText,
          ],
          busqueda
        )
      ),
    [noticias, busqueda]
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Comunicados"
        title="Noticias"
        description="Consulta noticias institucionales, trámites, fechas importantes y comunicados dirigidos a la comunidad de ESIME."
        actionLabel={puedeCrear ? "Nueva noticia" : undefined}
        actionTo={puedeCrear ? ROUTES.NOTICIAS_NUEVO : undefined}
        actionIcon={Plus}
      />

      <SearchInput
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar noticias por título, fecha o prioridad..."
      />

      {noticiasFiltrados.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No se encontraron noticias"
          message="Prueba con otra palabra clave o limpia la búsqueda para ver todos los comunicados disponibles."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {noticiasFiltrados.map((noticia) => {
            const audiencia = getItemAudience(noticia);

            return (
              <Link key={noticia.id} to={`/noticias/${noticia.id}`}>
                <InfoCard
                  icon="📢"
                  title={noticia.titulo}
                  subtitle={noticia.fecha || "Sin fecha"}
                  description={noticia.descripcion}
                  metadata={<AcademicTargetSummary item={noticia} compact />}
                  badge={
                    <StatusBadge
                      label={getPriorityLabel(audiencia.prioridad)}
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
