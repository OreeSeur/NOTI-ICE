import { formatDateLabel, getDateTimestamp } from "./dates";
import { getDocumentTitle } from "./documentTypes";
import {
  canReceiveItem,
  getAudienceSummary,
  getItemAudience,
  getPriorityLabel,
  getPriorityVariant,
} from "./audience";
import { buildAcademicTargetSearchText, getAcademicTargetSummary } from "./academicTarget";

const READ_NOTIFICATIONS_KEY = "notiIce_read_notifications";

const normalizeStorageSegment = (value = "") =>
  String(value || "guest")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_");

export const getNotificationUserKey = (user = null) =>
  `${READ_NOTIFICATIONS_KEY}_${normalizeStorageSegment(user?.id || user?.correo || user?.nombre || "guest")}`;

const getNotificationDate = (item) =>
  item.updatedAt || item.createdAt || item.fecha || item.fechaPublicacion || "";

export const getNotificationId = (item) => `${item.tipo}-${item.id}`;

export const getReadNotificationIds = (user = null) => {
  try {
    return JSON.parse(localStorage.getItem(getNotificationUserKey(user))) || [];
  } catch {
    return [];
  }
};

export const saveReadNotificationIds = (ids, user = null) => {
  localStorage.setItem(getNotificationUserKey(user), JSON.stringify([...new Set(ids)]));
};

export const isNotificationRead = (item, readIds = []) =>
  readIds.includes(getNotificationId(item));

export const isNotificationUnread = (item, readIds = []) =>
  !isNotificationRead(item, readIds);

export const mergeReadNotificationIds = (currentIds, notificationItems) => [
  ...new Set([...currentIds, ...notificationItems.map(getNotificationId)]),
];

export const markNotificationsAsRead = (currentIds, notificationItems) =>
  mergeReadNotificationIds(currentIds, notificationItems);

export const markNotificationAsRead = (currentIds, notificationItem) => [
  ...new Set([...currentIds, getNotificationId(notificationItem)]),
];

export const markNotificationAsUnread = (currentIds, notificationItem) =>
  currentIds.filter((id) => id !== getNotificationId(notificationItem));

export const getNotificationStats = (notificationItems = [], readIds = []) => {
  const unread = notificationItems.filter((item) => isNotificationUnread(item, readIds));

  return {
    total: notificationItems.length,
    unread: unread.length,
    read: notificationItems.length - unread.length,
    urgent: notificationItems.filter((item) => item.prioridad === "urgente").length,
    high: notificationItems.filter((item) => item.prioridad === "alta").length,
  };
};

const buildBaseItem = ({ item, tipo, etiqueta, titulo, descripcion, ruta }) => {
  const fechaNotificacion = getNotificationDate(item);
  const audiencia = getItemAudience(item);

  const academicTarget = item.academicTarget || null;

  return {
    id: item.id,
    titulo,
    descripcion,
    tipo,
    etiqueta,
    fecha: fechaNotificacion,
    fechaLabel: formatDateLabel(fechaNotificacion),
    ruta,
    orden: getDateTimestamp(fechaNotificacion),
    audiencia: getAudienceSummary(audiencia),
    prioridad: audiencia.prioridad,
    prioridadLabel: getPriorityLabel(audiencia.prioridad),
    prioridadVariant: getPriorityVariant(audiencia.prioridad),
    academicTarget,
    academicSummary: academicTarget ? getAcademicTargetSummary(academicTarget) : null,
    academicSearchText: academicTarget ? buildAcademicTargetSearchText(academicTarget) : "",
  };
};

export const buildNotificationItems = ({
  noticias = [],
  eventos = [],
  documentos = [],
  user = null,
}) => {
  const noticiaItems = noticias.filter((noticia) => canReceiveItem(noticia, user)).map((noticia) =>
    buildBaseItem({
      item: noticia,
      tipo: "noticia",
      etiqueta: "Noticia",
      titulo: noticia.titulo ?? "Noticia sin título",
      descripcion: noticia.descripcion ?? "",
      ruta: `/noticias/${noticia.id}`,
    })
  );

  const eventoItems = eventos.filter((evento) => canReceiveItem(evento, user)).map((evento) =>
    buildBaseItem({
      item: evento,
      tipo: "evento",
      etiqueta: "Evento",
      titulo: evento.titulo ?? "Evento sin título",
      descripcion: evento.lugar ?? evento.descripcion ?? "",
      ruta: `/eventos/${evento.id}`,
    })
  );

  const documentoItems = documentos
    .filter((documento) => canReceiveItem(documento, user))
    .map((documento) =>
      buildBaseItem({
        item: documento,
        tipo: "documento",
        etiqueta: "Documento",
        titulo: getDocumentTitle(documento),
        descripcion: documento.tipo ?? documento.descripcion ?? "",
        ruta: `/documentos/${documento.id}`,
      })
    );

  return [...noticiaItems, ...eventoItems, ...documentoItems]
    .filter((item) => item.id !== undefined && item.id !== null)
    .sort((a, b) => b.orden - a.orden);
};
