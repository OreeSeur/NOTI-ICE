import { isValidEmail } from "./validation";
import { ROLE_OPTIONS } from "../constants/roles";

// Reglas alineadas con backend/NoiceBack/Services/ValidacionCuenta.cs; el servidor es la autoridad.
const NOMBRE_MAXIMO = 150; // usuarios.Nombre VARCHAR(150)
const CORREO_MAXIMO = 150; // usuarios.Correo VARCHAR(150)
// Controles C0/C1 (tabulación, saltos de línea, NUL, DEL...) y separadores Unicode U+2028/U+2029.
const esCaracterNoPermitido = (caracter) => {
  const codigo = caracter.charCodeAt(0);
  return codigo <= 0x1f || (codigo >= 0x7f && codigo <= 0x9f) || codigo === 0x2028 || codigo === 0x2029;
};
const CONTRASENA_MAXIMA_BYTES = 72; // BCrypt solo utiliza los primeros 72 bytes.

export const validarUsuarioAdministrativo = (datos, { edicion = false } = {}) => {
  const errores = {};
  const nombreOriginal = String(datos.nombre ?? "");
  // Igual que el servidor: solo se normalizan espacios ordinarios; los controles se rechazan.
  const nombre = nombreOriginal.split(" ").filter(Boolean).join(" ");
  const correo = String(datos.correo ?? "").trim();
  const boleta = String(datos.boleta ?? "").trim();
  const password = String(datos.password ?? "");
  if ([...nombreOriginal].some(esCaracterNoPermitido))
    errores.nombre = "El nombre contiene caracteres no permitidos (tabulaciones, saltos de línea u otros caracteres de control).";
  // Igual que el servidor: un nombre formado solo por espacios Unicode (U+00A0, U+2003...) no es válido.
  else if (nombre.trim().length === 0)
    errores.nombre = "El nombre es obligatorio y no puede estar formado solo por espacios.";
  else if (nombre.length < 3 || nombre.length > NOMBRE_MAXIMO)
    errores.nombre = `El nombre debe tener entre 3 y ${NOMBRE_MAXIMO} caracteres.`;
  if (!isValidEmail(correo) || correo.length > CORREO_MAXIMO)
    errores.correo = `Escribe un correo electrónico válido (máximo ${CORREO_MAXIMO} caracteres).`;
  if (!edicion && (boleta.length < 1 || boleta.length > 30))
    errores.boleta = "La identificación debe tener entre 1 y 30 caracteres.";
  if (!ROLE_OPTIONS.some((opcion) => opcion.value === datos.rol))
    errores.rol = "Selecciona un rol válido.";
  if (!edicion && password.length < 8)
    errores.password = "La contraseña inicial debe contener al menos 8 caracteres.";
  else if (!edicion && password.trim().length === 0)
    errores.password = "La contraseña no puede estar formada solo por espacios.";
  else if (!edicion && new TextEncoder().encode(password).length > CONTRASENA_MAXIMA_BYTES)
    errores.password = `La contraseña no puede superar ${CONTRASENA_MAXIMA_BYTES} bytes (72 caracteres sin acentos).`;
  return errores;
};
