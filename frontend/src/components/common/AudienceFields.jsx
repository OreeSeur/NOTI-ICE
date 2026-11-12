import { useEffect, useMemo, useState } from "react";
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
import { obtenerGruposOferta, obtenerPeriodosOferta } from "../../services/ofertaAcademicaService";

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

const lista = (valor) => (Array.isArray(valor) ? valor : []);

const alternarId = (ids, id, marcado) =>
  marcado ? [...new Set([...ids, id])] : ids.filter((actual) => actual !== id);

// Lista de casillas por id (grupos de horario o academias), con filtro de texto opcional.
const SeleccionIds = ({ titulo, descripcion, campo, seleccion, opciones, vacio, error, filtrable, onChange }) => {
  const [filtro, setFiltro] = useState("");
  const visibles = filtrable && filtro.trim()
    ? opciones.filter((o) => o.etiqueta.toLowerCase().includes(filtro.trim().toLowerCase()))
    : opciones;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white">
        {titulo}
        {seleccion.length > 0 && (
          <span className="ml-2 text-xs font-normal text-slate-500">({seleccion.length} seleccionado{seleccion.length === 1 ? "" : "s"})</span>
        )}
      </h4>
      <p className="mb-3 text-xs text-slate-500">{descripcion}</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!error && opciones.length === 0 && <p className="text-sm text-slate-500">{vacio}</p>}
      {filtrable && opciones.length > 8 && (
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar…"
          aria-label={`Filtrar ${titulo.toLowerCase()}`}
          className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      )}
      <div className="grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">
        {visibles.map((o) => (
          <label key={o.id} className="flex items-center gap-2 text-sm dark:text-slate-200">
            <input
              type="checkbox"
              checked={seleccion.includes(o.id)}
              onChange={(e) => onChange(campo, alternarId(seleccion, o.id, e.target.checked))}
              className="h-4 w-4 accent-[#6F1D46]"
            />
            <span>{o.etiqueta}{o.detalle && <span className="text-xs text-slate-500"> · {o.detalle}</span>}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const AudienceFields = ({ audiencia, onChange }) => {
  const normalizedAudience = normalizeAudience(audiencia);
  const { user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [errorMaterias, setErrorMaterias] = useState("");
  const [gruposAdmin, setGruposAdmin] = useState([]);
  const [academiasAdmin, setAcademiasAdmin] = useState([]);
  const [errorCatalogos, setErrorCatalogos] = useState("");
  const rol = normalizeRole(user?.rol);
  const esAdmin = rol === ROLES.ADMIN;
  const puedeElegirMaterias = [ROLES.ADMIN, ROLES.DOCENTE].includes(rol);

  // Materias de los horarios con asignación aprobada (Docente: las suyas; Administrador: todas).
  useEffect(() => {
    if (isMockDataSource() || !puedeElegirMaterias) return;
    let vivo = true;
    obtenerDestinosPublicacion()
      .then((datos) => { if (vivo) setMaterias(Array.isArray(datos) ? datos : []); })
      .catch(() => { if (vivo) setErrorMaterias("No se pudieron consultar tus materias aprobadas."); });
    return () => { vivo = false; };
  }, [puedeElegirMaterias, user?.id]);

  // Administrador: todos los grupos del periodo activo más reciente y todas las academias activas.
  // El Docente solo puede elegir los grupos y academias de sus materias aprobadas (ver abajo).
  useEffect(() => {
    if (isMockDataSource() || !esAdmin) return;
    let vivo = true;
    Promise.all([
      obtenerPeriodosOferta().then((periodos) => {
        const periodo = lista(periodos)[0]?.clave;
        return periodo ? obtenerGruposOferta({ periodo }) : [];
      }),
      get("/academias"),
    ])
      .then(([grupos, academias]) => {
        if (!vivo) return;
        setGruposAdmin(lista(grupos));
        setAcademiasAdmin(lista(academias));
      })
      .catch(() => { if (vivo) setErrorCatalogos("No se pudieron consultar los grupos o las academias."); });
    return () => { vivo = false; };
  }, [esAdmin]);

  const opcionesGrupos = useMemo(() => {
    if (esAdmin) {
      return gruposAdmin.map((g) => ({
        id: g.idGrupoOferta,
        etiqueta: g.codigoGrupo,
        detalle: `plan ${g.plan} · ${g.semestre}° sem.${g.turno ? ` · ${g.turno}` : ""}`,
      }));
    }
    const porId = new Map();
    materias.forEach((m) => {
      if (m.idGrupoOferta && !porId.has(m.idGrupoOferta)) {
        porId.set(m.idGrupoOferta, { id: m.idGrupoOferta, etiqueta: m.codigoGrupo, detalle: `plan ${m.plan}` });
      }
    });
    return [...porId.values()].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  }, [esAdmin, gruposAdmin, materias]);

  const opcionesAcademias = useMemo(() => {
    if (esAdmin) {
      return academiasAdmin.map((a) => ({ id: a.idAcademia, etiqueta: a.nombre }));
    }
    const porId = new Map();
    materias.forEach((m) => {
      if (m.idAcademia && !porId.has(m.idAcademia)) {
        porId.set(m.idAcademia, { id: m.idAcademia, etiqueta: m.academiaNombre || `Academia ${m.idAcademia}` });
      }
    });
    return [...porId.values()].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  }, [esAdmin, academiasAdmin, materias]);

  const errorDestinos = esAdmin ? errorCatalogos : errorMaterias;

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

      {normalizedAudience.teniaGruposAntiguos && (
        <p role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          Esta publicación estaba dirigida a grupos del modelo anterior, que ya no existen; por eso solo la veían la
          administración y su autor. Al guardar se aplicarán los destinatarios que elijas aquí.
        </p>
      )}

      {puedeElegirMaterias && !isMockDataSource() && (
        <>
          <SeleccionIds
            titulo="Grupos de horario (opcional)"
            descripcion="Al elegir un grupo, el contenido lo ven los alumnos que agregaron alguna de sus materias a su perfil, el docente aprobado en alguna de ellas y la administración."
            campo="gruposOferta"
            seleccion={normalizedAudience.gruposOferta}
            opciones={opcionesGrupos}
            vacio={esAdmin ? "No hay grupos en el periodo activo." : "Solo puedes elegir grupos donde tienes una materia aprobada."}
            error={errorDestinos}
            filtrable
            onChange={onChange}
          />
          <SeleccionIds
            titulo="Academias (opcional)"
            descripcion="Opciones de optativas. Al elegir una, el contenido lo ven los alumnos que agregaron una optativa de esa academia, sus docentes aprobados y la administración."
            campo="academias"
            seleccion={normalizedAudience.academias}
            opciones={opcionesAcademias}
            vacio={esAdmin ? "No hay academias activas." : "Solo puedes elegir academias de tus optativas aprobadas."}
            error={errorDestinos}
            onChange={onChange}
          />
        </>
      )}

      {puedeElegirMaterias && !isMockDataSource() && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h4 className="font-semibold text-slate-800 dark:text-white">Materias de los horarios (opcional)</h4>
          <p className="mb-3 text-xs text-slate-500">
            Al elegir una materia, el contenido solo lo ven los alumnos que la agregaron a su perfil, su docente
            aprobado y la administración.
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

      {puedeElegirMaterias && !isMockDataSource() && (
        <p className="mt-3 text-xs text-slate-500">
          Si combinas grupos, academias y materias, basta con pertenecer a uno de ellos. Los alumnos agregan materias
          libremente y NOTI ICE no verifica la inscripción escolar: no uses estos destinatarios para información confidencial.
        </p>
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
