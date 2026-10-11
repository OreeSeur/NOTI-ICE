import { DashboardCard } from "../cards/DashboardCard";
import { useNoticias } from "../../context/noticias/useNoticias";

export const RecentActivity = () => {
  const { noticias } = useNoticias();

  const items = noticias.slice(0, 3).map((noticia) => ({
    title: noticia.titulo,
    subtitle: noticia.fecha,
    path: `/noticias/${noticia.id}`,
  }));

  return (
    <DashboardCard
      title="Actividad Reciente"
      items={items}
    />
  );
};
