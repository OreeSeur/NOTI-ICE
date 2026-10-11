import { Link } from "react-router-dom";

import { useAuth } from "../../context/auth/useAuth";
import { getRoleQuickActions } from "../../constants/roleExperience";

export const QuickActions = () => {
  const { user } = useAuth();
  const actions = getRoleQuickActions(user);

  return (
    <section className="mb-8">
      <h2
        className="
          text-2xl
          font-bold
          mb-4
          text-slate-800
          dark:text-white
        "
      >
        Accesos rápidos
      </h2>

      <div
        className="
          grid
          gap-4
          grid-cols-2
          md:grid-cols-4
        "
      >
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              to={action.path}
              className="
                group
                bg-white
                dark:bg-slate-800
                rounded-xl
                p-5
                shadow-md
                flex
                flex-col
                items-center
                gap-3
                hover:-translate-y-1
                hover:shadow-lg
                transition-all
                text-center
              "
            >
              <Icon
                size={32}
                className="
                  text-[#6F1D46]
                  transition-transform
                  duration-300
                  group-hover:scale-110
                  group-hover:rotate-6
                "
              />

              <div>
                <span
                  className="
                    block
                    font-semibold
                    text-slate-800
                    dark:text-white
                  "
                >
                  {action.title}
                </span>

                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {action.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
