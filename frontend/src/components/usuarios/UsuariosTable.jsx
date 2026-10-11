import { buildRoute, ROUTES } from "../../constants/routes";
import { getRoleLabel, normalizeRole, ROLES } from "../../constants/roles";
import { AdminTableWrapper } from "../common/AdminTableWrapper";
import { CrudActions } from "../common/CrudActions";
import { EmptyState } from "../common/EmptyState";
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

export const UsuariosTable = ({ usuarios, onDelete }) => {
  return (
    <div className="hidden lg:block">
      <AdminTableWrapper>
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="p-4 text-left">Nombre</th>
              <th className="p-4 text-left">Correo</th>
              <th className="p-4 text-left">Boleta</th>
              <th className="p-4 text-left">Carrera</th>
              <th className="p-4 text-left">Semestre</th>
              <th className="p-4 text-left">Rol</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.length === 0 ? (
              <EmptyState
                colSpan={7}
                title="No se encontraron usuarios"
                message="Prueba con otra búsqueda, cambia el filtro de rol o registra un nuevo usuario."
              />
            ) : (
              usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-b border-slate-200 dark:border-slate-700"
                >
                  <td className="p-4 font-medium text-slate-800 dark:text-white">
                    {usuario.nombre || "Usuario sin nombre"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {usuario.correo || usuario.email || "Sin correo"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {usuario.boleta || "-"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {usuario.carrera || "-"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {usuario.semestre || "-"}
                  </td>
                  <td className="p-4">
                    <StatusBadge
                      label={getRoleLabel(usuario.rol)}
                      variant={obtenerVarianteRol(usuario.rol)}
                    />
                  </td>
                  <td className="p-4">
                    <CrudActions
                      editTo={buildRoute(ROUTES.ADMIN_USUARIOS_EDITAR, {
                        id: usuario.id,
                      })}
                      onDelete={() => onDelete(usuario)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableWrapper>
    </div>
  );
};
