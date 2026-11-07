import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { get } from "../../api/apiClient";
import { useAuth } from "../../context/auth/useAuth";
import { isMockDataSource } from "../../config/appConfig";

import { Link } from "react-router-dom";
import { getAudienceSelectOptions, normalizeAudience } from "../../utils/audience";
import { AUDIENCE_ALL_VALUE } from "../../constants/audience";
import { ROLES, normalizeRole } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import { obtenerDestinosPublicacion } from "../../services/solicitudesDocentesService";

const options = getAudienceSelectOptions();

const toggleValue = (currentValues, value) => {
  const values = Array.isArray(currentValues) ? currentValues : [AUDIENCE_ALL_VALUE];

  if (value === AUDIENCE_ALL_VALUE) return [AUDIENCE_ALL_VALUE];

  const withoutAll = values.filter((item) => item !== AUDIENCE_ALL_VALUE);
  const exists = withoutAll.includes(value);
  const nextValues = exists
    ? withoutAll.filter((item) => item !== value)
    : [...withoutAll, value];

  return nextValues.length > 0 ? nextValues : [AUDIENCE_ALL_VALUE];
};

const CheckboxGroup = ({ title, description, values, field, items, onChange }) => (
  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:p-4">
    <div className="mb-3">
      <h4 className="font-semibold text-slate-800 dark:text-white">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>

    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <label
          key={item.value}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <input
            type="checkbox"
            checked={values.includes(item.value)}
            onChange={() => onChange(field, toggleValue(values, item.value))}
            className="h-4 w-4 accent-[#6F1D46]"
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  </div>
);

