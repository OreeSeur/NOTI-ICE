export const clasesBotonCatalogo =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

export const clasesCampoCatalogo =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

export const describirErrorCatalogo = (error) => {
  const errores = error?.details?.errors;
  if (errores && typeof errores === "object") {
    const primero = Object.values(errores)
      .flat()
      .find((mensaje) => typeof mensaje === "string" && mensaje.trim());
    if (primero) return primero;
  }

  if (error?.status === 0) {
    return "No se pudo conectar con el servidor. Verifica que el backend esté iniciado.";
  }

  return error?.details?.mensaje || error?.message ||
    "No se pudo completar la operación.";
};
