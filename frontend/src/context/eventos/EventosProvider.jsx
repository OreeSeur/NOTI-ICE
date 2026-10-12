import { useCallback, useEffect, useMemo, useState } from "react";

import {
  obtenerEventos,
  crearEventoApi,
  editarEventoApi,
  eliminarEventoApi,
} from "../../services/eventosService";
import { EventosContext } from "./EventosContext";
import { useAuth } from "../auth/useAuth";

export const EventosProvider = ({ children }) => {
  const { user } = useAuth();
  // Los resultados del API dependen de la identidad y la audiencia del usuario.
  const claveAudiencia = [
    user?.id ?? "anonimo",
    user?.rol ?? "",
    user?.carrera ?? "",
    user?.semestre ?? "",
  ].join("|");
  const [claveCargada, setClaveCargada] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reconsulta al cambiar de usuario, rol, carrera o semestre.
    let activo = true;

    obtenerEventos()
      .then((datos) => {
        if (!activo) return;
        setEventos(datos);
        setError(null);
        setClaveCargada(claveAudiencia);
      })
      .catch((err) => {
        if (!activo) return;
        setEventos([]);
        setError(err.message || "No se pudieron cargar los eventos");
        setClaveCargada(claveAudiencia);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [claveAudiencia]);

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
      eventos: claveCargada === claveAudiencia ? eventos : [],
      loading: loading || claveCargada !== claveAudiencia,
      error,
      agregarEvento,
      eliminarEvento,
      editarEvento,
    }),
    [eventos, loading, claveCargada, claveAudiencia, error, agregarEvento, eliminarEvento, editarEvento]
  );

  return (
    <EventosContext.Provider value={value}>
      {children}
    </EventosContext.Provider>
  );
};
