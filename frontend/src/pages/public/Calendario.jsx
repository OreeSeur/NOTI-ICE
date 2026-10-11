import { CalendarGrid } from "../../components/calendar/CalendarGrid";

export const Calendario = () => {
  return (
    <section>
      <h1
        className="
          text-4xl
          font-bold
          text-slate-800
          dark:text-white
          mb-2
        "
      >
        Calendario Académico
      </h1>

      <p
        className="
          text-slate-500
          dark:text-slate-400
          mb-8
        "
      >
        Consulta las fechas importantes
        y próximos eventos institucionales.
      </p>

      <CalendarGrid />
    </section>
  );
};