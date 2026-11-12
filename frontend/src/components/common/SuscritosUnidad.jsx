import { useState } from "react";
import { Users } from "lucide-react";

import { obtenerSuscritosUnidad } from "../../services/ofertaAcademicaService";

const fecha = (valor) => (valor ? new Date(valor).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "");
const AVISO = "Alumnos que agregaron esta materia a su perfil; no es una inscripción oficial.";

// Listado nominal de alumnos suscritos a una unidad del horario. Se carga al abrirlo.
// La API decide quién puede verlo (Administrador o Docente aprobado en esa unidad).
export const SuscritosUnidad = ({ idUnidadOferta }) => {
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState({ cargando: false, datos: null, error: "" });

  const alternar = async () => {
    const abrir = !abierto;
    setAbierto(abrir);
    if (!abrir || estado.datos || estado.cargando) return;
    setEstado({ cargando: true, datos: null, error: "" });
    try {
      const datos = await obtenerSuscritosUnidad(idUnidadOferta);
      setEstado({ cargando: false, datos, error: "" });
    } catch (err) {
      setEstado({ cargando: false, datos: null, error: err?.message || "No se pudo consultar el listado." });
    }
  };

  const alumnos = Array.isArray(estado.datos?.alumnos) ? estado.datos.alumnos : [];
  const total = estado.datos?.total ?? alumnos.length;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-500 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Users size={16} />
        {abierto ? "Ocultar alumnos suscritos" : "Ver alumnos suscritos"}
      </button>

      {abierto && (
        <div className="mt-2 rounded-xl border border-slate-200 p-3 dark:border-slate-600">
          <p className="text-xs text-amber-800 dark:text-amber-200">{estado.datos?.aviso || AVISO}</p>
          {estado.cargando && <p className="mt-2 text-sm text-slate-500" role="status">Cargando…</p>}
          {estado.error && <p className="mt-2 text-sm text-red-600" role="alert">{estado.error}</p>}
          {estado.datos && alumnos.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">Ningún alumno ha agregado esta materia.</p>
          )}
          {alumnos.length > 0 && (
            <>
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {total} alumno{total === 1 ? "" : "s"}
                {total > alumnos.length ? ` (se muestran ${alumnos.length})` : ""}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm text-slate-700 dark:text-slate-200">
                  <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-1 pr-3">Nombre</th>
                      <th className="py-1 pr-3">Carrera</th>
                      <th className="py-1 pr-3">Semestre</th>
                      <th className="py-1">Agregada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((a, i) => (
                      <tr key={`${a.nombre}-${i}`} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="py-1 pr-3">{a.nombre}</td>
                        <td className="py-1 pr-3">{a.carrera || "—"}</td>
                        <td className="py-1 pr-3">{a.semestre ?? "—"}</td>
                        <td className="py-1">{fecha(a.fechaSuscripcion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
