import { CARRERA_ICE } from "../../constants/academic";
import { FormError } from "../common/FormError";

const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const ProfileInfoForm = ({
  formData,
  errors = {},
  onChange,
  onSubmit,
  guardando = false,
  mostrarAcademico = true, // carrera y semestre solo aplican a los alumnos
}) => {
  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-2 bg-transparent ${
      errors[field] ? "border-red-500" : "border-slate-300 dark:border-slate-700"
    }`;

  const soloLecturaClass =
    "w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400";

  // Se ofrece la carrera de la institución; si la persona ya tenía otra guardada, se conserva
  const carreras = [...new Set([CARRERA_ICE, formData.carrera].filter(Boolean))];

  return (
    <form onSubmit={onSubmit} noValidate className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Información personal
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {mostrarAcademico
            ? "Tu carrera y semestre determinan qué noticias, eventos y documentos te aparecen. El correo y la boleta no se pueden cambiar desde aquí."
            : "El correo y el número de identificación no se pueden cambiar desde aquí."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-medium">Nombre</label>
          <input name="nombre" value={formData.nombre ?? ""} onChange={onChange} className={inputClass("nombre")} />
          <FormError message={errors.nombre} />
        </div>

        <div>
          <label className="mb-2 block font-medium">Correo</label>
          <input type="email" name="correo" value={formData.correo ?? ""} readOnly className={soloLecturaClass} />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            {mostrarAcademico ? "Boleta" : "Número de identificación"}
          </label>
          <input name="boleta" value={formData.boleta ?? ""} readOnly className={soloLecturaClass} />
        </div>

        {mostrarAcademico && (
          <>
            <div>
              <label className="mb-2 block font-medium">Carrera</label>
              <select name="carrera" value={formData.carrera ?? ""} onChange={onChange} className={inputClass("carrera")}>
                <option value="">Selecciona una carrera</option>
                {carreras.map((carrera) => (
                  <option key={carrera} value={carrera}>
                    {carrera}
                  </option>
                ))}
              </select>
              <FormError message={errors.carrera} />
            </div>

            <div>
              <label className="mb-2 block font-medium">Semestre</label>
              <select name="semestre" value={String(formData.semestre ?? "")} onChange={onChange} className={inputClass("semestre")}>
                <option value="">Selecciona un semestre</option>
                {SEMESTRES.map((semestre) => (
                  <option key={semestre} value={String(semestre)}>
                    {semestre}° Semestre
                  </option>
                ))}
              </select>
              <FormError message={errors.semestre} />
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="rounded-lg bg-[#6F1D46] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
};
