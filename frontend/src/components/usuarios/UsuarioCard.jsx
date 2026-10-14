import { Link } from "react-router-dom";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { buildRoute, ROUTES } from "../../constants/routes";
import { getRoleLabel, normalizeRole, ROLES } from "../../constants/roles";
import { StatusBadge } from "../common/StatusBadge";

const variante = (rol) => normalizeRole(rol) === ROLES.ADMIN ? "success" :
  normalizeRole(rol) === ROLES.DOCENTE ? "primary" : "info";

export const UsuarioCard = ({ usuario, onDelete, onRestore, inactivo = false }) => (
  <article className="min-w-0 rounded-xl bg-white p-4 text-slate-900 shadow-md dark:bg-slate-800 dark:text-slate-100">
    <div className="flex flex-col gap-2">
      <h3 className="break-words font-bold [overflow-wrap:anywhere]">{usuario.nombre || "Sin nombre"}</h3>
      <div className="flex flex-wrap gap-2">
        <StatusBadge label={getRoleLabel(usuario.rol)} variant={variante(usuario.rol)} />
        {inactivo && <StatusBadge label="Inactivo" variant="warning" />}
      </div>
      <p className="break-all text-slate-600 dark:text-slate-300">{usuario.correo}</p>
      <p className="break-words text-sm [overflow-wrap:anywhere]">ID #{usuario.id} · Identificación: {usuario.boleta}</p>
    </div>
    <div className="mt-4 flex gap-3">
      {inactivo ? (
        <button type="button" onClick={() => onRestore(usuario)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-100 p-2 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200">
          <RotateCcw size={18} /> Reactivar
        </button>
      ) : (
        <>
          <Link to={buildRoute(ROUTES.ADMIN_USUARIOS_EDITAR, { id: usuario.id })}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 p-2 text-blue-700">
            <Pencil size={18} /> Editar
          </Link>
          <button type="button" onClick={() => onDelete(usuario)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 p-2 text-red-700">
            <Trash2 size={18} /> Desactivar
          </button>
        </>
      )}
    </div>
  </article>
);