export const AudienceFields = ({ audiencia, onChange }) => {
  const normalizedAudience = normalizeAudience(audiencia);
  const { user } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [errorGrupos, setErrorGrupos] = useState("");
  const [materias, setMaterias] = useState([]);
  const [errorMaterias, setErrorMaterias] = useState("");
  const puedeElegirMaterias = [ROLES.ADMIN, ROLES.DOCENTE].includes(normalizeRole(user?.rol));

  // Materias de los horarios con asignación aprobada (Docente: las suyas; Administrador: todas).
  useEffect(() => {
    if (isMockDataSource() || !puedeElegirMaterias) return;
    let vivo = true;
    obtenerDestinosPublicacion()
      .then((datos) => { if (vivo) setMaterias(Array.isArray(datos) ? datos : []); })
      .catch(() => { if (vivo) setErrorMaterias("No se pudieron consultar tus materias aprobadas."); });
    return () => { vivo = false; };
  }, [puedeElegirMaterias, user?.id]);

  useEffect(() => {
    if (isMockDataSource()) return;
    let vivo = true;
    get("/grupos")
      .then((datos) => {
        if (!vivo) return;
        const todos = Array.isArray(datos) ? datos : [];
        setGrupos(user?.rol === "Administrador" ? todos : todos.filter(g => g.idUsuario === user?.id));
      })
      .catch(() => { if (vivo) setErrorGrupos("No se pudieron consultar los grupos."); });
    return () => { vivo = false; };
  }, [user?.id, user?.rol]);

  return (
    <section className="rounded-2xl border border-[#6F1D46]/20 bg-[#6F1D46]/5 p-4 dark:border-pink-300/20 dark:bg-pink-300/5 sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl bg-white p-2 text-[#6F1D46] shadow-sm dark:bg-slate-800 dark:text-pink-300">
          <Target size={22} />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Destinatarios y relevancia
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define quién debe recibir este contenido. Estas reglas alimentan recomendaciones y notificaciones personalizadas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CheckboxGroup
          title="Roles destinatarios"
          description="Selecciona el tipo de usuario al que va dirigido."
          field="roles"
          values={normalizedAudience.roles}
          items={options.roles}
          onChange={onChange}
        />

        <CheckboxGroup
          title="Carreras o áreas"
          description="Útil para filtrar alumnos, docentes o áreas administrativas."
          field="carreras"
          values={normalizedAudience.carreras}
          items={options.carreras}
          onChange={onChange}
        />

        <CheckboxGroup
          title="Semestres"
          description="Aplica principalmente para alumnos."
          field="semestres"
          values={normalizedAudience.semestres}
          items={options.semestres}
          onChange={onChange}
        />

        <CheckboxGroup
          title="Categorías / temas"
          description="Se cruza con las preferencias del usuario."
          field="categorias"
          values={normalizedAudience.categorias}
          items={options.categorias}
          onChange={onChange}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <h4 className="font-semibold text-slate-800 dark:text-white">Grupos destinatarios (opcional)</h4>
        <p className="mb-3 text-xs text-slate-500">Sin grupos seleccionados, se aplica la audiencia general. Al elegir uno, el contenido se muestra a los alumnos suscritos a ese grupo, a su docente responsable y a la administración. Cualquier alumno puede suscribirse libremente y NOTI ICE no verifica la inscripción escolar: no lo uses para información confidencial.</p>
        {errorGrupos && <p role="alert" className="text-sm text-red-600">{errorGrupos}</p>}
        <div className="grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">
          {grupos.map((g) => <label key={g.idGrupo} className="flex items-center gap-2 text-sm dark:text-slate-200">
            <input type="checkbox" checked={normalizedAudience.grupos.includes(g.idGrupo)}
              onChange={(e) => onChange("grupos", e.target.checked
                ? [...normalizedAudience.grupos, g.idGrupo]
                : normalizedAudience.grupos.filter(id => id !== g.idGrupo))}
              className="h-4 w-4 accent-[#6F1D46]" />
            {g.materiaNombre} · {g.grupoTipoNombre}
          </label>)}
        </div>
      </div>

      {puedeElegirMaterias && !isMockDataSource() && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h4 className="font-semibold text-slate-800 dark:text-white">Materias de los horarios (opcional)</h4>
          <p className="mb-3 text-xs text-slate-500">
            Al elegir una materia, el contenido solo lo ven los alumnos que la agregaron a su perfil, su docente
            aprobado y la administración. Los alumnos agregan materias libremente y NOTI ICE no verifica la
            inscripción escolar: no lo uses para información confidencial.
          </p>
          {errorMaterias && <p role="alert" className="text-sm text-red-600">{errorMaterias}</p>}
          {!errorMaterias && materias.length === 0 && (
            <p className="text-sm text-slate-500">
              {normalizeRole(user?.rol) === ROLES.DOCENTE
                ? <>No tienes materias aprobadas. Solicítalas en <Link to={ROUTES.DOCENTE_MATERIAS} className="font-semibold text-[#6F1D46] hover:underline dark:text-pink-200">Mis materias</Link>.</>
                : "Todavía no hay materias con docente aprobado."}
            </p>
          )}
          <div className="grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">
            {materias.map((m) => (
              <label key={m.idUnidadOferta} className="flex items-center gap-2 text-sm dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={normalizedAudience.unidadesOferta.includes(m.idUnidadOferta)}
                  onChange={(e) => onChange("unidadesOferta", e.target.checked
                    ? [...normalizedAudience.unidadesOferta, m.idUnidadOferta]
                    : normalizedAudience.unidadesOferta.filter((id) => id !== m.idUnidadOferta))}
                  className="h-4 w-4 accent-[#6F1D46]"
                />
                <span>
                  {m.codigoGrupo} · {m.nombrePublicado}{m.esLaboratorio ? " (lab.)" : ""}
                  <span className="text-xs text-slate-500"> · {m.alumnosSuscritos} alumno{m.alumnosSuscritos === 1 ? "" : "s"}{m.docenteNombre ? ` · ${m.docenteNombre}` : ""}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 max-w-sm">
        <label className="mb-2 block font-medium text-slate-800 dark:text-white">
          Prioridad
        </label>
        <select
          value={normalizedAudience.prioridad}
          onChange={(event) => onChange("prioridad", event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
        >
          {options.prioridades.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
};
