import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useEventos } from "../../context/eventos/useEventos";
import { useAuth } from "../../context/auth/useAuth";
import { useToast } from "../../context/toast/useToast";
import { EventoForm } from "../../components/eventos/EventoForm";
import { ROUTES } from "../../constants/routes";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateEvento,
} from "../../utils/validation";
import { normalizeAudience } from "../../utils/audience";

export const EventoNuevo = () => {
  const navigate = useNavigate();
  const { agregarEvento } = useEventos();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [formulario, setFormulario] = useState({
    titulo: "",
    fecha: "",
    lugar: "",
    categoria: "",
    descripcion: "",
    audiencia: normalizeAudience(),
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

  const handleAudienceChange = (field, value) => {
    setFormulario((prev) => {
      const audienciaActual = normalizeAudience(prev.audiencia);

      return {
        ...prev,
        audiencia: {
          ...audienciaActual,
          [field]: value,
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const datosNormalizados = normalizeFormValues(formulario);
    const validationErrors = validateEvento(datosNormalizados);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      error("Revisa los campos marcados");
      return;
    }

    try {
      await agregarEvento(datosNormalizados, user?.id);
      success("Evento creado correctamente");
      navigate(ROUTES.EVENTOS);
    } catch (err) {
      error(err.message || "No se pudo crear el evento");
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Nuevo Evento
        </h1>
      </header>

      <EventoForm
        formulario={formulario}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText="Guardar Evento"
        errors={errors}
        handleAudienceChange={handleAudienceChange}
        cancelTo={ROUTES.EVENTOS}
      />
    </section>
  );
};
