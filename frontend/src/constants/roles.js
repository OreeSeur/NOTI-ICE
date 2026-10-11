// Estos valores deben coincidir EXACTAMENTE (mayúsculas incluidas) con la columna
// NombreRol.NombreRol en la base de datos y con el claim de rol que manda el JWT del backend.
export const ROLES = Object.freeze({
  ADMIN: "Administrador",
  DOCENTE: "Docente",
  ALUMNO: "Alumno",
});

// Compatibilidad con datos/mocks viejos que usaban nombres en minúsculas o en inglés
export const LEGACY_ROLE_ALIASES = Object.freeze({
  admin: ROLES.ADMIN,
  superadmin: ROLES.ADMIN,
  docente: ROLES.DOCENTE,
  alumno: ROLES.ALUMNO,
  usuario: ROLES.ALUMNO,
  personal: ROLES.ADMIN,
  editor: ROLES.ADMIN,
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: "Administrador",
  [ROLES.DOCENTE]: "Docente",
  [ROLES.ALUMNO]: "Alumno",
});

export const ROLE_OPTIONS = Object.freeze([
  {
    value: ROLES.ADMIN,
    label: ROLE_LABELS[ROLES.ADMIN],
  },
  {
    value: ROLES.DOCENTE,
    label: ROLE_LABELS[ROLES.DOCENTE],
  },
  {
    value: ROLES.ALUMNO,
    label: ROLE_LABELS[ROLES.ALUMNO],
  },
]);

export const normalizeRole = (rol) => {
  if (!rol) return "";

  return LEGACY_ROLE_ALIASES[rol] || rol;
};

export const getRoleLabel = (rol) => {
  const normalizedRole = normalizeRole(rol);

  return ROLE_LABELS[normalizedRole] || rol || "Sin rol";
};
