import { crearId, mismoId } from "../utils/id";
import { ROLES } from "../constants/roles";
import { DEFAULT_SUBSCRIPTIONS, normalizeSubscriptions } from "../constants/subscriptions";
import { normalizeAcademicProfile } from "../utils/academicProfile";
import {
  obtenerUsuariosStorage,
  guardarUsuariosStorage,
} from "../storage/usuariosStorage";

export const obtenerUsuarios = () => obtenerUsuariosStorage();

export const guardarUsuarios = (usuarios) =>
  guardarUsuariosStorage(usuarios);

export const crearUsuario = (nuevoUsuario) => {
  const usuario = {
    id: crearId(),
    createdAt: new Date().toISOString(),
    nombre: "",
    correo: "",
    boleta: "",
    carrera: "",
    semestre: "",
    rol: ROLES.ALUMNO,
    estado: "activo",
    password: "",
    subscriptions: DEFAULT_SUBSCRIPTIONS,
    academicProfile: null,
    ...nuevoUsuario,
  };

  if (usuario.email && !usuario.correo) {
    usuario.correo = usuario.email;
  }

  delete usuario.email;

  usuario.subscriptions = normalizeSubscriptions(usuario.subscriptions);
  usuario.academicProfile = usuario.academicProfile
    ? normalizeAcademicProfile(usuario.academicProfile)
    : null;

  return usuario;
};

export const existeCorreo = (usuarios, correo, idIgnorado = null) =>
  usuarios.some(
    (usuario) =>
      usuario.correo?.toLowerCase() === correo?.toLowerCase() &&
      (idIgnorado === null || !mismoId(usuario.id, idIgnorado))
  );

export const agregarUsuarioLista = (usuarios, nuevoUsuario) => [
  crearUsuario(nuevoUsuario),
  ...usuarios,
];

export const editarUsuarioLista = (usuarios, id, datosActualizados) =>
  usuarios.map((usuario) =>
    mismoId(usuario.id, id)
      ? {
          ...usuario,
          ...datosActualizados,
          subscriptions: datosActualizados.subscriptions
            ? normalizeSubscriptions(datosActualizados.subscriptions)
            : usuario.subscriptions,
          academicProfile: datosActualizados.academicProfile
            ? normalizeAcademicProfile(datosActualizados.academicProfile)
            : usuario.academicProfile,
          updatedAt: new Date().toISOString(),
        }
      : usuario
  );

export const eliminarUsuarioLista = (usuarios, id) =>
  usuarios.filter((usuario) => !mismoId(usuario.id, id));
