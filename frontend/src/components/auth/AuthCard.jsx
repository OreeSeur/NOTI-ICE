import { ShieldCheck } from "lucide-react";
import ipnLogo from "../../assets/images/ipn-seeklogo.png";

// Marco común de las pantallas de acceso que no son el login principal
export const AuthCard = ({ titulo, descripcion, children }) => (
  <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-6 dark:bg-slate-950">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(111,29,70,0.16),transparent_34%),linear-gradient(135deg,rgba(111,29,70,0.06),transparent_42%)]" />

    <div className="relative w-full max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <img
          src={ipnLogo}
          alt="Escudo del Instituto Politécnico Nacional"
          className="h-20 w-20 object-contain"
        />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          ESIME Unidad Zacatenco
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#6F1D46] via-[#750946] to-[#636569]" />

        <div className="mb-6 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#6F1D46]/10 text-[#6F1D46] dark:bg-pink-100/10 dark:text-pink-100">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {descripcion}
              </p>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  </section>
);
