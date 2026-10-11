import { Link } from "react-router-dom";
import { X } from "lucide-react";

import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPES,
  MAX_UPLOAD_FILES,
  formatFileSize,
} from "../../utils/documentTypes";
import { ROUTES } from "../../constants/routes";
import { AudienceFields } from "../common/AudienceFields";
import { FormError } from "../common/FormError";

export const DocumentoForm = ({
  formulario,
  handleChange,
  handleSubmit,
  buttonText,
  errors = {},
  handleAudienceChange,
  guardando = false,
  modoEdicion = false,
  cancelTo = ROUTES.ADMIN_DOCUMENTOS,
  // Modo "varios archivos" (solo al crear): un documento por cada archivo
  permitirVarios = false,
  handleFilesChange,
  handleRemoveFile,
}) => {
  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-2 bg-transparent ${
      errors[field] ? "border-red-500" : "border-slate-300 dark:border-slate-700"
    }`;

  const archivos = permitirVarios ? formulario.archivos ?? [] : [];
  const variosArchivos = archivos.length > 1;
  const limiteAlcanzado = archivos.length >= MAX_UPLOAD_FILES;

  const onFilesSelected = (e) => {
    const seleccionados = Array.from(e.target.files || []);
    // Se limpia el input para poder volver a elegir el mismo archivo después de quitarlo
    e.target.value = "";
    if (seleccionados.length > 0) handleFilesChange(seleccionados);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 space-y-5"
    >
      <div>
        <label className="block mb-2 font-medium">Título</label>
        <input
          type="text"
          name="titulo"
          value={formulario.titulo ?? ""}
          onChange={handleChange}
          className={inputClass("titulo")}
          placeholder="Ej. Calendario escolar 2026"
        />
        {variosArchivos && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Con varios archivos, cada documento se llamará «{formulario.titulo || "Título"} - nombre del archivo».
          </p>
        )}
        <FormError message={errors.titulo} />
      </div>

      {variosArchivos ? (
        <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          El tipo de documento se detecta automáticamente según cada archivo.
        </p>
      ) : (
        <div>
          <label className="block mb-2 font-medium">Tipo de documento</label>
          <select
            name="tipo"
            value={formulario.tipo ?? ""}
            onChange={handleChange}
            className={inputClass("tipo")}
          >
            <option value="">Selecciona un tipo</option>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <FormError message={errors.tipo} />
        </div>
      )}

      <div>
        <label className="block mb-2 font-medium">
          {permitirVarios ? "Archivos" : "Archivo"}
        </label>

        <input
          type="file"
          name="archivo"
          accept={DOCUMENT_ACCEPT}
          multiple={permitirVarios}
          disabled={permitirVarios && limiteAlcanzado}
          onChange={permitirVarios ? onFilesSelected : handleChange}
          className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
        />

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Tipos sugeridos: PDF, imagen, Word, Excel, PowerPoint o texto.
          {modoEdicion
            ? " Si no eliges un archivo nuevo, se conserva el actual."
            : permitirVarios
              ? ` Puedes subir hasta ${MAX_UPLOAD_FILES} archivos a la vez: se crea un documento por cada uno.`
              : " Puedes adjuntar un archivo, escribir un enlace, o ambos."}
        </p>

        {permitirVarios && archivos.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {archivos.length} de {MAX_UPLOAD_FILES} archivos
            </p>
            <ul className="space-y-2">
              {archivos.map((archivo, index) => (
                <li
                  key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-700"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800 dark:text-white">
                      {archivo.name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-300">
                      {formatFileSize(archivo.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    aria-label={`Quitar ${archivo.name}`}
                    className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-red-600 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!permitirVarios && formulario.archivoNombre && (
          <div className="mt-3 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-700">
            <p className="font-medium text-slate-800 dark:text-white">
              Archivo seleccionado: {formulario.archivoNombre}
            </p>
            {formulario.archivoTamaño && (
              <p className="text-slate-500 dark:text-slate-300">
                Tamaño: {formatFileSize(formulario.archivoTamaño)}
              </p>
            )}
          </div>
        )}

        <FormError message={errors.archivo} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Enlace opcional</label>
        <input
          type="url"
          name="url"
          value={formulario.url ?? ""}
          onChange={handleChange}
          disabled={variosArchivos}
          className={`${inputClass("url")} disabled:cursor-not-allowed disabled:opacity-50`}
          placeholder="https://..."
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {variosArchivos
            ? "El enlace solo se puede usar al subir un único documento."
            : "Puedes usarlo para documentos alojados en Drive, OneDrive o un servidor institucional."}
        </p>
        <FormError message={errors.url} />
      </div>

      <div>
        <label className="block mb-2 font-medium">Descripción</label>
        <textarea
          name="descripcion"
          value={formulario.descripcion ?? ""}
          onChange={handleChange}
          rows="5"
          className={inputClass("descripcion")}
          placeholder="Explica para qué sirve el documento o quién debe consultarlo."
        />
        <FormError message={errors.descripcion} />
      </div>

      <AudienceFields
        audiencia={formulario.audiencia}
        onChange={handleAudienceChange}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Link
          to={cancelTo}
          className="w-full rounded-lg border border-slate-300 px-6 py-3 text-center text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
        >
          {buttonText}
        </button>
      </div>
    </form>
  );
};
