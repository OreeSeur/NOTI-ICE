export const DOCUMENT_TYPES = [
  { value: "PDF", label: "PDF", extensions: ["pdf"], accept: ".pdf" },
  {
    value: "Imagen",
    label: "Imagen",
    extensions: ["jpg", "jpeg", "png", "webp"],
    accept: ".jpg,.jpeg,.png,.webp",
  },
  {
    value: "Word",
    label: "Word",
    extensions: ["doc", "docx"],
    accept: ".doc,.docx",
  },
  {
    value: "Excel",
    label: "Excel",
    extensions: ["xls", "xlsx"],
    accept: ".xls,.xlsx",
  },
  {
    value: "PowerPoint",
    label: "PowerPoint",
    extensions: ["ppt", "pptx"],
    accept: ".ppt,.pptx",
  },
  { value: "Texto", label: "Texto", extensions: ["txt"], accept: ".txt" },
  { value: "Enlace", label: "Enlace", extensions: [], accept: "" },
  { value: "Otro", label: "Otro", extensions: [], accept: "" },
];

// Máximo de archivos que se pueden subir en una sola vez (un documento por archivo)
export const MAX_UPLOAD_FILES = 5;

export const DOCUMENT_ACCEPT = DOCUMENT_TYPES.map((type) => type.accept)
  .filter(Boolean)
  .join(",");

export const getDocumentTitle = (documento) =>
  documento?.titulo || documento?.nombre || "Documento sin título";

export const getDocumentExtension = (fileName = "") => {
  const parts = String(fileName).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

export const inferDocumentTypeFromFile = (fileName = "") => {
  const extension = getDocumentExtension(fileName);

  const match = DOCUMENT_TYPES.find((type) =>
    type.extensions.includes(extension)
  );

  return match?.value || "Otro";
};

export const getDocumentIcon = (tipo = "") => {
  const normalizedType = String(tipo).toLowerCase();

  if (normalizedType.includes("pdf")) return "📕";
  if (normalizedType.includes("imagen")) return "🖼️";
  if (normalizedType.includes("word")) return "📝";
  if (normalizedType.includes("excel")) return "📊";
  if (normalizedType.includes("powerpoint")) return "📽️";
  if (normalizedType.includes("texto")) return "📄";
  if (normalizedType.includes("enlace")) return "🔗";

  return "📁";
};

export const formatFileSize = (size) => {
  const numericSize = Number(size);

  if (!numericSize) return "";

  if (numericSize < 1024) return `${numericSize} B`;
  if (numericSize < 1024 * 1024) return `${(numericSize / 1024).toFixed(1)} KB`;

  return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`;
};
