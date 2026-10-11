import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  GraduationCap,
  Layers3,
  Plus,
  School,
  Trash2,
  UserCheck,
} from "lucide-react";

import { getPlanLabel, PERIODOS_ACADEMICOS, PLANES_ESTUDIO } from "../../constants/academic";
import { ROUTES } from "../../constants/routes";
import { ROLES, normalizeRole } from "../../constants/roles";
import { useAcademico } from "../../context/academico/useAcademico";
import { useToast } from "../../context/toast/useToast";
import { useUsuarios } from "../../context/usuarios/useUsuarios";
import { FormError } from "../common/FormError";
import { StatusBadge } from "../common/StatusBadge";
import {
  buildAsignacionDetalle,
  buildInscripcionesDetalle,
  existeAsignacionDocente,
  getAsignacionesPorDocente,
  getGrupoById,
  getGruposCompatiblesConMateria,
  getMateriasPorPlan,
  getMateriaById,
  normalizeAcademicEnrollment,
  normalizeAcademicProfile,
} from "../../utils/academicProfile";
import { crearId } from "../../utils/id";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#6F1D46] dark:border-slate-600 dark:bg-slate-700 dark:text-white";

const labelClass = "text-sm font-semibold text-slate-700 dark:text-slate-200";

const Field = ({ label, error, children }) => (
  <label className="space-y-2">
    <span className={labelClass}>{label}</span>
    {children}
    <FormError message={error} />
  </label>
);

const EmptyAcademicState = ({ title, message }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
    <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
    <p className="mt-1 leading-relaxed">{message}</p>
  </div>
);

const ProfesorAsignado = ({ asignaciones }) => {
  if (asignaciones.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Aún no hay docente asignado para esta materia, grupo y periodo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {asignaciones.map((asignacion) => (
        <div
          key={asignacion.id}
          className="rounded-lg bg-white p-3 text-sm shadow-sm dark:bg-slate-800"
        >
          <p className="font-semibold text-slate-800 dark:text-white">
            {asignacion.profesorNombre}
          </p>
          <p className="text-slate-500 dark:text-slate-400">{asignacion.profesorCorreo}</p>
        </div>
      ))}
    </div>
  );
};

const InscripcionCard = ({ inscripcion, onRemove }) => (
  <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6F1D46] dark:text-pink-200">
          {getPlanLabel(inscripcion.plan)} · {inscripcion.periodo}
        </p>
        <h3 className="mt-1 font-bold text-slate-800 dark:text-white">
          {inscripcion.materiaNombre}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {inscripcion.grupoNombre} · {inscripcion.semestre} · {inscripcion.turno}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(inscripcion.id)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
      >
        <Trash2 size={15} />
        Quitar
      </button>
    </div>

    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/20">
      <div className="mb-2 flex items-center gap-2 font-semibold text-blue-950 dark:text-blue-100">
        <UserCheck size={16} /> Docente asignado
      </div>
      <ProfesorAsignado asignaciones={inscripcion.docentes} />
    </div>
  </article>
);

const AsignacionCard = ({ asignacion, onRemove }) => (
  <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6F1D46] dark:text-pink-200">
          {getPlanLabel(asignacion.plan)} · {asignacion.periodo}
        </p>
        <h3 className="mt-1 font-bold text-slate-800 dark:text-white">
          {asignacion.materiaNombre}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {asignacion.grupoNombre} · {asignacion.semestre} · {asignacion.turno}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <StatusBadge label={asignacion.grupoNombre} variant="success" />
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(asignacion.id)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Trash2 size={15} />
            Quitar
          </button>
        )}
      </div>
    </div>
  </article>
);

const createStudentEnrollmentForm = (profile) => ({
  plan: profile.plan || "2024",
  periodo: profile.periodo || PERIODOS_ACADEMICOS[0],
  materiaId: "",
  grupoId: "",
});

