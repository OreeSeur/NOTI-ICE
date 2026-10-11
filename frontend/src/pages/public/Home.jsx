import { Header } from "../../components/layout/Header";
import { StatCard } from "../../components/cards/StatCard";
//import { NewsSection } from "../components/news/NewsSection";
import { EventsSection } from "../../components/events/EventsSection";
import { QuickActions } from "../../components/home/QuickActions";
import { HeroBanner } from "../../components/home/HeroBanner";
import { RecentActivity } from "../../components/home/RecentActivity";
//import { UpcomingEvents } from "../components/home/UpcomingEvents";
import { RecentDocuments } from "../../components/home/RecentDocuments";
import { WelcomeCard } from "../../components/home/WelcomeCard";
import { PersonalizedFeed } from "../../components/home/PersonalizedFeed";
import { RoleOverviewPanel } from "../../components/home/RoleOverviewPanel";
import { RoleBasedContent } from "../../components/home/RoleBasedContent";
import { useNoticias } from "../../context/noticias/useNoticias";
import { useEventos } from "../../context/eventos/useEventos";
import { useDocumentos } from "../../context/documentos/useDocumentos";

import {
  Megaphone,
  Trophy,
  FileText,
} from "lucide-react";

export const Home = () => {
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();

  return (
    <>
      <Header />

      <HeroBanner />
      <WelcomeCard />
      <RoleOverviewPanel />
      <PersonalizedFeed />
      <RoleBasedContent />
      <QuickActions />

      {/* Tarjetas estadísticas */}
      <section
        className="
          grid
          gap-6
          md:grid-cols-3
        "
      >
        <StatCard
          title="Noticias Activos"
          value={noticias.length}
          icon={Megaphone}
          path="/noticias"
        />

        <StatCard
          title="Eventos Programados"
          value={eventos.length}
          icon={Trophy}
          path="/eventos"
        />

        <StatCard
          title="Documentos Publicados"
          value={documentos.length}
          icon={FileText}
          path="/documentos"
        />
      </section>
      <section
        className="
          grid
          gap-6
          mt-10
          lg:grid-cols-3
        "
      >
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <section className="mt-6">
          <RecentDocuments />
        </section>

        {/*<UpcomingEvents />*/}
      </section>
      {/* Noticias */}
      {/*<NewsSection />*/}

      {/* Eventos */}
      <EventsSection />
    </>
  );
};
