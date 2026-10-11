import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { DocumentoForm } from "../../components/documentos/DocumentoForm";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { useToast } from "../../context/toast/useToast";
import { ROUTES } from "../../constants/routes";
import {
  hasValidationErrors,
  normalizeFormValues,
  validateDocumento,
} from "../../utils/validation";
import { normalizeAudience } from "../../utils/audience";
import {
  MAX_UPLOAD_FILES,
  inferDocumentTypeFromFile,
} from "../../utils/documentTypes";

const quitarExtension = (nombre = "") => nombre.replace(/\.[^.]+$/, "");

const mismoArchivo = (a, b) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export const DocumentoNuevo = () => {
  const navigate = useNavigate();

  const { agregarDocumento } = useDocumentos();
  const { success, error } = useToast();

  const [formulario, setFormulario] = useState({
    titulo: "",
    tipo: "",
    descripcion: "",
    archivos: [], // hasta MAX_UPLOAD_FILES archivos reales (File)
    url: "",
    audiencia: normalizeAudience(),
  });
  const [errors, setErrors] = useState({});
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

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

  // Suma los archivos nuevos a los ya elegidos (sin repetir) respetando el límite
  const handleFilesChange = (nuevos) => {
    const combinados = [...formulario.archivos];

    nuevos.forEach((archivo) => {
      if (!combinados.some((existente) => mismoArchivo(existente, archivo))) {
        combinados.push(archivo);
      }
    });

    const excedido = combinados.length > MAX_UPLOAD_FILES;
    const archivos = combinados.slice(0, MAX_UPLOAD_FILES);

    setFormulario({
      ...formulario,
      archivos,
      // Con un solo archivo se sugiere el tipo; con varios se detecta uno por uno al guardar
      tipo:
        archivos.length === 1 && !formulario.tipo
          ? inferDocumentTypeFromFile(archivos[0].name)
          : formulario.tipo,
    });

    setErrors({
      ...errors,
      archivo: excedido
        ? `Solo puedes subir ${MAX_UPLOAD_FILES} archivos a la vez. Se tomaron los primeros ${MAX_UPLOAD_FILES}.`
        : "",
      tipo: "",
      url: "",
    });
  };

  const handleRemoveFile = (index) => {
    setFormulario({
      ...formulario,
      archivos: formulario.archivos.filter((_, i) => i !== index),
    });

    if (errors.archivo) setErrors({ ...errors, archivo: "" });
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

    const datos = normalizeFormValues(formulario);
    const archivos = datos.archivos;
    const varios = archivos.length > 1;

    // Un documento por cada archivo (o uno solo si únicamente hay enlace)
    const documentos =
      archivos.length === 0
        ? [{ ...datos, archivo: null }]
        : archivos.map((archivo) => ({
            ...datos,
            titulo: varios
              ? `${datos.titulo} - ${quitarExtension(archivo.name)}`
              : datos.titulo,
            tipo: varios
              ? inferDocumentTypeFromFile(archivo.name)
              : datos.tipo || inferDocumentTypeFromFile(archivo.name),
            url: varios ? "" : datos.url,
            archivo,
          }));

    // Se valida con el título tal cual lo escribió la persona
    const validationErrors = validateDocumento({
      ...documentos[0],
      titulo: datos.titulo,
    });

    // El backend exige al menos un archivo o un enlace
    if (archivos.length === 0 && !datos.url) {
      validationErrors.archivo = "Adjunta al menos un archivo o escribe un enlace";
    }

    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      error("Revisa los campos marcados");
      return;
    }

    setGuardando(true);

    const fallidos = [];
    let creados = 0;

    // De uno en uno: si alguno falla, los demás ya quedaron guardados
    for (const documento of documentos) {
      try {
        await agregarDocumento(documento);
        creados += 1;
      } catch (err) {
        fallidos.push({ archivo: documento.archivo, mensaje: err.message });
      }
    }

    setGuardando(false);

    if (fallidos.length === 0) {
      success(
        creados === 1
          ? "Documento creado correctamente"
          : `${creados} documentos creados correctamente`
      );
      navigate(ROUTES.DOCUMENTOS);
      return;
    }

    // Falló alguno: en el formulario se quedan solo los que no se pudieron subir
    setFormulario((prev) => ({
      ...prev,
      archivos: fallidos.map((f) => f.archivo).filter(Boolean),
    }));

    const nombres = fallidos
      .map((f) => f.archivo?.name)
      .filter(Boolean)
      .join(", ");

    error(
      creados > 0
        ? `Se crearon ${creados} de ${documentos.length}. No se pudo subir: ${nombres}`
        : fallidos[0].mensaje || "Error al crear documento"
    );
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Nuevo Documento</h1>

      <DocumentoForm
        formulario={formulario}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        buttonText={guardando ? "Guardando..." : "Guardar Documento"}
        guardando={guardando}
        errors={errors}
        handleAudienceChange={handleAudienceChange}
        cancelTo={ROUTES.DOCUMENTOS}
        permitirVarios
        handleFilesChange={handleFilesChange}
        handleRemoveFile={handleRemoveFile}
      />
    </section>
  );
};