const AlumnoAcademicProfile = ({ user, onSave }) => {
  const { materias, grupos, asignaciones } = useAcademico();
  const { usuarios } = useUsuarios();
  const { success, error } = useToast();

  const [profile, setProfile] = useState(() => normalizeAcademicProfile(user.academicProfile));
  const [form, setForm] = useState(() => createStudentEnrollmentForm(normalizeAcademicProfile(user.academicProfile)));
  const [errors, setErrors] = useState({});

  const materiaSeleccionada = useMemo(
    () => getMateriaById(materias, form.materiaId),
    [form.materiaId, materias]
  );

  const materiasDisponibles = useMemo(
    () => getMateriasPorPlan({ materias, plan: form.plan }),
    [form.plan, materias]
  );

  const gruposCompatibles = useMemo(
    () => getGruposCompatiblesConMateria({ grupos, materia: materiaSeleccionada }),
    [grupos, materiaSeleccionada]
  );

  const inscripcionesDetalle = useMemo(
    () =>
      buildInscripcionesDetalle({
        inscripciones: profile.inscripciones,
        materias,
        grupos,
        asignaciones,
        usuarios,
      }),
    [asignaciones, grupos, materias, profile.inscripciones, usuarios]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "plan") {
        next.materiaId = "";
        next.grupoId = "";
      }

      if (name === "materiaId") {
        next.grupoId = "";
      }

      return next;
    });

    if (errors[name] || errors.duplicado) {
      setErrors((prev) => ({ ...prev, [name]: "", duplicado: "" }));
    }
  };

  const handleAddEnrollment = () => {
    const validationErrors = {
      plan: form.plan ? "" : "Selecciona un plan de estudios",
      periodo: form.periodo ? "" : "Selecciona un periodo",
      materiaId: form.materiaId ? "" : "Selecciona una materia",
      grupoId: form.grupoId ? "" : "Selecciona un grupo compatible",
    };

    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors);
      error("Revisa la materia que deseas agregar");
      return;
    }

    const grupoSeleccionado = getGrupoById(grupos, form.grupoId);
    const nuevaInscripcion = normalizeAcademicEnrollment({
      ...form,
      id: crearId(),
      semestre: grupoSeleccionado?.semestre || materiaSeleccionada?.semestre || "",
      semestreNumero: grupoSeleccionado?.semestreNumero || materiaSeleccionada?.semestreNumero || null,
      carrera: grupoSeleccionado?.carrera || materiaSeleccionada?.carrera || "",
    });
    const key = [
      nuevaInscripcion.plan,
      nuevaInscripcion.periodo,
      nuevaInscripcion.materiaId,
      nuevaInscripcion.grupoId,
    ].join("::");
    const alreadyExists = profile.inscripciones.some(
      (inscripcion) =>
        [inscripcion.plan, inscripcion.periodo, inscripcion.materiaId, inscripcion.grupoId].join("::") === key
    );

    if (alreadyExists) {
      setErrors({ duplicado: "Esa materia ya está agregada para ese grupo y periodo" });
      error("La materia ya existe en tus suscripciones académicas");
      return;
    }

    setProfile((prev) => ({
      ...prev,
      plan: form.plan,
      periodo: form.periodo,
      grupoId: prev.grupoId || form.grupoId,
      materiasIds: [...new Set([...prev.materiasIds, form.materiaId])],
      inscripciones: [...prev.inscripciones, nuevaInscripcion],
    }));
    setForm((prev) => ({ ...prev, materiaId: "", grupoId: "" }));
    setErrors({});
    success("Materia agregada a tus suscripciones académicas");
  };

  const handleRemoveEnrollment = (id) => {
    setProfile((prev) => {
      const inscripciones = prev.inscripciones.filter((inscripcion) => String(inscripcion.id) !== String(id));
      return {
        ...prev,
        inscripciones,
        grupoId: inscripciones[0]?.grupoId || "",
        materiasIds: [...new Set(inscripciones.map((inscripcion) => inscripcion.materiaId).filter(Boolean))],
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (profile.inscripciones.length === 0) {
      setErrors({ inscripciones: "Agrega al menos una materia inscrita" });
      error("Agrega tus materias antes de guardar");
      return;
    }

    const detalles = buildInscripcionesDetalle({
      inscripciones: profile.inscripciones,
      materias,
      grupos,
      asignaciones,
      usuarios,
    });
    const carreras = [...new Set(detalles.map((item) => item.grupo?.carrera || item.materia?.carrera).filter(Boolean))];
    const semestres = [...new Set(detalles.map((item) => item.semestre).filter(Boolean))];
    const gruposSeleccionados = [...new Set(detalles.map((item) => item.grupoNombre).filter(Boolean))];

    const usuarioActualizado = {
      academicProfile: profile,
      carrera: carreras[0] || user.carrera,
      semestre: semestres.length === 1 ? semestres[0] : "Materias mixtas",
      grupo: gruposSeleccionados.length === 1 ? gruposSeleccionados[0] : `${gruposSeleccionados.length} grupos`,
    };

    onSave(usuarioActualizado);
    success("Perfil académico actualizado correctamente");
  };

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-6`}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6F1D46] dark:text-pink-200">
          Alumno
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
          Suscripciones académicas por materia
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Agrega cada materia que cursas en este periodo. Puedes elegir materias de distintos semestres y grupos.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Plan" error={errors.plan}>
            <select name="plan" value={form.plan} onChange={handleChange} className={inputClass}>
              {PLANES_ESTUDIO.map((plan) => (
                <option key={plan} value={plan}>
                  {getPlanLabel(plan)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Materia" error={errors.materiaId}>
            <select
              name="materiaId"
              value={form.materiaId}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Selecciona una materia</option>
              {materiasDisponibles.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre} · {materia.semestre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Grupo" error={errors.grupoId}>
            <select
              name="grupoId"
              value={form.grupoId}
              onChange={handleChange}
              className={inputClass}
              disabled={!materiaSeleccionada}
            >
              <option value="">
                {materiaSeleccionada ? "Selecciona un grupo" : "Primero selecciona materia"}
              </option>
              {gruposCompatibles.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre} · {grupo.semestre} · {grupo.turno}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Periodo" error={errors.periodo}>
            <select name="periodo" value={form.periodo} onChange={handleChange} className={inputClass}>
              {PERIODOS_ACADEMICOS.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {materiaSeleccionada && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-100">
            <p className="font-semibold">Semestre detectado: {materiaSeleccionada.semestre}</p>
            <p className="mt-1">Sólo aparecen grupos compatibles con esa materia.</p>
          </div>
        )}

        <FormError message={errors.duplicado || errors.inscripciones} />

        <button
          type="button"
          onClick={handleAddEnrollment}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#6F1D46] px-5 py-3 font-semibold text-[#6F1D46] transition hover:bg-[#6F1D46] hover:text-white dark:border-pink-300 dark:text-pink-200 sm:w-auto"
        >
          <Plus size={18} />
          Agregar materia
        </button>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Materias inscritas</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Cada elemento funciona como una suscripción académica. Puedes quitar materias dadas de baja.
          </p>
        </div>

        {inscripcionesDetalle.length === 0 ? (
          <EmptyAcademicState
            title="Aún no has agregado materias"
            message="Agrega las materias que cursas, incluso si pertenecen a grupos o semestres distintos."
          />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {inscripcionesDetalle.map((inscripcion) => (
              <InscripcionCard
                key={inscripcion.id}
                inscripcion={inscripcion}
                onRemove={handleRemoveEnrollment}
              />
            ))}
          </div>
        )}
      </section>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-5 py-3 font-semibold text-white transition hover:opacity-90 sm:w-auto"
      >
        <School size={18} />
        Guardar perfil académico
      </button>
    </form>
  );
};

const DocenteAcademicProfile = ({ user }) => {
  const { materias, grupos, asignaciones, agregarAsignacion, eliminarAsignacion } = useAcademico();
  const { usuarios } = useUsuarios();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    plan: "2024",
    materiaId: "",
    grupoId: "",
    periodo: PERIODOS_ACADEMICOS[0],
  });
  const [errors, setErrors] = useState({});

  const materiasAsignables = useMemo(
    () => getMateriasPorPlan({ materias, plan: form.plan }),
    [form.plan, materias]
  );

  const materiaSeleccionada = useMemo(
    () => getMateriaById(materias, form.materiaId),
    [form.materiaId, materias]
  );

  const gruposCompatibles = useMemo(
    () => getGruposCompatiblesConMateria({ grupos, materia: materiaSeleccionada }),
    [grupos, materiaSeleccionada]
  );

  const misAsignaciones = useMemo(
    () =>
      getAsignacionesPorDocente({ asignaciones, docenteId: user.id })
        .map((asignacion) => buildAsignacionDetalle({ asignacion, materias, grupos, usuarios }))
        .sort((a, b) => String(b.periodo).localeCompare(String(a.periodo))),
    [asignaciones, grupos, materias, user.id, usuarios]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "plan") {
        next.materiaId = "";
        next.grupoId = "";
      }

      if (name === "materiaId") {
        next.grupoId = "";
      }

      return next;
    });

    if (errors[name] || errors.compatibilidad) {
      setErrors((prev) => ({ ...prev, [name]: "", compatibilidad: "" }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const grupoSeleccionado = getGrupoById(grupos, form.grupoId);
    const validationErrors = {
      plan: form.plan ? "" : "Selecciona un plan",
      materiaId: form.materiaId ? "" : "Selecciona una materia",
      grupoId: form.grupoId ? "" : "Selecciona un grupo compatible",
      periodo: form.periodo ? "" : "Selecciona un periodo",
      compatibilidad:
        materiaSeleccionada && grupoSeleccionado &&
        Number(materiaSeleccionada.semestreNumero) !== Number(grupoSeleccionado.semestreNumero)
          ? "El grupo no corresponde al semestre de la materia"
          : "",
    };

    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors);
      error("Revisa tu asignación académica");
      return;
    }

    const asignacionExiste = existeAsignacionDocente({
      asignaciones,
      profesorId: user.id,
      materiaId: form.materiaId,
      grupoId: form.grupoId,
      plan: form.plan,
      periodo: form.periodo,
    });

    if (asignacionExiste) {
      error("Ya tienes registrada esa materia y grupo en el periodo seleccionado");
      return;
    }

    agregarAsignacion({
      ...form,
      profesorId: user.id,
    });
    setForm({ plan: form.plan, materiaId: "", grupoId: "", periodo: form.periodo });
    setErrors({});
    success("Materia asignada a tu perfil docente");
  };

  const handleRemoveAssignment = (id) => {
    const confirmed = window.confirm(
      "¿Deseas quitar esta materia de tu perfil docente? Si ya no la impartes, los alumnos dejarán de verla como asignación activa."
    );

    if (!confirmed) return;

    eliminarAsignacion(id);
    success("Asignación docente eliminada");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={handleSubmit} className={`${cardClass} space-y-5`}>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6F1D46] dark:text-pink-200">
            Docente
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
            Registrar materia impartida
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Selecciona el plan, materia, grupo y periodo. Si dejas de impartir una materia, puedes quitarla de tu lista.
          </p>
        </div>

        <Field label="Plan de estudios" error={errors.plan}>
          <select name="plan" value={form.plan} onChange={handleChange} className={inputClass}>
            {PLANES_ESTUDIO.map((plan) => (
              <option key={plan} value={plan}>
                {getPlanLabel(plan)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Materia" error={errors.materiaId}>
          <select
            name="materiaId"
            value={form.materiaId}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Selecciona una materia</option>
            {materiasAsignables.map((materia) => (
              <option key={materia.id} value={materia.id}>
                {materia.nombre} · {materia.semestre} · {materia.tipo || "Obligatoria"}
              </option>
            ))}
          </select>
        </Field>

        {materiaSeleccionada && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-100">
            <p className="font-semibold">Semestre detectado: {materiaSeleccionada.semestre}</p>
            <p className="mt-1">Sólo se muestran grupos compatibles con esa materia.</p>
          </div>
        )}

        <Field label="Grupo" error={errors.grupoId}>
          <select
            name="grupoId"
            value={form.grupoId}
            onChange={handleChange}
            className={inputClass}
            disabled={!materiaSeleccionada}
          >
            <option value="">
              {materiaSeleccionada ? "Selecciona un grupo" : "Primero selecciona una materia"}
            </option>
            {gruposCompatibles.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre} · {grupo.semestre} · {grupo.turno}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Periodo" error={errors.periodo}>
          <select name="periodo" value={form.periodo} onChange={handleChange} className={inputClass}>
            {PERIODOS_ACADEMICOS.map((periodo) => (
              <option key={periodo} value={periodo}>
                {periodo}
              </option>
            ))}
          </select>
        </Field>

        <FormError message={errors.compatibilidad} />

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-5 py-3 font-semibold text-white transition hover:opacity-90 sm:w-auto"
        >
          <Layers3 size={18} />
          Registrar en mi perfil docente
        </button>
      </form>

      <section className={`${cardClass} space-y-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mis materias y grupos</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Estas asignaciones serán la base para publicar noticias, eventos y documentos dirigidos a tus grupos.
            </p>
          </div>
          <Link
            to={ROUTES.DOCENTE_PUBLICACIONES}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ClipboardList size={16} />
            Publicar
          </Link>
        </div>

        {misAsignaciones.length === 0 ? (
          <EmptyAcademicState
            title="Aún no tienes materias asignadas"
            message="Registra una materia impartida o solicita al administrador que te asigne una desde el módulo académico."
          />
        ) : (
          <div className="space-y-3">
            {misAsignaciones.map((asignacion) => (
              <AsignacionCard
                key={asignacion.id}
                asignacion={asignacion}
                onRemove={handleRemoveAssignment}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const AcademicProfileSection = ({ user, onSaveAcademicProfile }) => {
  const role = normalizeRole(user?.rol);

  if (role === ROLES.ALUMNO) {
    return <AlumnoAcademicProfile user={user} onSave={onSaveAcademicProfile} />;
  }

  if (role === ROLES.DOCENTE) {
    return <DocenteAcademicProfile user={user} />;
  }

  if (role === ROLES.ADMIN) {
    return null;
  }

  return (
    <section className={cardClass}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <GraduationCap size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Perfil académico</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Este apartado se habilita principalmente para alumnos y docentes. El personal administrativo puede consultar la información desde los módulos correspondientes.
          </p>
        </div>
      </div>
    </section>
  );
};
