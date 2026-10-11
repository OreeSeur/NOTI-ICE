import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useEventos } from "../../context/eventos/useEventos";
import {
  addMonths,
  formatDateLabel,
  formatMonthYear,
  getMonthDifference,
  getTodayMonth,
  isSameMonth,
  parseDateValue,
} from "../../utils/dates";

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_BACK_LIMIT = -2;
const MONTHS_FORWARD_LIMIT = 12;

const getDaysInMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const getMondayBasedStartIndex = (date) => {
  const sundayBasedIndex = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return sundayBasedIndex === 0 ? 6 : sundayBasedIndex - 1;
};

export const CalendarGrid = () => {
  const { eventos } = useEventos();
  const currentMonth = getTodayMonth();
  const [visibleMonth, setVisibleMonth] = useState(currentMonth);

  const monthOffset = getMonthDifference(currentMonth, visibleMonth);
  const canGoBack = monthOffset > MONTHS_BACK_LIMIT;
  const canGoForward = monthOffset < MONTHS_FORWARD_LIMIT;

  const eventosConFecha = useMemo(
    () =>
      eventos
        .map((evento) => ({
          ...evento,
          fechaCalendario: parseDateValue(evento.fecha),
        }))
        .filter((evento) => Boolean(evento.fechaCalendario)),
    [eventos]
  );

  const eventosDelMes = useMemo(
    () =>
      eventosConFecha
        .filter((evento) => isSameMonth(evento.fechaCalendario, visibleMonth))
        .sort((a, b) => a.fechaCalendario - b.fechaCalendario),
    [eventosConFecha, visibleMonth]
  );

  const eventosPorDia = useMemo(() => {
    const groupedEvents = new Map();

    eventosDelMes.forEach((evento) => {
      const day = evento.fechaCalendario.getDate();
      const previousEvents = groupedEvents.get(day) || [];
      groupedEvents.set(day, [...previousEvents, evento]);
    });

    return groupedEvents;
  }, [eventosDelMes]);

  const daysInMonth = getDaysInMonth(visibleMonth);
  const startIndex = getMondayBasedStartIndex(visibleMonth);
  const calendarCells = [
    ...Array.from({ length: startIndex }, (_, index) => ({ type: "empty", id: `empty-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      type: "day",
      day: index + 1,
      id: `day-${index + 1}`,
    })),
  ];

  const goToPreviousMonth = () => {
    if (!canGoBack) return;
    setVisibleMonth((prev) => addMonths(prev, -1));
  };

  const goToNextMonth = () => {
    if (!canGoForward) return;
    setVisibleMonth((prev) => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setVisibleMonth(currentMonth);
  };

  return (
    <div
      className="
        bg-white
        dark:bg-slate-800
        rounded-xl
        shadow-md
        p-3
        sm:p-4
        md:p-6
      "
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2
            className="
              text-xl
              sm:text-2xl
              font-bold
              capitalize
              text-slate-800
              dark:text-white
            "
          >
            {formatMonthYear(visibleMonth)}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Puedes revisar dos meses hacia atrás y hasta doce meses hacia adelante.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={goToPreviousMonth}
            disabled={!canGoBack}
            className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700 sm:px-3 sm:text-sm"
          >
            <span className="flex items-center gap-1">
              <ChevronLeft size={16} /> Anterior
            </span>
          </button>

          <button
            type="button"
            onClick={goToCurrentMonth}
            className="rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium transition hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 sm:px-3 sm:text-sm"
          >
            Mes actual
          </button>

          <button
            type="button"
            onClick={goToNextMonth}
            disabled={!canGoForward}
            className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-700 sm:px-3 sm:text-sm"
          >
            <span className="flex items-center gap-1">
              Siguiente <ChevronRight size={16} />
            </span>
          </button>
        </div>
      </div>

      <div
        className="
          grid
          grid-cols-7
          gap-1
          sm:gap-2
        "
      >
        {WEEK_DAYS.map((dia) => (
          <div
            key={dia}
            className="
              py-2
              text-center
              text-[11px]
              font-semibold
              text-slate-500
              dark:text-slate-400
              sm:text-sm
            "
          >
            {dia}
          </div>
        ))}

        {calendarCells.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.id} className="min-h-20 rounded-lg" />;
          }

          const eventosDelDia = eventosPorDia.get(cell.day) || [];
          const hasEvents = eventosDelDia.length > 0;

          return (
            <div
              key={cell.id}
              className={`
                min-h-14
                rounded-lg
                border
                p-1.5
                text-xs
                sm:min-h-20
                sm:p-2
                sm:text-sm
                transition
                ${
                  hasEvents
                    ? "border-[#6F1D46] bg-[#6F1D46]/10 text-[#6F1D46] dark:border-pink-300 dark:bg-pink-300/10 dark:text-pink-200"
                    : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                }
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{cell.day}</span>
                {hasEvents && (
                  <span className="rounded-full bg-[#6F1D46] px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-pink-300 dark:text-slate-900 sm:px-2">
                    {eventosDelDia.length}
                  </span>
                )}
              </div>

              {hasEvents && (
                <div className="mt-1 space-y-1 sm:mt-2">
                  {eventosDelDia.slice(0, 2).map((evento) => (
                    <Link
                      key={evento.id}
                      to={`/eventos/${evento.id}`}
                      className="hidden truncate rounded bg-white/70 px-1.5 py-1 text-[11px] font-medium hover:underline dark:bg-slate-900/40 sm:block"
                      title={evento.titulo}
                    >
                      {evento.titulo}
                    </Link>
                  ))}

                  {eventosDelDia.length > 2 && (
                    <p className="text-[10px] font-medium sm:text-[11px]">
                      +{eventosDelDia.length - 2} más
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="font-semibold text-slate-800 dark:text-white">
          Eventos de este mes
        </h3>

        {eventosDelMes.length > 0 ? (
          eventosDelMes.map((evento) => (
            <Link
              key={evento.id}
              to={`/eventos/${evento.id}`}
              className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 text-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 md:flex-row md:items-center md:gap-3"
            >
              <span
                className="
                  text-[#6F1D46]
                  font-bold
                  dark:text-pink-300
                "
              >
                {formatDateLabel(evento.fecha)}
              </span>

              <span
                className="
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {evento.titulo}
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            No hay eventos registrados para este mes.
          </p>
        )}
      </div>
    </div>
  );
};
