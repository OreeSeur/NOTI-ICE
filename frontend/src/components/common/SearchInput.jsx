import { Search, X } from "lucide-react";

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}) => {
  const handleClear = () => onChange("");

  return (
    <div className={`relative w-full ${className}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-11 text-slate-800 outline-none transition focus:ring-2 focus:ring-[#6F1D46] dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-600 dark:hover:text-white"
          aria-label="Limpiar búsqueda"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
