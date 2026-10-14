import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { UsuarioForm } from "../../../components/usuarios/UsuarioForm";
import { useUsuarios } from "../../../context/usuarios/useUsuarios";
import { useToast } from "../../../context/toast/useToast";
import { ROUTES } from "../../../constants/routes";
import { mismoId } from "../../../utils/id";
import { validarUsuarioAdministrativo } from "../../../utils/adminUsuariosValidation";

const FormularioEdicion = ({ usuario, editarUsuario }) => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [formulario, setFormulario] = useState({
    nombre: usuario.nombre, correo: usuario.correo, boleta: usuario.boleta, rol: usuario.rol,
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const handleChange = ({ target }) => {
    setFormulario((prev) => ({ ...prev, [target.name]: target.value }));
    setErrores((prev) => ({ ...prev, [target.name]: "" }));
  };
  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (enviando) return;
    const erroresFormulario = validarUsuarioAdministrativo(formulario, { edicion: true });
    if (Object.keys(erroresFormulario).length) {
      setErrores(erroresFormulario);
      error("Revisa los datos del formulario.");
      return;
    }
    setEnviando(true);
    try {
      await editarUsuario(usuario.id, formulario);
      success("Usuario actualizado en MySQL.");
      navigate(ROUTES.ADMIN_USUARIOS);
    } catch (fallo) {
      error(fallo.message || "No se pudo actualizar el usuario.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <UsuarioForm formulario={formulario} handleChange={handleChange}
      handleSubmit={handleSubmit} buttonText="Actualizar usuario"
      errors={errores} enviando={enviando} edicion />
  );
};

export const AdminEditarUsuario = () => {
  const { id } = useParams();
  const { usuarios, editarUsuario, cargando, errorCarga } = useUsuarios();
  const usuario = usuarios.find((dato) => mismoId(dato.id, id));

  if (cargando) return <p role="status">Cargando usuario desde MySQL…</p>;
  if (errorCarga) return <p role="alert" className="text-red-700">{errorCarga}</p>;
  if (!usuario) return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-red-600">Usuario no encontrado o desactivado.</h2>
      <Link to={ROUTES.ADMIN_USUARIOS} className="text-[#6F1D46] underline">Volver a usuarios</Link>
    </section>
  );
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Editar usuario</h1>
      <FormularioEdicion key={usuario.id} usuario={usuario} editarUsuario={editarUsuario} />
    </section>
  );
};
