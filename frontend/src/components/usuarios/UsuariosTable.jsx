import { RotateCcw } from "lucide-react";
import { buildRoute, ROUTES } from "../../constants/routes";
import { getRoleLabel, normalizeRole, ROLES } from "../../constants/roles";
import { AdminTableWrapper } from "../common/AdminTableWrapper";
import { CrudActions } from "../common/CrudActions";
import { EmptyState } from "../common/EmptyState";
import { StatusBadge } from "../common/StatusBadge";

const variante = (rol) => normalizeRole(rol) === ROLES.ADMIN ? "success" :
  normalizeRole(rol) === ROLES.DOCENTE ? "primary" : "info";

export const UsuariosTable = ({ usuarios, onDelete, onRestore, inactivo = false }) => (
  <div className="hidden xl:block">
    <AdminTableWrapper>
      <table className="w-full min-w-[850px] table-fixed text-sm text-slate-900 dark:text-slate-100">
        <thead><tr className="bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100">
          <th className="w-14 p-3 text-left">ID</th>
          <th className="p-3 text-left">Nombre</th>
          <th className="p-3 text-left">Correo</th>
          <th className="p-3 text-left">Identificación</th>
          <th className="w-40 p-3 text-left">Rol</th>
          <th className="w-32 p-3 text-right">Acciones</th>
        </tr></thead>
        <tbody>
          {!usuarios.length ? <EmptyState colSpan={6} title="No se encontraron usuarios"
            message="Prueba otra búsqueda o cambia el filtro de rol." /> : usuarios.map((usuario) => (
            <tr key={usuario.id} className="border-b border-slate-200 dark:border-slate-700">
              <td className="p-3 align-top">#{usuario.id}</td>
              <td className="break-words p-3 align-top font-medium [overflow-wrap:anywhere]">{usuario.nombre}</td>
              <td className="break-all p-3 align-top">{usuario.correo}</td>
              <td className="break-words p-3 align-top [overflow-wrap:anywhere]">{usuario.boleta}</td>
              <td className="p-3 align-top">
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge label={getRoleLabel(usuario.rol)} variant={variante(usuario.rol)} />
                  {inactivo && <StatusBadge label="Inactivo" variant="warning" />}
                </div>
              </td>
              <td className="p-3 text-right align-top">
                {inactivo ? (
                  <button type="button" onClick={() => onRestore(usuario)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 p-2 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200"
                    title="Reactivar usuario" aria-label={`Reactivar usuario #${usuario.id}`}>
                    <RotateCcw size={18} /> Reactivar
                  </button>
                ) : (
                  <CrudActions editTo={buildRoute(ROUTES.ADMIN_USUARIOS_EDITAR, { id: usuario.id })}
                    onDelete={() => onDelete(usuario)} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTableWrapper>
  </div>
);
