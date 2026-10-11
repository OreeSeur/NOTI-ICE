import { useCallback, useEffect, useMemo, useState } from "react";

import {
  obtenerDocumentos,
  crearDocumentoApi,
  editarDocumentoApi,
  eliminarDocumentoApi,
} from "../../services/documentosService";
import { DocumentosContext } from "./DocumentosContext";

export const DocumentosProvider = ({ children }) => {
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
    cargarDocumentos();
  }, [cargarDocumentos]);

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
      documentos,
      loading,
      error,
      recargarDocumentos: cargarDocumentos,
      agregarDocumento,
      eliminarDocumento,
      editarDocumento,
    }),
    [documentos, loading, error, cargarDocumentos, agregarDocumento, eliminarDocumento, editarDocumento]
  );

  return (
    <DocumentosContext.Provider value={value}>
      {children}
    </DocumentosContext.Provider>
  );
};
