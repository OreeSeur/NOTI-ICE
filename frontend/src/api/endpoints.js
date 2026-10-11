export const ENDPOINTS = Object.freeze({
  auth: Object.freeze({
    login: "/auth/login",
    register: "/auth/register",
    perfil: "/auth/perfil",
  }),
  usuarios: "/usuarios",
  roles: "/roles",
  categorias: "/categorias",
  academias: "/academias",
  gruposTipos: "/grupostipos",
  materias: "/materias",
  grupos: "/grupos",
  gruposInscribir: "/grupos/inscribir",
  noticias: "/noticias",
  eventos: "/eventos",
  documentos: "/documentos",
  documentosPorNoticia: "/documentos/pornoticia",
  comentarios: "/comentarios",
  comentariosPorNoticia: "/comentarios/pornoticia",
});

export const buildEndpoint = (endpoint, params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

export const withId = (endpoint, id) => `${endpoint}/${id}`;
