import { get, post, remove } from "../api/apiClient";

// Consulta de solo lectura. No modifica materias ni grupos operativos del portal.
const parametros = (valores) => {
  const query = new URLSearchParams();
  Object.entries(valores).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      query.set(clave, String(valor).trim());
    }
  });
  const cadena = query.toString();
  return cadena ? `?${cadena}` : "";
};

// El controlador pagina hasta 100 registros: recuperar cada pagina sin truncar el catalogo.
export const obtenerMateriasCatalogo = async (plan) => {
  const tamanoPagina = 100;
  const materias = [];
  for (let pagina = 1; pagina <= 100; pagina += 1) {
    const respuesta = await get(`/catalogo-academico/materias${parametros({ plan, pagina, tamanoPagina })}`);
    const resultados = Array.isArray(respuesta?.resultados) ? respuesta.resultados : [];
    materias.push(...resultados);
    const total = Number(respuesta?.total);
    if (resultados.length < tamanoPagina || (Number.isFinite(total) && materias.length >= total)) {
      return materias;
    }
  }
  throw new Error("El catalogo excede el limite de paginacion admitido.");
};

export const obtenerPeriodosOferta = () =>
  get("/oferta-academica/periodos");

export const obtenerGruposOferta = ({ periodo, plan }) =>
  get(`/oferta-academica/grupos${parametros({ periodo, plan })}`);

export const obtenerHorarioGrupo = ({ codigoGrupo, periodo, plan }) =>
  get(`/oferta-academica/grupos/${encodeURIComponent(codigoGrupo)}${parametros({ periodo, plan })}`);

export const buscarUnidadesOferta = ({ periodo, materia, plan }) =>
  get(`/oferta-academica/buscar${parametros({ periodo, materia, plan })}`);

// Suscripciones voluntarias del alumno a unidades publicadas en horarios.
// No se mezclan con los grupos operativos ni se consideran inscripciones certificadas.
export const obtenerMisMateriasOferta = () => get("/oferta-academica/mis-materias");
export const agregarMateriaOferta = (idUnidadOferta) =>
  post("/oferta-academica/mis-materias", { idUnidadOferta });
export const quitarMateriaOferta = (idUnidadOferta) =>
  remove(`/oferta-academica/mis-materias/${encodeURIComponent(idUnidadOferta)}`);
