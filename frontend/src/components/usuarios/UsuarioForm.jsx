import { ROLE_OPTIONS } from "../../constants/roles";
import { FormError } from "../common/FormError";

export const UsuarioForm = ({ formulario, handleChange, handleSubmit, buttonText,
  errors = {}, edicion = false, enviando = false }) => {
  const inputClass = (campo) =>
    `w-full rounded-lg border px-4 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-white ${
      errors[campo] ? "border-red-500" : "border-slate-300 dark:border-slate-600"
    }`;

  return (
    <form onSubmit={handleSubmit} noValidate
      className="w-full space-y-4 rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-6">
      <div>
        <label htmlFor="usuario-nombre" className="mb-2 block font-medium">Nombre</label>
        <input id="usuario-nombre" name="nombre" autoComplete="name" type="text" maxLength={120}
          value={formulario.nombre ?? ""} onChange={handleChange} disabled={enviando}
          className={inputClass("nombre")} />
        <FormError message={errors.nombre} />
      </div>
      <div>
        <label htmlFor="usuario-correo" className="mb-2 block font-medium">Correo</label>
        <input id="usuario-correo" name="correo" autoComplete="email" type="email" maxLength={254}
          value={formulario.correo ?? ""} onChange={handleChange} disabled={enviando}
          className={inputClass("correo")} />
        <FormError message={errors.correo} />
      </div>
      <div>
        <label htmlFor="usuario-boleta" className="mb-2 block font-medium">Número de identificación</label>
        <input id="usuario-boleta" name="boleta" type="text" maxLength={30}
          value={formulario.boleta ?? ""} onChange={handleChange}
          disabled={enviando || edicion} className={inputClass("boleta")} />
        {edicion && <p className="mt-1 text-xs text-slate-500">El backend no permite modificar este identificador.</p>}
        <FormError message={errors.boleta} />
      </div>
      <div>
        <label htmlFor="usuario-rol" className="mb-2 block font-medium">Rol</label>
        <select id="usuario-rol" name="rol" value={formulario.rol ?? ""}
          onChange={handleChange} disabled={enviando} className={inputClass("rol")}>
          <option value="">Selecciona un rol</option>
          {ROLE_OPTIONS.map((rol) => <option key={rol.value} value={rol.value}>{rol.label}</option>)}
        </select>
        <FormError message={errors.rol} />
      </div>
      {!edicion && (
        <div>
          <label htmlFor="usuario-password" className="mb-2 block font-medium">Contraseña inicial</label>
          <input id="usuario-password" name="password" type="password" autoComplete="new-password"
            value={formulario.password ?? ""} onChange={handleChange} disabled={enviando}
            className={inputClass("password")} />
          <FormError message={errors.password} />
        </div>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {edicion ? "Solo se actualizarán nombre, correo y rol en MySQL." :
          "El usuario se creará activo en MySQL. La contraseña se almacenará cifrada por el servidor."}
      </p>
      <button type="submit" disabled={enviando}
        className="rounded-lg bg-[#6F1D46] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
        {enviando ? "Guardando…" : buttonText}
      </button>
    </form>
  );
};
