import { useCallback, useEffect, useMemo, useState } from "react";
import { get, put } from "../../api/apiClient";
import { useAuth } from "../auth/useAuth";
import { LecturasContext } from "./LecturasContext";

export const LecturasProvider = ({ children }) => {
  const { user } = useAuth();
  const [estado, setEstado] = useState({ usuario: null, ids: [], error: "" });

  useEffect(() => {
    let vivo = true;
    if (!user?.id) return;
    const id = user.id;
    get("/notificaciones/leidas")
      .then((data) => {
        if (vivo)
          setEstado({
            usuario: id,
            ids: Array.isArray(data?.ids) ? data.ids : [],
            error: "",
          });
      })
      .catch(() => {
        if (vivo)
          setEstado({
            usuario: id,
            ids: [],
            error: "No se pudo recuperar el estado de las notificaciones.",
          });
      });
    return () => {
      vivo = false;
    };
  }, [user?.id]);

  const readIds = useMemo(
    () => (user?.id && estado.usuario === user.id ? estado.ids : []),
    [user, estado.usuario, estado.ids],
  );
  const guardarLecturas = useCallback(
    async (ids) => {
      if (!user) return;
      const anteriores = readIds;
      const nuevos = [...new Set(ids)];
      setEstado({ usuario: user.id, ids: nuevos, error: "" });
      try {
        await put("/notificaciones/leidas", { ids: nuevos });
      } catch (err) {
        setEstado({
          usuario: user.id,
          ids: anteriores,
          error: "No se pudo guardar el estado de las notificaciones.",
        });
        throw err;
      }
    },
    [user, readIds],
  );

  const value = useMemo(
    () => ({ readIds, guardarLecturas, errorLecturas: estado.error }),
    [readIds, guardarLecturas, estado.error],
  );
  return (
    <LecturasContext.Provider value={value}>
      {children}
    </LecturasContext.Provider>
  );
};
