import { post } from "../api/apiClient";

const RUTAS = Object.freeze({
  solicitar: "/auth/olvide-contrasena",
  restablecer: "/auth/restablecer-contrasena",
});

// Pide que se envíe un enlace al correo. El servidor siempre responde igual,
// exista o no la cuenta, para no revelar qué correos están registrados.
export const solicitarRecuperacion = (correo) =>
  post(RUTAS.solicitar, { correo });

// Cambia la contraseña con el token que llegó por correo.
export const restablecerContrasena = ({ correo, token, nuevaContrasena }) =>
  post(RUTAS.restablecer, { correo, token, nuevaContrasena });
