import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const StatCard = ({
  title,
  value,
  icon,
  path,
}) => {
  const Icon = icon;

  return (
    <Link to={path}>
      <article
        className="
          bg-white
          dark:bg-slate-800
          rounded-xl
          shadow-md
          p-6
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-lg
          cursor-pointer
        "
      >
        <div
          className="
            flex
            justify-between
            items-start
          "
        >
          <div>
            <h3
              className="
                text-slate-500
                dark:text-slate-400
                text-sm
              "
            >
              {title}
            </h3>

            <p
              className="
                text-4xl
                font-bold
                mt-2
                text-slate-800
                dark:text-white
              "
            >
              {value}
            </p>
          </div>

          <div
            className="
              p-3
              rounded-xl
              bg-[#6F1D46]/10
            "
          >
            <Icon
              size={28}
              className="text-[#6F1D46]"
            />
          </div>
        </div>

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
          "
        >
          <span
            className="
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Ver sección
          </span>

          <ArrowRight
            size={18}
            className="
              text-[#6F1D46]
            "
          />
        </div>
      </article>
    </Link>
  );
};