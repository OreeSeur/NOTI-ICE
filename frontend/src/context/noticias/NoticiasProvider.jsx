import { useCallback, useEffect, useMemo, useState } from "react";

import {
  obtenerNoticias,
  crearNoticiaApi,
  editarNoticiaApi,
  eliminarNoticiaApi,
} from "../../services/noticiasService";
import { NoticiasContext } from "./NoticiasContext";
import { useAuth } from "../auth/useAuth";

export const NoticiasProvider = ({ children }) => {
  const { user } = useAuth();
  // Los resultados del API dependen de la identidad y la audiencia del usuario.
  const claveAudiencia = [
    user?.id ?? "anonimo",
    user?.rol ?? "",
    user?.carrera ?? "",
    user?.semestre ?? "",
  ].join("|");
  const [claveCargada, setClaveCargada] = useState(null);
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
    // Reconsulta al cambiar de usuario, rol, carrera o semestre.
    let activo = true;

    obtenerNoticias()
      .then((datos) => {
        if (!activo) return;
        setNoticias(datos);
        setError(null);
        setClaveCargada(claveAudiencia);
      })
      .catch((err) => {
        if (!activo) return;
        setNoticias([]);
        setError(err.message || "No se pudieron cargar las noticias");
        setClaveCargada(claveAudiencia);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [claveAudiencia]);

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
      noticias: claveCargada === claveAudiencia ? noticias : [],
      loading: loading || claveCargada !== claveAudiencia,
      error,
      recargarNoticias: cargarNoticias,
      agregarNoticia,
      eliminarNoticia,
      editarNoticia,
    }),
    [noticias, loading, claveCargada, claveAudiencia, error, cargarNoticias, agregarNoticia, eliminarNoticia, editarNoticia]
  );

  return (
    <NoticiasContext.Provider value={value}>
      {children}
    </NoticiasContext.Provider>
  );
};
