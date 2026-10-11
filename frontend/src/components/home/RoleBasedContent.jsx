import { Link } from "react-router-dom";
import { Target } from "lucide-react";

import { useAuth } from "../../context/auth/useAuth";
import { useNoticias } from "../../context/noticias/useNoticias";
import { useEventos } from "../../context/eventos/useEventos";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { getRoleLabel } from "../../constants/roles";
import { getRoleBasedContent } from "../../utils/roleContent";

export const RoleBasedContent = () => {
  const { user } = useAuth();
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();

  if (!user) return null;

  const items = getRoleBasedContent({
    noticias,
    eventos,
    documentos,
    user,
    limit: 4,
  });

  if (items.length === 0) return null;

  return (
    <section className="mb-8 rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800">
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl bg-[#6F1D46]/10 p-3 text-[#6F1D46] dark:bg-pink-300/10 dark:text-pink-300">
          <Target size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Relevante para {getRoleLabel(user.rol).toLowerCase()}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Contenido destacado por palabras clave asociadas a tu rol.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="rounded-xl border border-slate-200 p-4 transition hover:border-[#6F1D46] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50"
          >
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
