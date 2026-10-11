export const InfoCard = ({
  title,
  subtitle,
  description,
  badge,
  icon,
  actionLabel = "Ver detalle",
  className = "",
  metadata = null,
}) => {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#6F1D46]/30 hover:shadow-xl hover:shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:hover:shadow-black/20 sm:p-6 ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#6F1D46] via-[#750946] to-[#636569] opacity-90" />
      <div className="pointer-events-none absolute -right-16 -top-20 size-40 rounded-full bg-[#6F1D46]/5 blur-2xl transition group-hover:bg-[#6F1D46]/10 dark:bg-pink-100/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span
              className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#6F1D46]/10 bg-[#6F1D46]/10 text-2xl text-[#6F1D46] transition group-hover:scale-105 dark:border-pink-100/10 dark:bg-pink-100/10 dark:text-pink-100"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}

          <div className="min-w-0">
            <h2 className="line-clamp-2 text-lg font-black tracking-tight text-slate-900 transition group-hover:text-[#6F1D46] dark:text-white dark:group-hover:text-pink-100 sm:text-xl">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {description && (
        <p className="relative mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
      )}

      {metadata && <div className="relative">{metadata}</div>}

      <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-slate-700">
        <span className="font-bold text-[#6F1D46] dark:text-pink-100">
          {actionLabel}
        </span>
        <span className="flex size-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:translate-x-1 group-hover:bg-[#6F1D46]/10 group-hover:text-[#6F1D46] dark:bg-slate-700 dark:text-slate-400 dark:group-hover:bg-pink-100/10 dark:group-hover:text-pink-100">
          →
        </span>
      </div>
    </article>
  );
};
