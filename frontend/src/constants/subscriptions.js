export const SUBSCRIPTION_TOPICS = Object.freeze([
  {
    value: "academico",
    label: "Académico",
    description: "Trámites escolares, horarios, reinscripciones y noticias generales.",
    keywords: ["académico", "academico", "horario", "reinscripción", "reinscripciones", "credencial", "escolar", "servicios escolares"],
  },
  {
    value: "becas",
    label: "Becas",
    description: "Convocatorias, apoyos, requisitos y fechas de becas.",
    keywords: ["beca", "becas", "apoyo", "convocatoria"],
  },
  {
    value: "eventos",
    label: "Eventos",
    description: "Conferencias, ferias, concursos, hackatones y actividades institucionales.",
    keywords: ["evento", "eventos", "feria", "conferencia", "conferencias", "concurso", "concursos", "hackathon"],
  },
  {
    value: "documentos",
    label: "Documentos",
    description: "Formatos, reglamentos, calendarios, solicitudes y archivos institucionales.",
    keywords: ["documento", "documentos", "formato", "reglamento", "calendario", "solicitud", "archivo", "pdf"],
  },
  {
    value: "servicio-social",
    label: "Servicio social",
    description: "Ferias, formatos, trámites y seguimiento de servicio social.",
    keywords: ["servicio social", "servicio", "social"],
  },
  {
    value: "titulacion",
    label: "Titulación",
    description: "Solicitudes, requisitos y trámites relacionados con titulación.",
    keywords: ["titulación", "titulacion", "titulo", "título"],
  },
]);

export const DEFAULT_SUBSCRIPTIONS = Object.freeze({
  topics: ["academico", "becas", "eventos", "documentos"],
  notifyNoticias: true,
  notifyEventos: true,
  notifyDocumentos: true,
});

export const getTopicLabel = (topicValue) =>
  SUBSCRIPTION_TOPICS.find((topic) => topic.value === topicValue)?.label || topicValue;

export const normalizeSubscriptions = (subscriptions = {}) => ({
  ...DEFAULT_SUBSCRIPTIONS,
  ...subscriptions,
  topics: Array.isArray(subscriptions.topics)
    ? subscriptions.topics
    : DEFAULT_SUBSCRIPTIONS.topics,
});
