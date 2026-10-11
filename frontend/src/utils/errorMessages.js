export const ERROR_MESSAGES = Object.freeze({
  400: "La solicitud contiene datos inválidos. Revisa la información e inténtalo nuevamente.",
  401: "Tu sesión no está activa o expiró. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta acción.",
  404: "No encontramos el recurso solicitado.",
  409: "La información entra en conflicto con un registro existente.",
  422: "Hay campos inválidos o incompletos.",
  500: "El servidor encontró un problema. Inténtalo más tarde.",
});

export const getFriendlyErrorMessage = (error) => {
  const status = error?.status || error?.response?.status;

  if (status && ERROR_MESSAGES[status]) {
    return ERROR_MESSAGES[status];
  }

  if (error?.message === "Failed to fetch") {
    return "No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté encendido.";
  }

  return error?.message || "Ocurrió un error inesperado.";
};
