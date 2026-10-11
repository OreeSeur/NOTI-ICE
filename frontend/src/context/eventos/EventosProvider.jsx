import { useCallback, useEffect, useMemo, useState } from "react";

import {
  obtenerEventos,
  crearEventoApi,
  editarEventoApi,
  eliminarEventoApi,
} from "../../services/eventosService";
import { EventosContext } from "./EventosContext";

export const EventosProvider = ({ children }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarEventos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerEventos();
      setEventos(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  const agregarEvento = useCallback(async (nuevoEvento, idUsuario) => {
    const creado = await crearEventoApi(nuevoEvento, idUsuario);
    setEventos((prev) => [creado, ...prev]);
    return creado;
  }, []);

  const editarEvento = useCallback(
    async (id, datosActualizados) => {
      const eventoOriginal = eventos.find((ev) => String(ev.id) === String(id));
      await editarEventoApi(id, datosActualizados, eventoOriginal?.idUsuario);
      setEventos((prev) =>
        prev.map((ev) =>
          String(ev.id) === String(id) ? { ...ev, ...datosActualizados } : ev
        )
      );
    },
    [eventos]
  );

  const eliminarEvento = useCallback(async (id) => {
    await eliminarEventoApi(id);
    setEventos((prev) => prev.filter((ev) => String(ev.id) !== String(id)));
  }, []);

  const value = useMemo(
    () => ({
      eventos,
      loading,
      error,
      agregarEvento,
      eliminarEvento,
      editarEvento,
    }),
    [eventos, loading, error, agregarEvento, eliminarEvento, editarEvento]
  );

  return (
    <EventosContext.Provider value={value}>
      {children}
    </EventosContext.Provider>
  );
};
