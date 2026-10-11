import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { UsuarioForm } from "../../../components/usuarios/UsuarioForm";
import { useUsuarios } from "../../../context/usuarios/useUsuarios";
import { useToast } from "../../../context/toast/useToast";
import { ROLES } from "../../../constants/roles";
import { ROUTES } from "../../../constants/routes";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateUsuario,
} from "../../../utils/validation";

export const AdminNuevoUsuario = () => {
  const navigate = useNavigate();

  const { agregarUsuario } = useUsuarios();
  const { success, error } = useToast();

  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    boleta: "",
    carrera: "",
    semestre: "",
    rol: ROLES.ALUMNO,
    estado: "activo",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });

    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const datosNormalizados = normalizeFormValues(formulario);
    const validationErrors = validateUsuario(datosNormalizados);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      error("Revisa los campos marcados");
      return;
    }

    try {
      agregarUsuario(datosNormalizados);
      success("Usuario creado correctamente");
      navigate(ROUTES.ADMIN_USUARIOS);
    } catch (err) {
      error(err.message || "Error al crear usuario");
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Nuevo Usuario</h1>

      <UsuarioForm
        formulario={formulario}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText="Guardar Usuario"
        errors={errors}
      />
    </section>
  );
};
