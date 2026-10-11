import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const AdminStatCard = ({
  title,
  value,
  description,
  icon: Icon,
  to,
}) => {
  const content = (
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
        transition
        hover:-translate-y-1
        hover:shadow-lg
        h-full
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-white sm:text-4xl">
            {value}
          </p>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-[#6F1D46]/10 p-3 text-[#6F1D46]">
          <Icon size={28} />
        </div>
      </div>

      {to && (
        <div
          className="
            mt-6
            pt-4
            border-t
            border-slate-200
            dark:border-slate-700
            flex
            items-center
            justify-between
            text-sm
            font-medium
            text-[#6F1D46]
          "
        >
          <span>Ver módulo</span>
          <ArrowRight size={18} />
        </div>
      )}
    </article>
  );

  if (!to) return content;

  return (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  );
};
