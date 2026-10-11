import { Calendar, FileText, Megaphone, ShieldCheck, Sparkles, Trophy, UserRound, UsersRound } from "lucide-react";

import { ROLES, normalizeRole } from "./roles";
import { ROUTES } from "./routes";

export const ROLE_HOME_COPY = Object.freeze({
  invitado: {
    eyebrow: "Portal académico",
    title: "Bienvenido a NOTI ICE",
    description:
      "Consulta noticias, eventos, documentos y fechas importantes de ESIME desde un solo lugar.",
    ctaLabel: "Ver noticias",
    ctaPath: ROUTES.NOTICIAS,
  },
  [ROLES.ALUMNO]: {
    eyebrow: "Vista alumno",
    title: "Tu espacio académico personalizado",
    description:
      "Revisa noticias relevantes, próximos eventos, documentos útiles y fechas importantes para tu semestre.",
    ctaLabel: "Revisar recomendaciones",
    ctaPath: ROUTES.PERFIL,
  },
  [ROLES.DOCENTE]: {
    eyebrow: "Vista docente",
    title: "Información académica para docentes",
    description:
      "Consulta comunicados institucionales, eventos académicos y documentos de apoyo para tus actividades.",
    ctaLabel: "Ver documentos",
    ctaPath: ROUTES.DOCUMENTOS,
  },
  [ROLES.ADMIN]: {
    eyebrow: "Vista administrador",
    title: "Panel de control del portal",
    description:
      "Supervisa métricas, administra publicaciones y mantén actualizada la comunicación institucional.",
    ctaLabel: "Abrir administración",
    ctaPath: ROUTES.ADMIN,
  },
});

const DEFAULT_QUICK_ACTIONS = [
  {
    title: "Noticias",
    description: "Comunicados recientes",
    icon: Megaphone,
    path: ROUTES.NOTICIAS,
  },
  {
    title: "Calendario",
    description: "Fechas importantes",
    icon: Calendar,
    path: ROUTES.CALENDARIO,
  },
  {
    title: "Documentos",
    description: "Formatos y archivos",
    icon: FileText,
    path: ROUTES.DOCUMENTOS,
  },
  {
    title: "Eventos",
    description: "Actividades próximas",
    icon: Trophy,
    path: ROUTES.EVENTOS,
  },
];

export const ROLE_QUICK_ACTIONS = Object.freeze({
  invitado: DEFAULT_QUICK_ACTIONS,
  [ROLES.ALUMNO]: [
    {
      title: "Para ti",
      description: "Contenido recomendado",
      icon: Sparkles,
      path: ROUTES.PERFIL,
    },
    {
      title: "Calendario",
      description: "Eventos por mes",
      icon: Calendar,
      path: ROUTES.CALENDARIO,
    },
    {
      title: "Documentos",
      description: "Formatos útiles",
      icon: FileText,
      path: ROUTES.DOCUMENTOS,
    },
    {
      title: "Noticias",
      description: "Comunicados activos",
      icon: Megaphone,
      path: ROUTES.NOTICIAS,
    },
  ],
  [ROLES.DOCENTE]: [
    {
      title: "Noticias docentes",
      description: "Comunicados clave",
      icon: Megaphone,
      path: ROUTES.NOTICIAS,
    },
    {
      title: "Eventos académicos",
      description: "Conferencias y ferias",
      icon: Trophy,
      path: ROUTES.EVENTOS,
    },
    {
      title: "Documentos",
      description: "Recursos institucionales",
      icon: FileText,
      path: ROUTES.DOCUMENTOS,
    },
    {
      title: "Perfil",
      description: "Preferencias docentes",
      icon: UserRound,
      path: ROUTES.PERFIL,
    },
  ],
  [ROLES.ADMIN]: [
    {
      title: "Administración",
      description: "Dashboard general",
      icon: ShieldCheck,
      path: ROUTES.ADMIN,
    },
    {
      title: "Usuarios",
      description: "Gestionar accesos",
      icon: UsersRound,
      path: ROUTES.ADMIN_USUARIOS,
    },
    {
      title: "Nueva noticia",
      description: "Publicar comunicado",
      icon: Megaphone,
      path: ROUTES.NOTICIAS_NUEVO,
    },
    {
      title: "Nuevo documento",
      description: "Registrar archivo",
      icon: FileText,
      path: ROUTES.DOCUMENTOS_NUEVO,
    },
  ],
});

export const ROLE_FOCUS_CARDS = Object.freeze({
  invitado: [
    {
      title: "Explora la información pública",
      description: "Consulta noticias, eventos, calendario y documentos sin iniciar sesión.",
      path: ROUTES.NOTICIAS,
      label: "Ver noticias",
    },
  ],
  [ROLES.ALUMNO]: [
    {
      title: "Revisa tus recomendaciones",
      description:
        "El contenido se adapta a tus intereses, carrera y preferencias guardadas en tu perfil.",
      path: ROUTES.PERFIL,
      label: "Configurar intereses",
    },
    {
      title: "No pierdas fechas importantes",
      description: "Consulta el calendario para ubicar eventos creados por la administración.",
      path: ROUTES.CALENDARIO,
      label: "Abrir calendario",
    },
  ],
  [ROLES.DOCENTE]: [
    {
      title: "Material institucional",
      description: "Encuentra documentos, formatos y comunicados relacionados con la actividad académica.",
      path: ROUTES.DOCUMENTOS,
      label: "Ver documentos",
    },
    {
      title: "Eventos académicos",
      description: "Da seguimiento a conferencias, concursos y actividades de interés docente.",
      path: ROUTES.EVENTOS,
      label: "Ver eventos",
    },
  ],
  [ROLES.ADMIN]: [
    {
      title: "Supervisa el portal",
      description: "Accede al dashboard para revisar métricas y actividad reciente.",
      path: ROUTES.ADMIN,
      label: "Ir al dashboard",
    },
    {
      title: "Publica contenido",
      description: "Crea noticias, eventos y documentos para mantener informada a la comunidad.",
      path: ROUTES.NOTICIAS_NUEVO,
      label: "Nueva noticia",
    },
  ],
});

export const ROLE_CONTENT_FILTERS = Object.freeze({
  [ROLES.ALUMNO]: [
    "alumno",
    "alumnos",
    "estudiante",
    "estudiantes",
    "beca",
    "becas",
    "horario",
    "reinscripcion",
    "reinscripción",
    "credencial",
    "servicio social",
    "titulacion",
    "titulación",
  ],
  [ROLES.DOCENTE]: [
    "docente",
    "docentes",
    "profesor",
    "profesores",
    "academico",
    "académico",
    "conferencia",
    "calificaciones",
    "evaluacion",
    "evaluación",
    "grupo",
    "grupos",
  ],
});

export const getExperienceRole = (user) => normalizeRole(user?.rol) || "invitado";

export const getRoleHomeCopy = (user) => {
  const role = getExperienceRole(user);

  return ROLE_HOME_COPY[role] || ROLE_HOME_COPY.invitado;
};

export const getRoleQuickActions = (user) => {
  const role = getExperienceRole(user);

  return ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.invitado;
};

export const getRoleFocusCards = (user) => {
  const role = getExperienceRole(user);

  return ROLE_FOCUS_CARDS[role] || ROLE_FOCUS_CARDS.invitado;
};

export const getRoleContentKeywords = (user) => {
  const role = getExperienceRole(user);

  return ROLE_CONTENT_FILTERS[role] || [];
};
