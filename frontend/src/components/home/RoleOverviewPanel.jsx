import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

import { useAuth } from "../../context/auth/useAuth";
import { getRoleFocusCards } from "../../constants/roleExperience";

export const RoleOverviewPanel = () => {
  const { user } = useAuth();
  const cards = getRoleFocusCards(user);

  return (
    <section className="mb-8 rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800">
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl bg-[#6F1D46]/10 p-3 text-[#6F1D46] dark:bg-pink-300/10 dark:text-pink-300">
          <Sparkles size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Tu vista de trabajo
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Accesos y recomendaciones adaptadas al rol con el que iniciaste sesión.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.path}
            className="group rounded-xl border border-slate-200 p-5 transition hover:border-[#6F1D46] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50"
          >
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {card.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {card.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6F1D46] dark:text-pink-300">
              {card.label}
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
