import { canReceiveItem } from "../utils/audience";
import { getDocumentTitle } from "../utils/documentTypes";
import { normalizeSearchText } from "../utils/search";
import { ROUTES, buildRoute } from "../constants/routes";

// ============================================================================
// Asistente de DEMOSTRACIÓN.
// Responde con reglas simples sobre el contenido ya cargado en el portal
// (noticias, eventos y documentos), y solo con lo dirigido al perfil de quien
// pregunta. No usa inteligencia artificial.
//
// Para conectar el chatbot real (Ollama + Llama 3), solo hay que reemplazar el
// cuerpo de `responderPregunta` por una llamada al backend (POST /api/chatbot);
// el componente ChatWidget no cambia mientras se conserve la forma de la
// respuesta: { texto, enlaces: [{ clave, tipo, titulo, detalle, ruta }] }.
// ============================================================================

export const MENSAJE_BIENVENIDA =
  "Hola, soy el asistente del portal. Puedo ayudarte a encontrar noticias, eventos y documentos publicados para tu perfil.";

export const SUGERENCIAS = [
  "¿Qué noticias hay?",
  "¿Qué eventos vienen?",
  "¿Qué documentos hay?",
];

const MAX_POR_TIPO = 3;

const STOPWORDS = new Set([
  "que", "como", "cual", "cuales", "cuando", "donde", "quien", "quienes", "cuanto",
  "los", "las", "del", "una", "uno", "unos", "unas", "por", "para", "con", "sin",
  "sobre", "entre", "hay", "son", "ser", "est", "esta", "estan", "este", "esto",
  "ese", "eso", "mis", "tus", "sus", "mas", "muy", "pero", "tambien", "quiero",
  "quisiera", "necesito", "dime", "dame", "muestrame", "mostrar", "ver", "puedo",
  "puedes", "dar", "todo", "todos", "todas", "algun", "alguna", "algunos",
  "algunas", "tengo", "tiene", "tienen", "para", "porfavor", "favor", "hola",
  "buenas", "buenos", "dias", "tardes", "noches", "info", "informacion",
]);

const PALABRAS_NOTICIA = ["noticia", "noticias", "comunicado", "comunicados", "aviso", "avisos", "novedad", "novedades"];
const PALABRAS_EVENTO = ["evento", "eventos", "actividad", "actividades", "calendario", "agenda"];
const PALABRAS_DOCUMENTO = ["documento", "documentos", "formato", "formatos", "archivo", "archivos", "descargar", "descarga"];

// Palabras que describen el tipo o el orden, pero no el tema que se busca
const RUIDO_BUSQUEDA = new Set([
  ...PALABRAS_NOTICIA,
  ...PALABRAS_EVENTO,
  ...PALABRAS_DOCUMENTO,
  "nuevo", "nueva", "nuevos", "nuevas", "reciente", "recientes", "ultimo", "ultima",
  "ultimos", "ultimas", "proximo", "proxima", "proximos", "proximas", "vienen",
  "viene", "disponible", "disponibles", "publicado", "publicados", "publicada",
  "publicadas", "lugar", "fecha", "hora", "dime", "cuentame", "existe", "existen",
]);

const palabrasDe = (texto) =>
  normalizeSearchText(texto)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

// Quita la "s" o "es" final para que "inscripciones" encuentre "inscripcion"
const raiz = (palabra) => (palabra.length > 4 ? palabra.replace(/(es|s)$/, "") : palabra);

const contiene = (palabras, lista) => palabras.some((palabra) => lista.includes(palabra));

const fechaHoy = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return "sin fecha";

  const valor = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(valor.getTime())) return String(fecha);

  return valor.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const porFechaDesc = (a, b) => String(b.fecha || "").localeCompare(String(a.fecha || ""));
const porFechaAsc = (a, b) => String(a.fecha || "").localeCompare(String(b.fecha || ""));

// Cuántas de las palabras buscadas aparecen; el título pesa el doble
const puntuar = (textoTitulo, textoCuerpo, terminos) => {
  const titulo = normalizeSearchText(textoTitulo);
  const cuerpo = normalizeSearchText(textoCuerpo);

  return terminos.reduce((total, termino) => {
    if (titulo.includes(termino)) return total + 2;
    if (cuerpo.includes(termino)) return total + 1;
    return total;
  }, 0);
};

const aEnlace = (item, tipo) => {
  if (tipo === "Noticia") {
    return {
      clave: `noticia-${item.id}`,
      tipo,
      titulo: item.titulo || "Sin título",
      detalle: formatearFecha(item.fecha),
      ruta: buildRoute(ROUTES.NOTICIA_DETALLE, { id: item.id }),
    };
  }

  if (tipo === "Evento") {
    return {
      clave: `evento-${item.id}`,
      tipo,
      titulo: item.titulo || "Sin título",
      detalle: [formatearFecha(item.fecha), item.lugar].filter(Boolean).join(" · "),
      ruta: buildRoute(ROUTES.EVENTO_DETALLE, { id: item.id }),
    };
  }

  return {
    clave: `documento-${item.id}`,
    tipo,
    titulo: getDocumentTitle(item),
    detalle: item.tipo || "Documento",
    ruta: buildRoute(ROUTES.DOCUMENTO_DETALLE, { id: item.id }),
  };
};

