import { SearchInput } from "../common/SearchInput";
import { ROLE_OPTIONS } from "../../constants/roles";

export const UsuariosFilters = ({
  busqueda,
  setBusqueda,
  filtroRol,
  setFiltroRol,
}) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
      <div className="flex flex-col gap-4 md:flex-row">
        <SearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, correo, boleta o carrera..."
          className="md:flex-1 md:max-w-none"
        />

        <select
          value={filtroRol}
          onChange={(event) => setFiltroRol(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-[#6F1D46] dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        >
          <option value="todos">Todos los roles</option>

          {ROLE_OPTIONS.map((rol) => (
            <option key={rol.value} value={rol.value}>
              {rol.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
