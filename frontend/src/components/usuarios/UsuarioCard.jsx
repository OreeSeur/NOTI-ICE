import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

import { buildRoute, ROUTES } from "../../constants/routes";
import { getRoleLabel, normalizeRole, ROLES } from "../../constants/roles";
import { StatusBadge } from "../common/StatusBadge";

const obtenerVarianteRol = (rol) => {
  const rolNormalizado = normalizeRole(rol);

  if (rolNormalizado === ROLES.ADMIN) {
    return "success";
  }

  if (rolNormalizado === ROLES.DOCENTE) {
    return "primary";
  }

  return "info";
};

export const UsuarioCard = ({ usuario, onDelete }) => {
  return (
    <article className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {usuario.nombre || "Usuario sin nombre"}
          </h3>

          <StatusBadge
            label={getRoleLabel(usuario.rol)}
            variant={obtenerVarianteRol(usuario.rol)}
          />
        </div>

        <p className="break-all text-slate-600 dark:text-slate-300">
          {usuario.correo || usuario.email || "Sin correo"}
        </p>

        <p className="text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-white">Boleta:</span>{" "}
          {usuario.boleta || "-"}
        </p>

        <p className="text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-white">Carrera:</span>{" "}
          {usuario.carrera || "-"}
        </p>

        <p className="text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-white">Semestre:</span>{" "}
          {usuario.semestre || "-"}
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <Link
          to={buildRoute(ROUTES.ADMIN_USUARIOS_EDITAR, { id: usuario.id })}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 py-2 text-blue-700 transition hover:bg-blue-200"
        >
          <Pencil size={18} />
          Editar
        </Link>

        <button
          type="button"
          onClick={() => onDelete(usuario)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-100 py-2 text-red-700 transition hover:bg-red-200"
        >
          <Trash2 size={18} />
          Eliminar
        </button>
      </div>
    </article>
  );
};