const respuestaAyuda = () => ({
  texto:
    "Puedo buscar en lo publicado en el portal: noticias, eventos y documentos. Solo te muestro lo dirigido a tu perfil. Prueba con «eventos próximos», «noticias recientes» o el nombre de un tema, como «inscripción» o «reglamento».",
  enlaces: [],
});

const respuestaSinResultados = () => ({
  texto:
    "No encontré información sobre eso en lo publicado para tu perfil. Prueba con otras palabras, o pregúntame por noticias, eventos o documentos.",
  enlaces: [],
});

// Respuesta de la demostración: reglas simples sobre el contenido cargado.
const generarRespuesta = (pregunta, { user, noticias = [], eventos = [], documentos = [] }) => {
  if (!user) {
    return { texto: "Inicia sesión para que pueda mostrarte el contenido de tu perfil.", enlaces: [] };
  }

  const palabras = palabrasDe(pregunta);

  if (palabras.length === 0) {
    return { texto: "Escribe tu pregunta y la busco en el portal.", enlaces: [] };
  }

  const textoNormal = normalizeSearchText(pregunta);

  if (/\bgracias\b/.test(textoNormal)) {
    return { texto: "¡Con gusto! Si necesitas algo más del portal, aquí estoy.", enlaces: [] };
  }

  if (/\b(ayuda|que puedes|que haces|como funcionas|para que sirves|quien eres)\b/.test(textoNormal)) {
    return respuestaAyuda();
  }

  const terminos = [...new Set(
    palabras
      .filter((p) => p.length > 2 && !STOPWORDS.has(p) && !RUIDO_BUSQUEDA.has(p))
      .map(raiz)
  )];

  const pideNoticias = contiene(palabras, PALABRAS_NOTICIA);
  const pideEventos = contiene(palabras, PALABRAS_EVENTO);
  const pideDocumentos = contiene(palabras, PALABRAS_DOCUMENTO);
  const sinTipo = !pideNoticias && !pideEventos && !pideDocumentos;

  // Saludo suelto: sin tipo, sin tema
  if (sinTipo && terminos.length === 0) {
    return {
      texto: "¡Hola! ¿Qué te gustaría consultar: noticias, eventos o documentos?",
      enlaces: [],
    };
  }

  const visibles = {
    Noticia: noticias.filter((item) => canReceiveItem(item, user)),
    Evento: eventos.filter((item) => canReceiveItem(item, user)),
    Documento: documentos.filter((item) => canReceiveItem(item, user)),
  };

  const tiposConsultados = [
    ...(pideNoticias || sinTipo ? ["Noticia"] : []),
    ...(pideEventos || sinTipo ? ["Evento"] : []),
    ...(pideDocumentos || sinTipo ? ["Documento"] : []),
  ];

  const hoy = fechaHoy();
  const resultados = [];

  tiposConsultados.forEach((tipo) => {
    let lista = visibles[tipo];

    if (terminos.length > 0) {
      lista = lista
        .map((item) => ({
          item,
          puntos: puntuar(
            tipo === "Documento" ? getDocumentTitle(item) : item.titulo,
            [item.descripcion, item.lugar, item.tipo, item.categoria].filter(Boolean).join(" "),
            terminos
          ),
        }))
        .filter(({ puntos }) => puntos > 0)
        .sort((a, b) => b.puntos - a.puntos)
        .map(({ item }) => item);
    } else if (tipo === "Evento") {
      lista = [...lista].filter((item) => !item.fecha || item.fecha >= hoy).sort(porFechaAsc);
    } else {
      lista = [...lista].sort(porFechaDesc);
    }

    lista.slice(0, MAX_POR_TIPO).forEach((item) => resultados.push({ item, tipo }));
  });

  if (resultados.length === 0) {
    if (terminos.length === 0 && pideEventos) {
      return { texto: "No hay eventos próximos publicados para tu perfil por ahora.", enlaces: [] };
    }

    return respuestaSinResultados();
  }

  const enlaces = resultados.map(({ item, tipo }) => aEnlace(item, tipo));
  const primero = resultados[0];

  // Pregunta puntual sobre un evento: se responde directo
  if (primero.tipo === "Evento" && terminos.length > 0) {
    if (/\b(donde|lugar|sede)\b/.test(textoNormal) && primero.item.lugar) {
      return {
        texto: `«${primero.item.titulo}» es en ${primero.item.lugar}, el ${formatearFecha(primero.item.fecha)}.`,
        enlaces: enlaces.slice(0, 1),
      };
    }

    if (/\b(cuando|fecha|dia)\b/.test(textoNormal)) {
      return {
        texto: `«${primero.item.titulo}» es el ${formatearFecha(primero.item.fecha)}${primero.item.lugar ? `, en ${primero.item.lugar}` : ""}.`,
        enlaces: enlaces.slice(0, 1),
      };
    }
  }

  const nombres = tiposConsultados.map((tipo) => tipo.toLowerCase() + "s");
  const cabecera =
    terminos.length > 0
      ? "Esto es lo que encontré sobre eso, dirigido a tu perfil:"
      : pideEventos && !pideNoticias && !pideDocumentos
        ? "Estos son los próximos eventos para tu perfil:"
        : `Esto es lo más reciente en ${nombres.join(", ")} para tu perfil:`;

  return { texto: cabecera, enlaces };
};

// Punto único de entrada. Es asíncrona a propósito: así, cuando se conecte el
// backend con Ollama, el componente no necesita cambios.
export const responderPregunta = async (pregunta, contexto) =>
  generarRespuesta(pregunta, contexto);
