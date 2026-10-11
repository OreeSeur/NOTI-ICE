export const SearchResults = ({
  resultados
}) => {

  if (!resultados.length) return null;

  return (
    <div
      className="
        bg-white
        rounded-xl
        shadow-md
        p-4
        mb-8
      "
    >
      <h3 className="font-bold mb-3">
        Resultados de búsqueda
      </h3>

      <ul className="space-y-2">
        {resultados.map((item) => (
          <li
            key={`${item.tipo}-${item.id}`}
            className="
              border-b
              pb-2
              last:border-none
            "
          >
            <span className="font-semibold">
              [{item.tipo}]
            </span>{" "}
            {item.titulo}
          </li>
        ))}
      </ul>
    </div>
  );
};