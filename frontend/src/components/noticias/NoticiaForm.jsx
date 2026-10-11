import { Link } from "react-router-dom";

import { AudienceFields } from "../common/AudienceFields";
import { FormError } from "../common/FormError";
import { ROUTES } from "../../constants/routes";

export const NoticiaForm = ({
  formData,
  handleChange,
  handleSubmit,
  buttonText,
  errors = {},
  handleAudienceChange,
  cancelTo = ROUTES.ADMIN_NOTICIAS,
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="
        bg-white
        dark:bg-slate-800
        rounded-xl
        shadow-md
        p-4
        sm:p-6
        max-w-3xl
        w-full
      "
    >
      <div className="mb-5">
        <label className="block mb-2 font-medium">Título</label>

        <input
          type="text"
          name="titulo"
          value={formData.titulo ?? ""}
          onChange={handleChange}
          className={`
            w-full
            border
            rounded-lg
            px-4
            py-3
            bg-transparent
            ${errors.titulo ? "border-red-500" : "border-slate-300 dark:border-slate-700"}
          `}
        />
        <FormError message={errors.titulo} />
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Descripción</label>

        <textarea
          rows="6"
          name="descripcion"
          value={formData.descripcion ?? ""}
          onChange={handleChange}
          className={`
            w-full
            border
            rounded-lg
            px-4
            py-3
            bg-transparent
            ${errors.descripcion ? "border-red-500" : "border-slate-300 dark:border-slate-700"}
          `}
        />
        <FormError message={errors.descripcion} />
      </div>

      <AudienceFields
        audiencia={formData.audiencia}
        onChange={handleAudienceChange}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Link
          to={cancelTo}
          className="
            text-center
            w-full
            px-6
            py-3
            sm:w-auto
            rounded-lg
            border
            border-slate-300
            dark:border-slate-600
            text-slate-700
            dark:text-slate-200
            hover:bg-slate-100
            dark:hover:bg-slate-700
            transition
          "
        >
          Cancelar
        </Link>

        <button
          type="submit"
          className="
            bg-[#6F1D46]
            text-white
            w-full
            px-6
            py-3
            sm:w-auto
            rounded-lg
            hover:opacity-90
            transition
          "
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
};
