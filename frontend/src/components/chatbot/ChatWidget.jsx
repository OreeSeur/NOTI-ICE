import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, MessageCircle, Send, X } from "lucide-react";

import { useAuth } from "../../context/auth/useAuth";
import { useNoticias } from "../../context/noticias/useNoticias";
import { useEventos } from "../../context/eventos/useEventos";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import {
  MENSAJE_BIENVENIDA,
  SUGERENCIAS,
  responderPregunta,
} from "../../services/chatbotService";

// Pausa breve para que la respuesta no aparezca de golpe (se siente más natural)
const PAUSA_ESCRIBIENDO_MS = 450;

const mensajeInicial = { id: 0, rol: "bot", texto: MENSAJE_BIENVENIDA, enlaces: [] };

// Parte visual y de conversación. Recibe los datos por props para poder
// probarla y reutilizarla sin depender de los contextos.
export const ChatPanel = ({ user, noticias, eventos, documentos, abiertoInicial = false }) => {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [mensajes, setMensajes] = useState([mensajeInicial]);
  const [entrada, setEntrada] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);

  const siguienteId = useRef(1);
  const finMensajes = useRef(null);

  useEffect(() => {
    if (abierto) {
      finMensajes.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [mensajes, escribiendo, abierto]);

  const enviar = async (texto) => {
    const pregunta = texto.trim();

    if (!pregunta || escribiendo) return;

    const idPregunta = siguienteId.current++;

    setMensajes((prev) => [
      ...prev,
      { id: idPregunta, rol: "usuario", texto: pregunta, enlaces: [] },
    ]);
    setEntrada("");
    setEscribiendo(true);

    let respuesta;

    try {
      const [resultado] = await Promise.all([
        responderPregunta(pregunta, { user, noticias, eventos, documentos }),
        new Promise((resolver) => setTimeout(resolver, PAUSA_ESCRIBIENDO_MS)),
      ]);

      respuesta = resultado;
    } catch {
      respuesta = {
        texto: "Ocurrió un problema al consultar el portal. Intenta de nuevo en un momento.",
        enlaces: [],
      };
    }

    const idRespuesta = siguienteId.current++;

    setMensajes((prev) => [
      ...prev,
      {
        id: idRespuesta,
        rol: "bot",
        texto: respuesta.texto,
        enlaces: respuesta.enlaces ?? [],
      },
    ]);
    setEscribiendo(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    enviar(entrada);
  };

  return (
    <div className="print:hidden">
      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente del portal"
          onKeyDown={(e) => {
            if (e.key === "Escape") setAbierto(false);
          }}
          className="
            fixed
            bottom-20
            right-4
            z-50
            flex
            h-[30rem]
            max-h-[calc(100vh-6.5rem)]
            w-[calc(100vw-2rem)]
            max-w-sm
            flex-col
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-2xl
            dark:border-slate-700
            dark:bg-slate-800
          "
        >
          <header className="flex items-center gap-3 bg-[#6F1D46] px-4 py-3 text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Bot size={20} aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">Asistente del portal</p>
              <p className="text-xs text-white/80">ESIME Zacatenco</p>
            </div>

            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar el asistente"
              className="rounded-lg p-1.5 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <p className="bg-amber-50 px-4 py-1.5 text-[11px] leading-snug text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Prototipo de demostración: responde con el contenido publicado, sin
            inteligencia artificial todavía.
          </p>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {mensajes.map((mensaje) =>
              mensaje.rol === "usuario" ? (
                <div
                  key={mensaje.id}
                  className="ml-auto max-w-[85%] break-words rounded-2xl rounded-br-md bg-[#6F1D46] px-3 py-2 text-sm text-white"
                >
                  {mensaje.texto}
                </div>
              ) : (
                <div
                  key={mensaje.id}
                  className="max-w-[88%] break-words rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                >
                  <p>{mensaje.texto}</p>

                  {mensaje.enlaces.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {mensaje.enlaces.map((enlace) => (
                        <li key={enlace.clave}>
                          <Link
                            to={enlace.ruta}
                            className="block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs transition hover:border-[#6F1D46] dark:border-slate-600 dark:bg-slate-800 dark:hover:border-pink-200"
                          >
                            <span className="font-semibold text-[#6F1D46] dark:text-pink-200">
                              {enlace.tipo}
                            </span>
                            <span className="mt-0.5 block font-medium text-slate-800 dark:text-slate-100">
                              {enlace.titulo}
                            </span>
                            {enlace.detalle && (
                              <span className="mt-0.5 block text-slate-500 dark:text-slate-400">
                                {enlace.detalle}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            )}

            {escribiendo && (
              <div
                className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-3 dark:bg-slate-700"
                role="status"
                aria-label="El asistente está escribiendo"
              >
                {[0, 150, 300].map((retraso) => (
                  <span
                    key={retraso}
                    className="h-2 w-2 animate-bounce rounded-full bg-slate-400 dark:bg-slate-300"
                    style={{ animationDelay: `${retraso}ms` }}
                  />
                ))}
              </div>
            )}

            <div ref={finMensajes} />
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pb-2">
            {SUGERENCIAS.map((sugerencia) => (
              <button
                key={sugerencia}
                type="button"
                onClick={() => enviar(sugerencia)}
                disabled={escribiendo}
                className="shrink-0 rounded-full border border-[#6F1D46]/40 px-3 py-1 text-xs text-[#6F1D46] transition hover:bg-[#6F1D46]/10 disabled:opacity-50 dark:border-pink-200/40 dark:text-pink-200 dark:hover:bg-pink-200/10"
              >
                {sugerencia}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
          >
            <input
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escribe tu pregunta..."
              aria-label="Escribe tu pregunta"
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#6F1D46] focus:outline-none dark:border-slate-600 dark:text-slate-100"
            />

            <button
              type="submit"
              disabled={escribiendo || !entrada.trim()}
              aria-label="Enviar pregunta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6F1D46] text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label={abierto ? "Cerrar el asistente" : "Abrir el asistente del portal"}
        aria-expanded={abierto}
        className="
          fixed
          bottom-4
          right-4
          z-50
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[#6F1D46]
          text-white
          shadow-lg
          shadow-[#6F1D46]/30
          transition
          hover:scale-105
          focus:outline-none
          focus:ring-4
          focus:ring-[#6F1D46]/30
        "
      >
        {abierto ? <X size={24} aria-hidden="true" /> : <MessageCircle size={26} aria-hidden="true" />}
      </button>
    </div>
  );
};

// Se muestra solo con sesión iniciada y se reinicia al cambiar de persona
export const ChatWidget = () => {
  const { user } = useAuth();
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();

  if (!user) return null;

  return (
    <ChatPanel
      key={user.id}
      user={user}
      noticias={noticias}
      eventos={eventos}
      documentos={documentos}
    />
  );
};
