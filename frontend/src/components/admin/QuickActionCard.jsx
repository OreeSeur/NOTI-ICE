import { Link } from "react-router-dom";

export const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  to,
}) => {
  return (
    <Link
      to={to}
      className="
        group
        rounded-2xl
        bg-white
        dark:bg-slate-800
        shadow-md
        border
        border-slate-100
        dark:border-slate-700
        p-4
        sm:p-5
        transition
        hover:-translate-y-1
        hover:shadow-lg
        block
      "
    >
      <div className="flex items-start gap-4">
        <div
          className="
            rounded-xl
            bg-[#6F1D46]
            p-3
            text-white
            transition
            group-hover:scale-105
          "
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};
