import { useNoticias } from "../../context/noticias/useNoticias";
import { useAuth } from "../../context/auth/useAuth";
import { useEventos } from "../../context/eventos/useEventos";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { getRoleLabel } from "../../constants/roles";
import { getExperienceRole } from "../../constants/roleExperience";
import { CalendarDays, FileText, Megaphone } from "lucide-react";

const getWelcomeMessage = (user) => {
  const role = getExperienceRole(user);

  if (!user) {
    return "Explora la información pública del portal o inicia sesión para ver contenido personalizado.";
  }

  const messages = {
    alumno: "Aquí encontrarás noticias, eventos y documentos alineados a tus intereses académicos.",
    docente: "Revisa comunicados, documentos y eventos útiles para tu actividad docente.",
    personal: "Consulta información operativa, documentos y fechas relevantes para el seguimiento institucional.",
    admin: "Supervisa el estado del portal y administra el contenido publicado para la comunidad.",
    superadmin: "Gestiona el portal completo, usuarios, contenido y actividad institucional.",
  };

  return messages[role] || "Bienvenido al Portal Académico ESIME.";
};

export const WelcomeCard = () => {
  const { user } = useAuth();
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();

  const nombreUsuario = user?.nombre?.trim() || "comunidad ESIME";
  const roleLabel = user ? getRoleLabel(user.rol) : "Visitante";

  return (
    <section
      className="
        bg-white
        dark:bg-slate-800
        rounded-xl
        shadow-md
        p-6
        mb-8
      "
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2
            className="
              text-2xl
              font-bold
              text-slate-800
              dark:text-white
            "
          >
            Hola, {nombreUsuario}
          </h2>

          <p
            className="
              mt-2
              text-slate-500
              dark:text-slate-400
            "
          >
            {getWelcomeMessage(user)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm dark:bg-slate-700">
          <p className="font-semibold text-slate-800 dark:text-white">
            {roleLabel}
          </p>
          {user?.carrera && (
            <p className="mt-1 text-slate-500 dark:text-slate-300">
              {user.carrera}
            </p>
          )}
        </div>
      </div>

      <div
        className="
          mt-5
          flex
          flex-wrap
          gap-6
        "
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <Megaphone size={18} aria-hidden="true" />
          {noticias.length} noticias activas
        </span>

        <span className="inline-flex items-center gap-2 font-medium">
          <CalendarDays size={18} aria-hidden="true" />
          {eventos.length} eventos próximos
        </span>

        <span className="inline-flex items-center gap-2 font-medium">
          <FileText size={18} aria-hidden="true" />
          {documentos.length} documentos publicados
        </span>
      </div>
    </section>
  );
};
