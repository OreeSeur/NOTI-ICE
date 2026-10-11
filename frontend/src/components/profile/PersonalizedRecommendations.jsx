import { Link } from "react-router-dom";
import { EmptyState } from "../common/EmptyState";

export const PersonalizedRecommendations = ({ items = [] }) => {
  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Recomendado para ti
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Contenido relacionado con tus intereses seleccionados.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Sin recomendaciones todavía"
          description="Selecciona más temas de interés o crea contenido relacionado para ver recomendaciones personalizadas."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} to={item.path} className="block rounded-xl border border-slate-200 p-4 transition hover:border-[#6F1D46] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
                <span className="text-xs text-slate-400">{item.date}</span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
};
