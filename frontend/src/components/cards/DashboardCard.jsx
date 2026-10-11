import { Link } from "react-router-dom";

export const DashboardCard = ({
  title,
  items,
}) => {
  return (
    <article
      className="
        bg-white
        dark:bg-slate-800
        rounded-xl
        shadow-md
        p-6
      "
    >
      <h2
        className="
          text-2xl
          font-bold
          mb-6
          text-slate-800
          dark:text-white
        "
      >
        {title}
      </h2>

      <div>
        {items.map((item, index) => {
          const content = (
            <>
              <h3
                className="
                  font-semibold
                  text-slate-800
                  dark:text-white
                "
              >
                {item.title}
              </h3>

              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {item.subtitle}
              </p>
            </>
          );

          return (
            <div
              key={index}
              className="
                py-3
                border-b
                border-slate-200
                dark:border-slate-700
                last:border-none
              "
            >
              {item.path ? (
                <Link
                  to={item.path}
                  className="
                    block
                    rounded-lg
                    hover:bg-slate-100
                    dark:hover:bg-slate-700
                    p-2
                    transition
                  "
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
};