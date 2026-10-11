import { CalendarDays, MapPin } from "lucide-react";

export const EventCard = ({
  titulo,
  fecha,
  lugar,
  categoria,
}) => {

  const badgeColors = {
    Conferencias:
      "bg-blue-100 text-blue-700",

    Concursos:
      "bg-green-100 text-green-700",

    Ferias:
      "bg-orange-100 text-orange-700",
  };

  return (
    <article
      className="
        bg-white
        dark:bg-slate-800
        rounded-xl
        shadow-md
        p-5
        hover:shadow-lg
        transition-all
      "
    >
      <h3
        className="
          font-bold
          text-lg
          text-slate-800
          dark:text-white
        "
      >
        {titulo}
      </h3>

      <span
        className={`
          inline-block
          mt-2
          px-3
          py-1
          text-xs
          font-semibold
          rounded-full
          ${badgeColors[categoria]}
        `}
      >
        {categoria}
      </span>

      <p
        className="
          mt-3
          flex
          items-center
          gap-2
          text-slate-500
          dark:text-slate-400
        "
      >
        <CalendarDays size={16} aria-hidden="true" />
        {fecha}
      </p>

      <p
        className="
          flex
          items-center
          gap-2
          text-slate-500
          dark:text-slate-400
        "
      >
        <MapPin size={16} aria-hidden="true" />
        {lugar}
      </p>
    </article>
  );
};