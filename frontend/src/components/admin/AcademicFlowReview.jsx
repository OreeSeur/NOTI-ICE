import { AlertTriangle, CheckCircle2, ClipboardList, GraduationCap, Megaphone, Users } from "lucide-react";

import { ROLES, normalizeRole } from "../../constants/roles";
import { normalizeAcademicProfile } from "../../utils/academicProfile";

const getUserById = (usuarios, id) =>
  usuarios.find((usuario) => String(usuario.id) === String(id));

const getMateriaById = (materias, id) =>
  materias.find((materia) => String(materia.id) === String(id));

const getGrupoById = (grupos, id) =>
  grupos.find((grupo) => String(grupo.id) === String(id));

const getAcademicPublications = ({ noticias = [], eventos = [], documentos = [] }) => [
  ...noticias.map((item) => ({ ...item, tipoContenido: "Noticia" })),
  ...eventos.map((item) => ({ ...item, tipoContenido: "Evento" })),
  ...documentos.map((item) => ({ ...item, tipoContenido: "Documento" })),
].filter((item) => item.academicTarget);

const buildReviewData = ({ usuarios, materias, grupos, asignaciones, noticias, eventos, documentos }) => {
  const docentes = usuarios.filter((usuario) => normalizeRole(usuario.rol) === ROLES.DOCENTE);
  const alumnos = usuarios.filter((usuario) => normalizeRole(usuario.rol) === ROLES.ALUMNO);
  const docentesConAsignacion = new Set(asignaciones.map((asignacion) => String(asignacion.profesorId)));
  const alumnosConInscripciones = alumnos.filter(
    (alumno) => normalizeAcademicProfile(alumno.academicProfile).inscripciones.length > 0
  );
  const publicacionesAcademicas = getAcademicPublications({ noticias, eventos, documentos });

  const asignacionesIncompletas = asignaciones.filter((asignacion) => {
    const docente = getUserById(usuarios, asignacion.profesorId);
    const materia = getMateriaById(materias, asignacion.materiaId);
    const grupo = getGrupoById(grupos, asignacion.grupoId);
    const grupoCompatible =
      materia && grupo
        ? Number(materia.semestreNumero) === Number(grupo.semestreNumero) && materia.carrera === grupo.carrera
        : false;

    return !docente || !materia || !grupo || !grupoCompatible;
  });

  const publicacionesIncompletas = publicacionesAcademicas.filter((item) => {
    const target = item.academicTarget || {};

    return !target.materiaId || !target.grupoId || !target.profesorId || !target.periodo || !target.plan;
  });

  return {
    docentes,
    alumnos,
    docentesConAsignacion,
    alumnosConInscripciones,
    publicacionesAcademicas,
    asignacionesIncompletas,
    publicacionesIncompletas,
  };
};

const ReviewCard = ({ icon: Icon, title, value, description, status = "ok" }) => {
  const isWarning = status === "warning";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start gap-3">
        <span
          className={`rounded-xl p-3 ${
            isWarning
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200"
              : "bg-[#6F1D46]/10 text-[#6F1D46] dark:bg-[#6F1D46]/30 dark:text-pink-100"
          }`}
        >
          <Icon size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
};

const ReviewItem = ({ ok, children }) => (
  <li className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
    {ok ? (
      <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={18} />
    ) : (
      <AlertTriangle className="mt-0.5 shrink-0 text-yellow-600" size={18} />
    )}
    <span>{children}</span>
  </li>
);

export const AcademicFlowReview = ({
  usuarios = [],
  materias = [],
  grupos = [],
  asignaciones = [],
  noticias = [],
  eventos = [],
  documentos = [],
}) => {
  const {
    docentes,
    alumnos,
    docentesConAsignacion,
    alumnosConInscripciones,
    publicacionesAcademicas,
    asignacionesIncompletas,
    publicacionesIncompletas,
  } = buildReviewData({ usuarios, materias, grupos, asignaciones, noticias, eventos, documentos });

  const asignacionesConsistentes = asignacionesIncompletas.length === 0;
  const publicacionesConsistentes = publicacionesIncompletas.length === 0;
  const hayFlujoAcademico =
    asignaciones.length > 0 && alumnosConInscripciones.length > 0 && publicacionesAcademicas.length > 0;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6F1D46] dark:text-pink-100">
            Revisión de flujo académico
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            Seguimiento de asignaciones, suscripciones y publicaciones
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Este panel ayuda a verificar que el circuito académico esté listo: docentes asignados,
            alumnos inscritos por materia y publicaciones con destino académico completo.
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
            hayFlujoAcademico && asignacionesConsistentes && publicacionesConsistentes
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200"
          }`}
        >
          {hayFlujoAcademico && asignacionesConsistentes && publicacionesConsistentes
            ? "Flujo listo"
            : "Requiere revisión"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReviewCard
          icon={GraduationCap}
          title="Docentes con asignación"
          value={`${docentesConAsignacion.size}/${docentes.length}`}
          description="Profesores vinculados a materia, grupo y periodo."
          status={docentesConAsignacion.size > 0 ? "ok" : "warning"}
        />
        <ReviewCard
          icon={Users}
          title="Alumnos con materias"
          value={`${alumnosConInscripciones.length}/${alumnos.length}`}
          description="Alumnos con suscripciones académicas por materia."
          status={alumnosConInscripciones.length > 0 ? "ok" : "warning"}
        />
        <ReviewCard
          icon={Megaphone}
          title="Publicaciones docentes"
          value={publicacionesAcademicas.length}
          description="Noticias, eventos o documentos dirigidos a materia y grupo."
          status={publicacionesAcademicas.length > 0 ? "ok" : "warning"}
        />
        <ReviewCard
          icon={ClipboardList}
          title="Inconsistencias"
          value={asignacionesIncompletas.length + publicacionesIncompletas.length}
          description="Registros que necesitan datos académicos completos."
          status={asignacionesConsistentes && publicacionesConsistentes ? "ok" : "warning"}
        />
      </div>

      <ul className="grid gap-3 lg:grid-cols-2">
        <ReviewItem ok={asignaciones.length > 0}>
          Hay asignaciones docente–materia–grupo registradas para usar en publicaciones.
        </ReviewItem>
        <ReviewItem ok={asignacionesConsistentes}>
          Las asignaciones existentes apuntan a docentes, materias y grupos compatibles.
        </ReviewItem>
        <ReviewItem ok={alumnosConInscripciones.length > 0}>
          Hay alumnos con materias inscritas para recibir contenido académico segmentado.
        </ReviewItem>
        <ReviewItem ok={publicacionesConsistentes}>
          Las publicaciones docentes tienen materia, grupo, profesor, plan y periodo definidos.
        </ReviewItem>
      </ul>
    </section>
  );
};
