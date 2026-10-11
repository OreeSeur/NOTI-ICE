import { Link } from "react-router-dom";

export const PageHeader = ({
  title,
  description,
  eyebrow,
  actionLabel,
  actionTo,
  actionIcon: ActionIcon,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#6F1D46] via-[#750946] to-[#636569]" />
      <div className="pointer-events-none absolute -right-14 -top-20 size-44 rounded-full bg-[#6F1D46]/5 blur-3xl dark:bg-pink-100/5" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {eyebrow && (
            <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#6F1D46] dark:text-pink-100">
              {eyebrow}
            </p>
          )}

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
              {description}
            </p>
          )}
        </div>

        {actionTo && actionLabel && (
          <Link
            to={actionTo}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6F1D46] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#6F1D46]/15 transition hover:-translate-y-0.5 hover:bg-[#750946] sm:w-fit"
          >
            {ActionIcon && <ActionIcon size={18} />}
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
};
