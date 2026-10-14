import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { UsuarioForm } from "../../../components/usuarios/UsuarioForm";
import { useUsuarios } from "../../../context/usuarios/useUsuarios";
import { useToast } from "../../../context/toast/useToast";
import { ROLES } from "../../../constants/roles";
import { ROUTES } from "../../../constants/routes";
import { validarUsuarioAdministrativo } from "../../../utils/adminUsuariosValidation";

export const AdminNuevoUsuario = () => {
  const navigate = useNavigate();
  const { agregarUsuario } = useUsuarios();
  const { success, error } = useToast();
  const [formulario, setFormulario] = useState({
    nombre: "", correo: "", boleta: "", rol: ROLES.ALUMNO, password: "",
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
    const erroresFormulario = validarUsuarioAdministrativo(formulario);
    if (Object.keys(erroresFormulario).length) {
      setErrores(erroresFormulario);
      error("Revisa los datos del formulario.");
      return;
    }
    setEnviando(true);
    try {
      await agregarUsuario(formulario);
      success("Usuario creado en MySQL correctamente.");
      navigate(ROUTES.ADMIN_USUARIOS);
    } catch (fallo) {
      error(fallo.message || "No se pudo registrar el usuario.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Nuevo usuario</h1>
      <UsuarioForm formulario={formulario} handleChange={handleChange}
        handleSubmit={handleSubmit} buttonText="Guardar usuario"
        errors={errores} enviando={enviando} />
    </section>
  );
};
