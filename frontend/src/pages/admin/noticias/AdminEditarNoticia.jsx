import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useNoticias } from "../../../context/noticias/useNoticias";
import { useToast } from "../../../context/toast/useToast";
import { NoticiaForm } from "../../../components/noticias/NoticiaForm";
import { ROUTES } from "../../../constants/routes";
import { mismoId } from "../../../utils/id";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateNoticia,
} from "../../../utils/validation";
import { normalizeAudience } from "../../../utils/audience";

// Se monta SOLO cuando la noticia ya llegó del servidor (así no queda vacío al recargar la página)
const EditarNoticiaForm = ({ noticia }) => {
  const navigate = useNavigate();

  const { editarNoticia } = useNoticias();
  const { success, error } = useToast();

  const [formData, setFormData] = useState(() => ({
    ...noticia,
    audiencia: normalizeAudience(noticia.audiencia),
  }));
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
      await editarNoticia(noticia.id, datosNormalizados);
      success("Noticia actualizada correctamente");
      navigate(ROUTES.ADMIN_NOTICIAS);
    } catch (err) {
      error(err.message || "No se pudo actualizar la noticia");
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
        Editar Noticia
      </h1>

      <NoticiaForm
        formData={formData}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText="Actualizar Noticia"
        errors={errors}
        handleAudienceChange={handleAudienceChange}
      />
    </section>
  );
};

export const AdminEditarNoticia = () => {
  const { id } = useParams();
  const { noticias, loading } = useNoticias();

  const noticia = noticias.find((item) => mismoId(item.id, id));

  if (loading) {
    return (
      <section>
        <p className="text-slate-500 dark:text-slate-300">Cargando noticia...</p>
      </section>
    );
  }

  if (!noticia) {
    return (
      <section>
        <h2 className="text-red-600 font-bold text-xl">Noticia no encontrada</h2>
      </section>
    );
  }

  return <EditarNoticiaForm key={noticia.id} noticia={noticia} />;
};
