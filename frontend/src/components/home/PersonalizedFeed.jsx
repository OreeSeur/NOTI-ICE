import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { useAuth } from "../../context/auth/useAuth";
import { useNoticias } from "../../context/noticias/useNoticias";
import { useEventos } from "../../context/eventos/useEventos";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { getPersonalizedRecommendations } from "../../utils/recommendations";
import { getRoleLabel } from "../../constants/roles";

export const PersonalizedFeed = () => {
  const { user } = useAuth();
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();

  if (!user) return null;

  const recomendaciones = getPersonalizedRecommendations({
    noticias,
    eventos,
    documentos,
    user,
    limit: 3,
  });

  if (recomendaciones.length === 0) {
    return (
      <section className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <Sparkles className="text-[#6F1D46]" size={24} />
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Personaliza tu portal
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Configura tus preferencias para que la vista de {getRoleLabel(user.rol).toLowerCase()} muestre contenido más relevante.
            </p>
            <Link to="/perfil" className="mt-4 inline-flex rounded-lg bg-[#6F1D46] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              Ir a mi perfil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
            <Sparkles className="text-[#6F1D46]" size={22} />
            Para ti
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Recomendaciones combinando tu rol, tus temas y los tipos de contenido que activaste.
          </p>
        </div>
        <Link to="/perfil" className="text-sm font-semibold text-[#6F1D46] dark:text-pink-300">
          Editar preferencias
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {recomendaciones.map((item) => (
          <Link key={item.id} to={item.path} className="rounded-xl border border-slate-200 p-4 transition hover:border-[#6F1D46] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {item.label}
            </span>
            <h3 className="mt-3 font-semibold text-slate-800 dark:text-white">
              {item.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};
