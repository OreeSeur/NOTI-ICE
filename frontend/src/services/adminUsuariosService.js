import { get, post, put, remove } from "../api/apiClient";
import { ENDPOINTS, withId } from "../api/endpoints";
import { ROLES } from "../constants/roles";

// Los ID coinciden con el catálogo real de roles de NOTI ICE.
const ROL_ID = Object.freeze({
  [ROLES.ADMIN]: 1,
  [ROLES.DOCENTE]: 2,
  [ROLES.ALUMNO]: 3,
});
const ROL_NOMBRE = Object.freeze({ 1: ROLES.ADMIN, 2: ROLES.DOCENTE, 3: ROLES.ALUMNO });

export const normalizarUsuarioAdministrativo = (dato) => ({
  id: dato.idUsuario,
  nombre: dato.nombre ?? "",
  correo: dato.correo ?? "",
  boleta: dato.noIdentificacion ?? "",
  rol: dato.rolNombre || ROL_NOMBRE[dato.idRol] || "",
  idRol: dato.idRol,
  estado: dato.activo ? "activo" : "inactivo",
});

const idDeRol = (rol) => {
  const id = ROL_ID[rol];
  if (!id) throw new Error("Selecciona un rol válido.");
  return id;
};

export const obtenerUsuariosAdministrativos = async () => {
  const respuesta = await get(ENDPOINTS.usuarios);
  if (!Array.isArray(respuesta)) throw new Error("El servidor devolvió una lista de usuarios inválida.");
  return respuesta.map(normalizarUsuarioAdministrativo);
};

export const crearUsuarioAdministrativo = (datos) =>
  post(ENDPOINTS.usuarios, {
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim(),
    noIdentificacion: datos.boleta.trim(),
    idRol: idDeRol(datos.rol),
    contrasena: datos.password,
  });

// El backend solo permite cambiar nombre, correo y rol mediante PUT.
export const editarUsuarioAdministrativo = (id, datos) =>
  put(withId(ENDPOINTS.usuarios, id), {
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim(),
    idRol: idDeRol(datos.rol),
  });

// DELETE realiza desactivación lógica (Activo=false), sin borrar relaciones.
export const desactivarUsuarioAdministrativo = (id) =>
  remove(withId(ENDPOINTS.usuarios, id));

// Consulta y reactivación de cuentas históricas; sólo para administradores.
export const obtenerUsuariosInactivosAdministrativos = async () => {
  const respuesta = await get(`${ENDPOINTS.usuarios}/inactivos`);
  if (!Array.isArray(respuesta)) throw new Error("El servidor devolvió una lista de usuarios inválida.");
  return respuesta.map(normalizarUsuarioAdministrativo);
};

export const reactivarUsuarioAdministrativo = (id) =>
  put(`${withId(ENDPOINTS.usuarios, id)}/reactivar`, {});
