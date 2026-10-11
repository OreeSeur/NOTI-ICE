import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";

import { AuthCard } from "../../components/auth/AuthCard";
import { restablecerContrasena } from "../../services/passwordRecoveryService";
import { getApiErrorMessage } from "../../api/apiError";
import { ROUTES } from "../../constants/routes";

const MIN_LONGITUD = 8;

const fieldWrapperClass =
  "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 transition focus-within:border-[#6F1D46] focus-within:ring-4 focus-within:ring-[#6F1D46]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";

export const RestablecerContrasena = () => {
  const [params] = useSearchParams();
  const correo = params.get("correo") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  if (!correo || !token) {
    return (
      <AuthCard titulo="Enlace no válido">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          El enlace está incompleto. Solicita uno nuevo.
        </p>
        <Link
          to={ROUTES.RECUPERAR_CONTRASENA}
          className="mt-6 block w-full rounded-2xl bg-[#6F1D46] px-5 py-3 text-center font-bold text-white transition hover:bg-[#750946]"
        >
          Solicitar un enlace nuevo
        </Link>
      </AuthCard>
    );
  }

  if (listo) {
    return (
      <AuthCard titulo="Contraseña actualizada">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ya puedes iniciar sesión con tu contraseña nueva.
        </p>
        <Link
          to={ROUTES.LOGIN}
          className="mt-6 block w-full rounded-2xl bg-[#6F1D46] px-5 py-3 text-center font-bold text-white transition hover:bg-[#750946]"
        >
          Iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_LONGITUD) {
      setError(`La contraseña debe tener al menos ${MIN_LONGITUD} caracteres.`);
      return;
    }

    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      await restablecerContrasena({ correo, token, nuevaContrasena: password });
      setListo(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthCard
      titulo="Nueva contraseña"
      descripcion={`Crea una contraseña nueva para ${correo}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className={labelClass}>Contraseña nueva</label>
          <div className={fieldWrapperClass}>
            <Lock size={18} className="shrink-0 text-[#6F1D46] dark:text-pink-100" aria-hidden="true" />
            <input
              id="password"
              type={mostrar ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_LONGITUD}
              required
              autoFocus
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setMostrar(!mostrar)}
              aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="rounded-lg p-1 text-slate-400 transition hover:text-[#6F1D46] dark:hover:text-pink-100"
            >
              {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Mínimo {MIN_LONGITUD} caracteres.
          </p>
        </div>

        <div>
          <label htmlFor="confirmacion" className={labelClass}>Confirma la contraseña</label>
          <div className={fieldWrapperClass}>
            <Lock size={18} className="shrink-0 text-[#6F1D46] dark:text-pink-100" aria-hidden="true" />
            <input
              id="confirmacion"
              type={mostrar ? "text" : "password"}
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              required
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-2xl bg-[#6F1D46] px-5 py-3 font-bold text-white shadow-lg shadow-[#6F1D46]/20 transition hover:bg-[#750946] disabled:opacity-60"
        >
          {cargando ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </AuthCard>
  );
};
