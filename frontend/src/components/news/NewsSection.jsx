const noticias = [
  {
    id: 1,
    titulo: "Inicio de reinscripciones",
    fecha: "18 Junio 2026",
  },
  {
    id: 2,
    titulo: "Convocatoria de becas",
    fecha: "15 Junio 2026",
  },
  {
    id: 3,
    titulo: "Actualización de horarios",
    fecha: "12 Junio 2026",
  },
];

export const NewsSection = () => {
  return (
    <section className="mt-10">
      <h2
        className="
          text-2xl
          font-bold
          mb-4
          text-slate-800
          dark:text-white
        "
      >
        Noticias Destacadas
      </h2>

      <div
        className="
          bg-white
          dark:bg-slate-800
          rounded-xl
          shadow-md
          p-6
        "
      >
        {noticias.map((noticia) => (
          <article
            key={noticia.id}
            className="
              py-4
              border-b
              border-slate-200
              dark:border-slate-700
              last:border-none
            "
          >
            <h3
              className="
                font-semibold
                text-slate-800
                dark:text-white
              "
            >
              {noticia.titulo}
            </h3>

            <p
              className="
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              {noticia.fecha}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};