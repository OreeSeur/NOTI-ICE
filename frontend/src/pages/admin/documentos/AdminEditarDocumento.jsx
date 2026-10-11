import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { DocumentoForm } from "../../../components/documentos/DocumentoForm";
import { useAuth } from "../../../context/auth/useAuth";
import { useDocumentos } from "../../../context/documentos/useDocumentos";
import { useToast } from "../../../context/toast/useToast";
import { ROLES } from "../../../constants/roles";
import { ROUTES } from "../../../constants/routes";
import { mismoId } from "../../../utils/id";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateDocumento,
} from "../../../utils/validation";
import { normalizeAudience } from "../../../utils/audience";
import { inferDocumentTypeFromFile } from "../../../utils/documentTypes";

const documentoVacio = {
  titulo: "",
  tipo: "",
  fecha: "",
  descripcion: "",
  archivo: null,
  archivoNombre: "",
  archivoTipo: "",
  archivoTamaño: "",
  url: "",
  audiencia: normalizeAudience(),
};

// Formulario de edición. Se monta SOLO cuando el documento ya llegó del servidor,
// así el estado inicial siempre tiene los datos reales (aunque recargues la página).
const EditarDocumentoForm = ({ documento, volverA }) => {
  const navigate = useNavigate();

  const { editarDocumento } = useDocumentos();
  const { success, error } = useToast();

  const [formulario, setFormulario] = useState(() => ({
    ...documentoVacio,
    ...documento,
    titulo: documento?.titulo ?? documento?.nombre ?? "",
  }));
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    if (type === "file") {
      const file = files?.[0];

      if (!file) return;

      setFormulario({
        ...formulario,
        tipo: formulario.tipo || inferDocumentTypeFromFile(file.name),
        archivo: file,
        archivoNombre: file.name,
        archivoTipo: file.type,
        archivoTamaño: file.size,
      });

      if (errors.tipo || errors.url) {
        setErrors({ ...errors, tipo: "", url: "" });
      }

      return;
    }

    setFormulario({
      ...formulario,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
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
    const validationErrors = validateDocumento(datosNormalizados);

    // Al editar basta con que ya exista un archivo en el servidor, o un enlace
    if (!datosNormalizados.archivo && !datosNormalizados.archivoNombre && !datosNormalizados.url) {
      validationErrors.url = "Adjunta un archivo o escribe un enlace";
    }

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      error("Revisa los campos marcados");
      return;
    }

    setGuardando(true);
    try {
      await editarDocumento(documento.id, datosNormalizados);
      success("Documento actualizado correctamente");
      navigate(volverA);
    } catch (err) {
      error(err.message || "Error al actualizar documento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Editar Documento</h1>

      <DocumentoForm
        formulario={formulario}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText={guardando ? "Guardando..." : "Actualizar Documento"}
        guardando={guardando}
        errors={errors}
        handleAudienceChange={handleAudienceChange}
        modoEdicion
        cancelTo={volverA}
      />
    </section>
  );
};

// Sirve para dos rutas: /admin/documentos/editar/:id (Administrador)
// y /documentos/editar/:id (Docente, solo sobre sus propios documentos).
export const AdminEditarDocumento = () => {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const { documentos, loading } = useDocumentos();

  const esAdmin = hasRole([ROLES.ADMIN]);
  const volverA = esAdmin ? ROUTES.ADMIN_DOCUMENTOS : ROUTES.DOCENTE_PUBLICACIONES;

  const documento = documentos.find((item) => mismoId(item.id, id));

  if (loading) {
    return (
      <section>
        <p className="text-slate-500 dark:text-slate-300">Cargando documento...</p>
      </section>
    );
  }

  if (!documento) {
    return (
      <section>
        <h2 className="text-red-600 font-bold text-xl">
          Documento no encontrado
        </h2>
      </section>
    );
  }

  if (!esAdmin && String(documento.idUsuario) !== String(user?.id)) {
    return (
      <section className="space-y-3">
        <h2 className="text-red-600 font-bold text-xl">
          Solo puedes editar los documentos que tú publicaste
        </h2>
        <Link to={volverA} className="text-[#6F1D46] underline dark:text-pink-200">
          Volver a mis publicaciones
        </Link>
      </section>
    );
  }

  return (
    <EditarDocumentoForm key={documento.id} documento={documento} volverA={volverA} />
  );
};
