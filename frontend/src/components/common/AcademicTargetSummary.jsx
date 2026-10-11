import { BookOpen, CalendarClock, GraduationCap, UserRound, Users } from "lucide-react";

import {
  getAcademicTarget,
  getAcademicTargetSummary,
} from "../../utils/academicTarget";

const itemClass =
  "flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200";

const iconClass = "mt-0.5 shrink-0 text-[#6F1D46] dark:text-pink-100";

export const AcademicTargetSummary = ({ item, target: explicitTarget, compact = false }) => {
  const target = explicitTarget || getAcademicTarget(item);

  if (!target) {
    if (compact) return null;

    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
        Esta publicación no tiene datos académicos específicos.
      </p>
    );
  }

  const summary = getAcademicTargetSummary(target);

  if (compact) {
    return (
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[#6F1D46]/15 bg-[#6F1D46]/10 px-3 py-1 font-bold text-[#6F1D46] dark:border-pink-100/15 dark:bg-pink-100/10 dark:text-pink-100">
          {summary.materia}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-bold text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {summary.grupo}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-bold text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {summary.profesor}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={itemClass}>
        <BookOpen size={16} className={iconClass} />
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">Materia</p>
          <p>{summary.materia}</p>
        </div>
      </div>

      <div className={itemClass}>
        <Users size={16} className={iconClass} />
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">Grupo</p>
          <p>{summary.grupo} · {summary.semestre}</p>
        </div>
      </div>

      <div className={itemClass}>
        <UserRound size={16} className={iconClass} />
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">Profesor</p>
          <p>{summary.profesor}</p>
        </div>
      </div>

      <div className={itemClass}>
        <GraduationCap size={16} className={iconClass} />
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">Plan</p>
          <p>{summary.plan}</p>
        </div>
      </div>

      <div className={itemClass}>
        <CalendarClock size={16} className={iconClass} />
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">Periodo</p>
          <p>{summary.periodo} · {summary.turno}</p>
        </div>
      </div>
    </div>
  );
};
