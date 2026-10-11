import { buildRoute, ROUTES } from "../constants/routes";
import { getRoleContentKeywords, getExperienceRole } from "../constants/roleExperience";
import { getDocumentTitle } from "./documentTypes";
import { canReceiveItem } from "./audience";

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getItemText = (item, type) =>
  normalizeText(
    [
      type === "documento" ? getDocumentTitle(item) : item.titulo,
      item.descripcion,
      item.categoria,
      item.tipo,
      item.lugar,
      item.carrera,
      item.semestre,
      item.destinatario,
      item.destinatarios,
      type,
    ]
      .filter(Boolean)
      .join(" ")
  );

const getItemDate = (item) => item.updatedAt || item.createdAt || item.fecha || "";

const buildRoleItem = (item, type) => ({
  id: `${type}-${item.id}`,
  label: type === "noticia" ? "Noticia" : type === "evento" ? "Evento" : "Documento",
  title: type === "documento" ? getDocumentTitle(item) : item.titulo,
  description: item.descripcion || item.lugar || item.tipo || "Sin descripción disponible",
  date: getItemDate(item),
  path:
    type === "noticia"
      ? buildRoute(ROUTES.NOTICIA_DETALLE, { id: item.id })
      : type === "evento"
        ? buildRoute(ROUTES.EVENTO_DETALLE, { id: item.id })
        : buildRoute(ROUTES.DOCUMENTO_DETALLE, { id: item.id }),
});

export const getRoleBasedContent = ({
  noticias = [],
  eventos = [],
  documentos = [],
  user,
  limit = 4,
}) => {
  const role = getExperienceRole(user);
  const keywords = getRoleContentKeywords(user).map(normalizeText);

  if (!user || role === "invitado") return [];

  const allItems = [
    ...noticias.map((item) => ({ item, type: "noticia" })),
    ...eventos.map((item) => ({ item, type: "evento" })),
    ...documentos.map((item) => ({ item, type: "documento" })),
  ];

  const audienceItems = allItems.filter(({ item }) => canReceiveItem(item, user));

  const matchedItems = keywords.length
    ? audienceItems.filter(({ item, type }) => {
        const text = getItemText(item, type);

        return keywords.some((keyword) => text.includes(keyword));
      })
    : audienceItems;

  return matchedItems
    .map(({ item, type }) => buildRoleItem(item, type))
    .filter((item) => item.title)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
};
