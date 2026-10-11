import { ROLES, normalizeRole } from "../constants/roles";

export const hasRole = (usuario, rolesPermitidos = []) => {
  if (!usuario?.rol) return false;

  const normalizedRole = normalizeRole(usuario.rol);
  const roles = Array.isArray(rolesPermitidos)
    ? rolesPermitidos
    : [rolesPermitidos];

  return roles.map(normalizeRole).includes(normalizedRole);
};

export const canAccessAdmin = (usuario) =>
  hasRole(usuario, [ROLES.ADMIN]);
