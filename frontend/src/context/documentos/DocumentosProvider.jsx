import { useCallback, useEffect, useMemo, useState } from "react";

import {
  obtenerDocumentos,
  crearDocumentoApi,
  editarDocumentoApi,
  eliminarDocumentoApi,
} from "../../services/documentosService";
import { DocumentosContext } from "./DocumentosContext";
import { useAuth } from "../auth/useAuth";

export const DocumentosProvider = ({ children }) => {
  const { user } = useAuth();
  // Los resultados del API dependen de la identidad y la audiencia del usuario.
  const claveAudiencia = [
    user?.id ?? "anonimo",
    user?.rol ?? "",
    user?.carrera ?? "",
    user?.semestre ?? "",
  ].join("|");
  const [claveCargada, setClaveCargada] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silencioso = true: recarga la lista sin mostrar "cargando" (para no parpadear)
  const cargarDocumentos = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    setError(null);
    try {
      const data = await obtenerDocumentos();
      setDocumentos(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los documentos");
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reconsulta al cambiar de usuario, rol, carrera o semestre.
    let activo = true;

    obtenerDocumentos()
      .then((datos) => {
        if (!activo) return;
        setDocumentos(datos);
        setError(null);
        setClaveCargada(claveAudiencia);
      })
      .catch((err) => {
        if (!activo) return;
        setDocumentos([]);
        setError(err.message || "No se pudieron cargar los documentos");
        setClaveCargada(claveAudiencia);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [claveAudiencia]);

  const agregarDocumento = useCallback(async (nuevoDocumento) => {
    const creado = await crearDocumentoApi(nuevoDocumento);
    setDocumentos((prev) => [creado, ...prev]);
    return creado;
  }, []);

  // Después de editar recargamos la lista: si se subió un archivo nuevo,
  // el servidor le asigna una ruta nueva que solo él conoce.
  const editarDocumento = useCallback(
    async (id, datosActualizados) => {
      await editarDocumentoApi(id, datosActualizados);
      await cargarDocumentos({ silencioso: true });
    },
    [cargarDocumentos]
  );

  const eliminarDocumento = useCallback(async (id) => {
    await eliminarDocumentoApi(id);
    setDocumentos((prev) => prev.filter((doc) => String(doc.id) !== String(id)));
  }, []);

  const value = useMemo(
    () => ({
      documentos: claveCargada === claveAudiencia ? documentos : [],
      loading: loading || claveCargada !== claveAudiencia,
      error,
      recargarDocumentos: cargarDocumentos,
      agregarDocumento,
      eliminarDocumento,
      editarDocumento,
    }),
    [documentos, loading, claveCargada, claveAudiencia, error, cargarDocumentos, agregarDocumento, eliminarDocumento, editarDocumento]
  );

  return (
    <DocumentosContext.Provider value={value}>
      {children}
    </DocumentosContext.Provider>
  );
};
