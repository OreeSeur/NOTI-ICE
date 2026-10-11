import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useNoticias } from "../../context/noticias/useNoticias";
import { useAuth } from "../../context/auth/useAuth";
import { useToast } from "../../context/toast/useToast";
import { NoticiaForm } from "../../components/noticias/NoticiaForm";
import { ROUTES } from "../../constants/routes";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateNoticia,
} from "../../utils/validation";
import { normalizeAudience } from "../../utils/audience";

export const NoticiaNueva = () => {
  const navigate = useNavigate();

  const { agregarNoticia } = useNoticias();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    audiencia: normalizeAudience(),
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
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
    setFormData((prev) => {
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

    const datosNormalizados = normalizeFormValues(formData);
    const validationErrors = validateNoticia(datosNormalizados);

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      error("Revisa los campos marcados");
      return;
    }

    try {
      await agregarNoticia(datosNormalizados, user?.id);
      success("Noticia creada correctamente");
      navigate(ROUTES.NOTICIAS);
    } catch (err) {
      error(err.message || "No se pudo crear la noticia");
    }
  };

  return (
    <section>
      <h1
        className="
          text-3xl
          font-bold
          mb-8
          text-slate-800
          dark:text-white
        "
      >
        Nueva Noticia
      </h1>

      <NoticiaForm
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText="Guardar Noticia"
        errors={errors}
        handleAudienceChange={handleAudienceChange}
        cancelTo={ROUTES.NOTICIAS}
      />
    </section>
  );
};
