import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { ROUTES } from "../../constants/routes";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900 dark:bg-slate-950 dark:text-white">
        <section className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="bg-gradient-to-br from-[#6F1D46] via-[#750946] to-[#750946] px-8 py-10 text-white">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/75">
                    Error inesperado
                  </p>
                  <h1 className="mt-2 text-3xl font-bold">
                    La aplicación encontró un problema
                  </h1>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-8 py-8">
              <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                Evitamos mostrar una pantalla en blanco. Puedes recargar la página o volver al inicio para continuar usando el portal.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4" />
                  Recargar página
                </button>

                <Link
                  to={ROUTES.HOME}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Home className="h-4 w-4" />
                  Ir al inicio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }
}
