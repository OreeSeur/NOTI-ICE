import { useCallback, useEffect, useMemo, useState } from "react";

import {
  obtenerNoticias,
  crearNoticiaApi,
  editarNoticiaApi,
  eliminarNoticiaApi,
} from "../../services/noticiasService";
import { NoticiasContext } from "./NoticiasContext";

export const NoticiasProvider = ({ children }) => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarNoticias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerNoticias();
      setNoticias(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las noticias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarNoticias();
  }, [cargarNoticias]);

  // idUsuario: quién publica la noticia (normalmente el admin logueado)
  const agregarNoticia = useCallback(async (nuevoNoticia, idUsuario) => {
    const creada = await crearNoticiaApi(nuevoNoticia, idUsuario);
    setNoticias((prev) => [creada, ...prev]);
    return creada;
  }, []);

  const editarNoticia = useCallback(
    async (id, datosActualizados) => {
      const noticiaOriginal = noticias.find((n) => String(n.id) === String(id));
      const fechaOriginal = noticiaOriginal?.fecha || new Date().toISOString().substring(0, 10);

      await editarNoticiaApi(id, datosActualizados, fechaOriginal);
      setNoticias((prev) =>
        prev.map((noticia) =>
          String(noticia.id) === String(id)
            ? { ...noticia, ...datosActualizados }
            : noticia
        )
      );
    },
    [noticias]
  );

  const eliminarNoticia = useCallback(async (id) => {
    await eliminarNoticiaApi(id);
    setNoticias((prev) => prev.filter((noticia) => String(noticia.id) !== String(id)));
  }, []);

  const value = useMemo(
    () => ({
      noticias,
      loading,
      error,
      recargarNoticias: cargarNoticias,
      agregarNoticia,
      eliminarNoticia,
      editarNoticia,
    }),
    [noticias, loading, error, cargarNoticias, agregarNoticia, eliminarNoticia, editarNoticia]
  );

  return (
    <NoticiasContext.Provider value={value}>
      {children}
    </NoticiasContext.Provider>
  );
};
