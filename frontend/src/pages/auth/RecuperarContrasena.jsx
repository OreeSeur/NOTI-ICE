import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

import { AuthCard } from "../../components/auth/AuthCard";
import { solicitarRecuperacion } from "../../services/passwordRecoveryService";
import { getApiErrorMessage } from "../../api/apiError";
import { ROUTES } from "../../constants/routes";

const fieldWrapperClass =
  "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 transition focus-within:border-[#6F1D46] focus-within:ring-4 focus-within:ring-[#6F1D46]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export const RecuperarContrasena = () => {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      await solicitarRecuperacion(correo.trim());
      setEnviado(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <AuthCard titulo="Revisa tu correo">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Si <strong>{correo.trim()}</strong> está registrado, te enviamos un
          enlace para crear una contraseña nueva. El enlace vence en 30 minutos
          y solo se puede usar una vez.
        </p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Si no lo ves, revisa la carpeta de correo no deseado.
        </p>
        <Link
          to={ROUTES.LOGIN}
          className="mt-6 block w-full rounded-2xl bg-[#6F1D46] px-5 py-3 text-center font-bold text-white transition hover:bg-[#750946]"
        >
          Volver a iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      titulo="Recuperar contraseña"
      descripcion="Escribe tu correo y te enviaremos un enlace para crear una nueva."
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <label
          htmlFor="correo"
          className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          Correo
        </label>
        <div className={fieldWrapperClass}>
          <Mail size={18} className="shrink-0 text-[#6F1D46] dark:text-pink-100" aria-hidden="true" />
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="correo@esime.mx"
            required
            autoFocus
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="mt-6 w-full rounded-2xl bg-[#6F1D46] px-5 py-3 font-bold text-white shadow-lg shadow-[#6F1D46]/20 transition hover:bg-[#750946] disabled:opacity-60"
        >
          {cargando ? "Enviando..." : "Enviar enlace"}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            to={ROUTES.LOGIN}
            className="font-bold text-[#6F1D46] hover:underline dark:text-pink-100"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};
