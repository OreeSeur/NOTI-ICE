import ipnLogo from "../../assets/images/ipn-seeklogo.png";

import { LoginForm } from "../../components/auth/LoginForm";

export const Login = () => {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-6 dark:bg-slate-950"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(111,29,70,0.16),transparent_34%),linear-gradient(135deg,rgba(111,29,70,0.06),transparent_42%)]" />
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(135deg,rgba(111,29,70,0.14),rgba(117,9,70,0.04)),repeating-linear-gradient(135deg,rgba(111,29,70,0.08)_0px,rgba(111,29,70,0.08)_1px,transparent_1px,transparent_13px)] lg:block" />

      <div className="relative grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden rounded-3xl border border-white/70 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 lg:block">
          <div className="flex items-center gap-4">
            <img
              src={ipnLogo}
              alt="Escudo del Instituto Politécnico Nacional"
              className="h-20 w-20 object-contain"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#6F1D46] dark:text-pink-100">
                Instituto Politécnico Nacional
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-slate-900 dark:text-white">
                Portal NOTI ICE
              </h1>
            </div>
          </div>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Comunicación académica dirigida para estudiantes, docentes y administración de ESIME Unidad Zacatenco.
          </p>

          <div className="mt-8 rounded-2xl border border-[#6F1D46]/15 bg-[#6F1D46]/5 p-5 text-sm text-slate-700 dark:border-pink-100/10 dark:bg-white/5 dark:text-slate-200">
            <p className="font-bold text-[#6F1D46] dark:text-pink-100">
              “La Técnica al Servicio de la Patria”
            </p>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Accede para revisar noticias, eventos, documentos, notificaciones y publicaciones académicas por materia y grupo.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <img
              src={ipnLogo}
              alt="Escudo del Instituto Politécnico Nacional"
              className="h-20 w-20 object-contain"
            />
            <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
              Portal NOTI ICE
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              ESIME Unidad Zacatenco
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </section>
  );
};
