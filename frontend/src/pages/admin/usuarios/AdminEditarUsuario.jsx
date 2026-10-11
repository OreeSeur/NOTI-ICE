import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { UsuarioForm } from "../../../components/usuarios/UsuarioForm";
import { useUsuarios } from "../../../context/usuarios/useUsuarios";
import { useToast } from "../../../context/toast/useToast";
import { ROUTES } from "../../../constants/routes";
import { ROLES } from "../../../constants/roles";
import { mismoId } from "../../../utils/id";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateUsuario,
} from "../../../utils/validation";

export const AdminEditarUsuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { usuarios, editarUsuario } = useUsuarios();
  const { success, error } = useToast();

  const usuario = usuarios.find((u) => mismoId(u.id, id));

  const [formulario, setFormulario] = useState(
    usuario || {
      nombre: "",
      correo: "",
      boleta: "",
      carrera: "",
      semestre: "",
      rol: ROLES.ALUMNO,
      estado: "activo",
      password: "",
    }
  );
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
      editarUsuario(id, datosNormalizados);
      success("Usuario actualizado correctamente");
      navigate(ROUTES.ADMIN_USUARIOS);
    } catch (err) {
      error(err.message || "Error al actualizar usuario");
    }
  };

  if (!usuario) {
    return (
      <section>
        <h2 className="text-red-600 font-bold text-xl">
          Usuario no encontrado
        </h2>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Editar Usuario</h1>

      <UsuarioForm
        formulario={formulario}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText="Actualizar Usuario"
        errors={errors}
      />
    </section>
  );
};
