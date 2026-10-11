export const Header = () => {
  const fecha = new Date().toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <section className="mb-8">
      <h1
        className="
          text-4xl
          font-bold
          text-slate-800
          dark:text-white
        "
      >
        Bienvenido al Portal ESIME
      </h1>

      <p
        className="
          text-slate-500
          dark:text-slate-400
          mt-2
          capitalize
        "
      >
        {fecha}
      </p>
    </section>
  );
};