import { LoadingSpinner } from "./LoadingSpinner";

export const LoadingPage = ({
  title = "Cargando información",
  description = "Estamos preparando el contenido solicitado.",
}) => {
  return (
    <section className="min-h-[55vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <LoadingSpinner size="lg" label={title} />
        <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </section>
  );
};
