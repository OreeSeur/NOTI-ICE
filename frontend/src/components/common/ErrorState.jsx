import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ROUTES } from "../../constants/routes";

export const ErrorState = ({
  code = "Error",
  title = "Algo salió mal",
  description = "No pudimos completar la acción solicitada.",
  primaryLabel = "Volver al inicio",
  primaryTo = ROUTES.HOME,
  showBack = true,
  showReload = false,
}) => {
  const navigate = useNavigate();

  return (
    <section className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-gradient-to-br from-[#6F1D46] via-[#750946] to-[#750946] px-8 py-10 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
                {code}
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {title}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-8">
          <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to={primaryTo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Home className="h-4 w-4" />
              {primaryLabel}
            </Link>

            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Regresar
              </button>
            )}

            {showReload && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
