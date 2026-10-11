import { ROLE_OPTIONS } from "../../constants/roles";
import { FormError } from "../common/FormError";

export const UsuarioForm = ({
  formulario,
  handleChange,
  handleSubmit,
  buttonText,
  errors = {},
}) => {
  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-2 bg-transparent ${
      errors[field] ? "border-red-500" : "border-slate-300 dark:border-slate-700"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 space-y-4"
    >
      <div>
        <label className="block mb-2 font-medium">Nombre</label>
        <input
          type="text"
          name="nombre"
          value={formulario.nombre ?? ""}
          onChange={handleChange}
          className={inputClass("nombre")}
        />
        <FormError message={errors.nombre} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Correo</label>
        <input
          type="email"
          name="correo"
          value={formulario.correo ?? ""}
          onChange={handleChange}
          className={inputClass("correo")}
        />
        <FormError message={errors.correo} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Boleta</label>
        <input
          type="text"
          name="boleta"
          value={formulario.boleta ?? ""}
          onChange={handleChange}
          className={inputClass("boleta")}
        />
        <FormError message={errors.boleta} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Carrera</label>
        <input
          type="text"
          name="carrera"
          value={formulario.carrera ?? ""}
          onChange={handleChange}
          className={inputClass("carrera")}
        />
        <FormError message={errors.carrera} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Semestre</label>
        <input
          type="number"
          min="1"
          max="12"
          name="semestre"
          value={formulario.semestre ?? ""}
          onChange={handleChange}
          className={inputClass("semestre")}
        />
        <FormError message={errors.semestre} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Rol</label>
        <select
          name="rol"
          value={formulario.rol ?? ""}
          onChange={handleChange}
          className={inputClass("rol")}
        >
          <option value="">Selecciona un rol</option>
          {ROLE_OPTIONS.map((rol) => (
            <option key={rol.value} value={rol.value}>
              {rol.label}
            </option>
          ))}
        </select>
        <FormError message={errors.rol} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Estado</label>
        <select
          name="estado"
          value={formulario.estado ?? ""}
          onChange={handleChange}
          className={inputClass("estado")}
        >
          <option value="">Selecciona estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <FormError message={errors.estado} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Contraseña</label>
        <input
          type="password"
          name="password"
          value={formulario.password ?? ""}
          onChange={handleChange}
          className={inputClass("password")}
        />
        <FormError message={errors.password} />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 sm:w-auto"
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
};
