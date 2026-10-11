import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import { useAuth } from "../../context/auth/useAuth";

const fieldWrapperClass =
  "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 transition focus-within:border-[#6F1D46] focus-within:ring-4 focus-within:ring-[#6F1D46]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const inputClass =
  "w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500";

const labelClass =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";

const iconClass = "shrink-0 text-[#6F1D46] dark:text-pink-100";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
    boleta: "",
    carrera: "",
    semestre: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "login") {
      const resultado = await login(formData.correo, formData.password);
      setLoading(false);

      if (resultado.ok) {
        navigate("/");
        return;
      }

      setError(resultado.mensaje || "Credenciales incorrectas");
      return;
    }

    const resultado = await register({
      nombre: formData.nombre,
      correo: formData.correo,
      password: formData.password,
      boleta: formData.boleta,
      carrera: formData.carrera,
      semestre: formData.semestre,
    });
    setLoading(false);

    if (!resultado.ok) {
      setError(resultado.mensaje || "El usuario ya existe");
      return;
    }

    navigate("/");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/20 sm:p-8"
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#6F1D46] via-[#750946] to-[#636569]" />

      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#6F1D46]/10 text-[#6F1D46] dark:bg-pink-100/10 dark:text-pink-100">
          <ShieldCheck size={24} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6F1D46] dark:text-pink-100">
            Acceso institucional
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === "login"
              ? "Ingresa con tu correo y contraseña registrados."
              : "Regístrate como alumno para personalizar tu experiencia."}
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-xl px-4 py-2 transition ${
            mode === "login"
              ? "bg-white text-[#6F1D46] shadow-sm dark:bg-slate-800 dark:text-pink-100"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-xl px-4 py-2 transition ${
            mode === "register"
              ? "bg-white text-[#6F1D46] shadow-sm dark:bg-slate-800 dark:text-pink-100"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          Registro
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {mode === "register" && (
          <>
            <div>
              <label className={labelClass}>Nombre</label>
              <div className={fieldWrapperClass}>
                <User size={18} className={iconClass} />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nombre completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Boleta</label>
              <div className={fieldWrapperClass}>
                <IdCard size={18} className={iconClass} />
                <input
                  type="text"
                  name="boleta"
                  value={formData.boleta}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Número de boleta"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Carrera</label>
              <div className={fieldWrapperClass}>
                <GraduationCap size={18} className={iconClass} />
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Selecciona una carrera</option>
                  <option value="Ingeniería en Comunicaciones y Electrónica">
                    Ingeniería en Comunicaciones y Electrónica
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Semestre</label>
              <div className={fieldWrapperClass}>
                <GraduationCap size={18} className={iconClass} />
                <select
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Selecciona semestre</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((semestre) => (
                    <option key={semestre} value={semestre}>
                      {semestre}° Semestre
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        <div>
          <label className={labelClass}>Correo</label>
          <div className={fieldWrapperClass}>
            <Mail size={18} className={iconClass} />
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              className={inputClass}
              placeholder="correo@esime.mx"
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Contraseña</label>
          <div className={fieldWrapperClass}>
            <Lock size={18} className={iconClass} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
              placeholder="Contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#6F1D46] dark:hover:bg-slate-800 dark:hover:text-pink-100"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {mode === "login" && (
  <div className="text-right">
    <Link
      to="/recuperar-contrasena"
      className="text-sm font-semibold text-[#6F1D46] hover:underline dark:text-pink-100"
    >
      ¿Olvidaste tu contraseña?
    </Link>
  </div>
)}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-[#6F1D46] px-5 py-3 font-bold text-white shadow-lg shadow-[#6F1D46]/20 transition hover:-translate-y-0.5 hover:bg-[#750946] focus:outline-none focus:ring-4 focus:ring-[#6F1D46]/20 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {loading
          ? "Un momento..."
          : mode === "login"
          ? "Ingresar"
          : "Registrarse"}
      </button>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
        <button
          type="button"
          className="font-bold text-[#6F1D46] transition hover:underline dark:text-pink-100"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Regístrate" : "Inicia sesión"}
        </button>
      </p>
    </form>
  );
};
