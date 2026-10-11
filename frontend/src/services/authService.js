import { post, put } from "../api/apiClient";
import { ENDPOINTS } from "../api/endpoints";
import { setAuthToken, clearAuthToken } from "../api/authToken";
import {
  obtenerUsuarioSesion,
  guardarUsuarioSesion,
  eliminarUsuarioSesion,
} from "../storage/authStorage";

// Convierte la respuesta del backend (LoginResponseDto) a la forma que espera el resto del frontend
const mapAuthResponseToUser = (respuesta) => ({
  id: respuesta.idUsuario,
  nombre: respuesta.nombre,
  correo: respuesta.correo,
  idRol: respuesta.idRol,
  rol: respuesta.rolNombre, // ej. "Administrador", "Docente", "Alumno"
  boleta: respuesta.noIdentificacion ?? "",
  carrera: respuesta.carrera ?? "",
  semestre: respuesta.semestre ?? "",
  estado: "activo",
});

export const obtenerSesion = () => obtenerUsuarioSesion();

export const guardarSesion = (usuario) => guardarUsuarioSesion(usuario);

export const cerrarSesion = () => {
  clearAuthToken();
  eliminarUsuarioSesion();
};

// Llama al backend real. Lanza ApiError si las credenciales son incorrectas.
export const autenticarUsuario = async (correo, contrasena) => {
  const respuesta = await post(ENDPOINTS.auth.login, { correo, contrasena });
  setAuthToken(respuesta.token);
  return mapAuthResponseToUser(respuesta);
};

// Registro público: siempre crea al usuario como Alumno (el backend lo decide, no el frontend)
export const registrarUsuario = async ({ nombre, boleta, correo, password, carrera, semestre }) => {
  const respuesta = await post(ENDPOINTS.auth.register, {
    nombre,
    noIdentificacion: Number(boleta),
    correo,
    contrasena: password,
    carrera,
    semestre: Number(semestre),
  });
  setAuthToken(respuesta.token);
  return mapAuthResponseToUser(respuesta);
};

// El semestre se guarda como número del 1 al 9. Si llega algo que no lo es
// (por ejemplo "Materias mixtas"), se devuelve null y no se toca el valor guardado.
const semestreANumero = (valor) => {
  const coincidencia = String(valor ?? "").match(/\d+/);
  const numero = coincidencia ? Number(coincidencia[0]) : NaN;
  return numero >= 1 && numero <= 9 ? numero : null;
};

// Guarda en el backend el nombre, la carrera y el semestre de la persona con sesión iniciada.
export const actualizarPerfilApi = async ({ nombre, carrera, semestre }) => {
  const perfil = await put(ENDPOINTS.auth.perfil, {
    nombre,
    carrera: carrera || null,
    semestre: semestreANumero(semestre),
  });

  return {
    nombre: perfil.nombre,
    carrera: perfil.carrera ?? "",
    semestre: perfil.semestre ?? "",
  };
};
