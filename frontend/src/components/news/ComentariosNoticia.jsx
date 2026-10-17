import { useEffect, useState } from "react";
import { get, post } from "../../api/apiClient";
import { useAuth } from "../../context/auth/useAuth";

const ComentariosNoticiaContenido = ({ idNoticia }) => {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    get(`/comentarios/porNoticia/${encodeURIComponent(idNoticia)}`)
      .then((data) => { if (vivo) setComentarios(Array.isArray(data) ? data : []); })
      .catch((e) => { if (vivo) setError(e.message || "Error al consultar comentarios."); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, [idNoticia]);

  const enviar = async (e) => {
    e.preventDefault();
    const comentarioTexto = texto.trim();
    if (!user || !comentarioTexto || comentarioTexto.length > 1000) return;
    setEnviando(true); setError("");
    try {
      // El backend determina el autor desde el JWT, no desde este identificador.
      const creado = await post("/comentarios", { idNoticia: Number(idNoticia), comentarioTexto });
      setComentarios((antes) => [...antes, creado]);
      setTexto("");
    } catch (err) { setError(err.message || "No se pudo enviar el comentario."); }
    finally { setEnviando(false); }
  };

  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Comentarios</h2>
    {cargando && <p className="text-sm">Cargando comentarios...</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {!cargando && comentarios.length === 0 && <p className="text-sm text-slate-500">Aún no hay comentarios.</p>}
    <div className="space-y-3">{comentarios.map((c) => <article key={c.idComentario}
      className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900/40">
      <p className="font-semibold text-[#6F1D46] dark:text-pink-200">{c.autorNombre || "Usuario"}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">{c.comentarioTexto}</p>
    </article>)}</div>
    {user ? <form onSubmit={enviar} className="space-y-2">
      <label className="block text-sm font-semibold" htmlFor="nuevo-comentario">Escribir comentario</label>
      <textarea id="nuevo-comentario" value={texto} maxLength={1000} required
        onChange={(e) => setTexto(e.target.value)}
        className="w-full rounded-xl border border-slate-300 p-3 dark:border-slate-600 dark:bg-slate-800" />
      <button disabled={enviando || !texto.trim()}
        className="rounded-xl bg-[#6F1D46] px-4 py-2 font-semibold text-white disabled:opacity-50">
        {enviando ? "Enviando..." : "Publicar comentario"}
      </button>
    </form> : <p className="text-sm text-slate-500">Inicia sesión para comentar.</p>}
  </section>;
};

// Forzar estado de carga nuevo si el usuario navega a otra noticia.
export const ComentariosNoticia = ({ idNoticia }) => (
  <ComentariosNoticiaContenido key={idNoticia} idNoticia={idNoticia} />
);
