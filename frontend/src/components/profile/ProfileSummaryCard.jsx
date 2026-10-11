import { BadgeCheck, BookOpen, GraduationCap, Mail, School, User, Users } from "lucide-react";

import { getPlanLabel } from "../../constants/academic";
import { getRoleLabel } from "../../constants/roles";
import { useAcademico } from "../../context/academico/useAcademico";
import { getAcademicProfileOverview, normalizeAcademicProfile } from "../../utils/academicProfile";

export const ProfileSummaryCard = ({ usuario }) => {
  const { grupos, materias } = useAcademico();
  const inicial = usuario.nombre?.charAt(0)?.toUpperCase() || "U";
  const academicProfile = normalizeAcademicProfile(usuario.academicProfile);
  const overview = getAcademicProfileOverview({ profile: academicProfile, grupos, materias });
  const hasAcademicData = academicProfile.inscripciones.length > 0 || usuario.academicProfile?.plan;

  return (
    <article className="rounded-2xl bg-white p-8 shadow-md dark:bg-slate-800">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#6F1D46] text-5xl font-bold text-white">
          {inicial || <User size={60} />}
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#6F1D46] dark:text-pink-300">
            {getRoleLabel(usuario.rol)}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">
            {usuario.nombre || "Usuario sin nombre"}
          </h2>
          <p className="mt-2 break-all text-slate-500 dark:text-slate-400">
            {usuario.correo || "Sin correo registrado"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/60">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700 dark:text-white">
            <BadgeCheck size={18} /> Boleta
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {usuario.boleta || "No registrada"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/60">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700 dark:text-white">
            <GraduationCap size={18} /> Carrera
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {usuario.carrera || "No registrada"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/60">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700 dark:text-white">
            <BookOpen size={18} /> Semestre
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {hasAcademicData ? overview.semestre : usuario.semestre || "No registrado"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/60">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700 dark:text-white">
            <School size={18} /> Plan
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {hasAcademicData && overview.plan ? getPlanLabel(overview.plan) : "No definido"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/60">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700 dark:text-white">
            <Users size={18} /> Grupo(s)
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {hasAcademicData ? overview.grupo : "No definido"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/60">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700 dark:text-white">
            <Mail size={18} /> Materias
          </div>
          <p className="text-sm capitalize text-slate-500 dark:text-slate-300">
            {hasAcademicData ? `${overview.materias} inscritas` : usuario.estado || "Activo"}
          </p>
        </div>
      </div>
    </article>
  );
};
