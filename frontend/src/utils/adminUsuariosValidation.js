import { isValidEmail } from "./validation";
import { ROLE_OPTIONS } from "../constants/roles";

export const validarUsuarioAdministrativo = (datos, { edicion = false } = {}) => {
  const errores = {};
  const nombre = String(datos.nombre ?? "").trim();
  const correo = String(datos.correo ?? "").trim();
  const boleta = String(datos.boleta ?? "").trim();
  if (nombre.length < 3) errores.nombre = "El nombre debe contener al menos 3 caracteres.";
  if (!isValidEmail(correo)) errores.correo = "Escribe un correo electrónico válido.";
  if (!edicion && (boleta.length < 1 || boleta.length > 30))
    errores.boleta = "La identificación debe tener entre 1 y 30 caracteres.";
  if (!ROLE_OPTIONS.some((opcion) => opcion.value === datos.rol))
    errores.rol = "Selecciona un rol válido.";
  if (!edicion && String(datos.password ?? "").length < 8)
    errores.password = "La contraseña inicial debe contener al menos 8 caracteres.";
  return errores;
};
