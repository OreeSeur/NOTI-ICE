import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const AdminListCard = ({
  title,
  description,
  items,
  emptyMessage,
  actionLabel,
  actionTo,
}) => {
  return (
    <article
      className="
        bg-white
        dark:bg-slate-800
        rounded-2xl
        shadow-md
        p-4
        sm:p-6
        border
        border-slate-100
        dark:border-slate-700
        h-full
      "
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white sm:text-xl">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>

        {actionTo && actionLabel && (
          <Link
            to={actionTo}
            className="
              hidden
              sm:flex
              items-center
              gap-1
              text-sm
              font-medium
              text-[#6F1D46]
              hover:underline
            "
          >
            {actionLabel}
            <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div
          className="
            rounded-xl
            border
            border-dashed
            border-slate-300
            dark:border-slate-600
            p-4
        sm:p-6
            text-center
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const itemContent = (
              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-700
                  p-4
                  transition
                  hover:bg-slate-50
                  dark:hover:bg-slate-700/60
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 font-semibold text-slate-800 dark:text-white">
                      {item.title}
                    </h3>

                    {item.subtitle && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {item.badge && (
                    <span
                      className="
                        shrink-0
                        rounded-full
                        bg-[#6F1D46]/10
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-[#6F1D46]
                      "
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            );

            if (!item.to) {
              return <div key={item.id}>{itemContent}</div>;
            }

            return (
              <Link key={item.id} to={item.to} className="block">
                {itemContent}
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
};
