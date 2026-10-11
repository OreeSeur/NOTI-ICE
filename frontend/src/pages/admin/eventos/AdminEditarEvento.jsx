import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../../context/auth/useAuth";
import { useEventos } from "../../../context/eventos/useEventos";
import { useToast } from "../../../context/toast/useToast";
import { EventoForm } from "../../../components/eventos/EventoForm";
import { ROLES } from "../../../constants/roles";
import { ROUTES } from "../../../constants/routes";
import { mismoId } from "../../../utils/id";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateEvento,
} from "../../../utils/validation";
import { normalizeAudience } from "../../../utils/audience";

// Formulario de edición. Se monta SOLO cuando el evento ya llegó del servidor,
// así el estado inicial siempre tiene los datos reales (aunque recargues la página).
const EditarEventoForm = ({ evento, volverA }) => {
  const navigate = useNavigate();

  const { editarEvento } = useEventos();
  const { success, error } = useToast();

  const [formulario, setFormulario] = useState(() => ({
    ...evento,
    audiencia: normalizeAudience(evento.audiencia),
  }));
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

    // La regla "no fechas pasadas" solo aplica si se cambió la fecha:
    // así se puede corregir un evento que ya ocurrió sin tener que tocarla.
    if (datosNormalizados.fecha && datosNormalizados.fecha === evento.fecha) {
      delete validationErrors.fecha;
    }

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      error("Revisa los campos marcados");
      return;
    }

    try {
      await editarEvento(evento.id, datosNormalizados);
      success("Evento actualizado correctamente");
      navigate(volverA);
    } catch (err) {
      error(err.message || "No se pudo actualizar el evento");
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Editar Evento
        </h1>
      </header>

      <EventoForm
        formulario={formulario}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText="Actualizar Evento"
        errors={errors}
        handleAudienceChange={handleAudienceChange}
        cancelTo={volverA}
      />
    </section>
  );
};

// Sirve para dos rutas: /admin/eventos/editar/:id (Administrador)
// y /eventos/editar/:id (Docente, solo sobre sus propios eventos).
export const AdminEditarEvento = () => {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const { eventos, loading } = useEventos();

  const esAdmin = hasRole([ROLES.ADMIN]);
  const volverA = esAdmin ? ROUTES.ADMIN_EVENTOS : ROUTES.DOCENTE_PUBLICACIONES;

  const evento = eventos.find((item) => mismoId(item.id, id));

  if (loading) {
    return (
      <section>
        <p className="text-slate-500 dark:text-slate-300">Cargando evento...</p>
      </section>
    );
  }

  if (!evento) {
    return (
      <section>
        <h2 className="text-red-600 font-bold text-xl">Evento no encontrado</h2>
      </section>
    );
  }

  if (!esAdmin && String(evento.idUsuario) !== String(user?.id)) {
    return (
      <section className="space-y-3">
        <h2 className="text-red-600 font-bold text-xl">
          Solo puedes editar los eventos que tú publicaste
        </h2>
        <Link to={volverA} className="text-[#6F1D46] underline dark:text-pink-200">
          Volver a mis publicaciones
        </Link>
      </section>
    );
  }

  return <EditarEventoForm key={evento.id} evento={evento} volverA={volverA} />;
};
