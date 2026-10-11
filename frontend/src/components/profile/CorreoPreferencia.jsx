import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

import { get, put } from "../../api/apiClient";
import { getApiErrorMessage } from "../../api/apiError";

const RUTA = "/auth/preferencias-correo";

// Interruptor para recibir por correo las publicaciones dirigidas al perfil
export const CorreoPreferencia = () => {
  const [activa, setActiva] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    get(RUTA)
      .then((respuesta) => {
        if (vigente) setActiva(Boolean(respuesta.notificarPorCorreo));
      })
      .catch((err) => {
        if (vigente) setError(getApiErrorMessage(err));
      });

    return () => {
      vigente = false;
    };
  }, []);

  const cambiar = async () => {
    const nueva = !activa;
    setGuardando(true);
    setError("");

    try {
      const respuesta = await put(RUTA, { notificarPorCorreo: nueva });
      setActiva(Boolean(respuesta.notificarPorCorreo));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#6F1D46]/10 text-[#6F1D46] dark:bg-pink-100/10 dark:text-pink-100">
            <Mail size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Avisos por correo
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Recibe en tu correo las noticias, eventos y documentos nuevos dirigidos a tu perfil.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={Boolean(activa)}
          aria-label="Recibir avisos por correo"
          disabled={activa === null || guardando}
          onClick={cambiar}
          className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
            activa ? "bg-[#6F1D46]" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${
              activa ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-300">{error}</p>
      )}
    </section>
  );
};
