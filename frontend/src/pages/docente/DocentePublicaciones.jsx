import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, FileText, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ROLES } from "../../constants/roles";
import { ROUTES, buildRoute } from "../../constants/routes";
import { useAuth } from "../../context/auth/useAuth";
import { useNoticias } from "../../context/noticias/useNoticias";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { useEventos } from "../../context/eventos/useEventos";
import { useToast } from "../../context/toast/useToast";
import { getDocumentTitle } from "../../utils/documentTypes";
import {
  getItemAudience,
  getPriorityLabel,
  getPriorityVariant,
} from "../../utils/audience";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-6";

const TIPOS = {
  noticia: { label: "Noticia", plural: "Noticias", icon: Megaphone, variant: "info" },
  evento: { label: "Evento", plural: "Eventos", icon: Calendar, variant: "success" },
  documento: { label: "Documento", plural: "Documentos", icon: FileText, variant: "warning" },
};

const MENSAJES_ELIMINADO = {
  noticia: "Noticia eliminada correctamente",
  evento: "Evento eliminado correctamente",
  documento: "Documento eliminado correctamente",
};

const getTitulo = (item) =>
  item.tipoPublicacion === "documento" ? getDocumentTitle(item) : item.titulo || "Sin título";

const getRutaVer = (item) => {
  if (item.tipoPublicacion === "noticia") return buildRoute(ROUTES.NOTICIA_DETALLE, { id: item.id });
  if (item.tipoPublicacion === "evento") return buildRoute(ROUTES.EVENTO_DETALLE, { id: item.id });
  return buildRoute(ROUTES.DOCUMENTO_DETALLE, { id: item.id });
};

// Editar: las noticias se editan en administración (solo las publica el Administrador);
// eventos y documentos tienen ruta propia para que el docente edite lo suyo.
const getRutaEditar = (item) => {
  if (item.tipoPublicacion === "noticia") return buildRoute(ROUTES.ADMIN_NOTICIAS_EDITAR, { id: item.id });
  if (item.tipoPublicacion === "evento") return buildRoute(ROUTES.EVENTOS_EDITAR, { id: item.id });
  return buildRoute(ROUTES.DOCUMENTOS_EDITAR, { id: item.id });
};

export const DocentePublicaciones = () => {
  const { user, hasRole } = useAuth();
  const { noticias, eliminarNoticia, loading: cargandoNoticias } = useNoticias();
  const { eventos, eliminarEvento, loading: cargandoEventos } = useEventos();
  const { documentos, eliminarDocumento, loading: cargandoDocumentos } = useDocumentos();
  const { success, error } = useToast();

  const [filtro, setFiltro] = useState("todas");
  const [porEliminar, setPorEliminar] = useState(null);

  const esAdmin = hasRole([ROLES.ADMIN]);
  const cargando = cargandoNoticias || cargandoEventos || cargandoDocumentos;

  // "Mías" = las que yo publiqué. El autor viene guardado desde el backend (idUsuario).
  const misPublicaciones = useMemo(() => {
    const esMia = (item) => String(item?.idUsuario ?? "") === String(user?.id ?? "");

    return [
      ...noticias.filter(esMia).map((item) => ({ ...item, tipoPublicacion: "noticia" })),
      ...eventos.filter(esMia).map((item) => ({ ...item, tipoPublicacion: "evento" })),
      ...documentos.filter(esMia).map((item) => ({ ...item, tipoPublicacion: "documento" })),
    ].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
  }, [noticias, eventos, documentos, user?.id]);

  const conteo = useMemo(
    () => ({
      todas: misPublicaciones.length,
      noticia: misPublicaciones.filter((i) => i.tipoPublicacion === "noticia").length,
      evento: misPublicaciones.filter((i) => i.tipoPublicacion === "evento").length,
      documento: misPublicaciones.filter((i) => i.tipoPublicacion === "documento").length,
    }),
    [misPublicaciones]
  );

  const visibles = misPublicaciones.filter(
    (item) => filtro === "todas" || item.tipoPublicacion === filtro
  );

  const filtros = [
    { value: "todas", label: "Todas" },
    ...(esAdmin ? [{ value: "noticia", label: TIPOS.noticia.plural }] : []),
    { value: "evento", label: TIPOS.evento.plural },
    { value: "documento", label: TIPOS.documento.plural },
  ];

  const confirmarEliminacion = async () => {
    if (!porEliminar) return;

    const item = porEliminar;

    try {
      if (item.tipoPublicacion === "evento") await eliminarEvento(item.id);
      else if (item.tipoPublicacion === "documento") await eliminarDocumento(item.id);
      else await eliminarNoticia(item.id);

      success(MENSAJES_ELIMINADO[item.tipoPublicacion]);
    } catch (err) {
      error(err.message || "No se pudo eliminar la publicación");
    } finally {
      setPorEliminar(null);
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Mi contenido"
        title="Mis publicaciones"
        description="Consulta, edita o elimina lo que has publicado. Para publicar algo nuevo entra al módulo correspondiente o usa los accesos de abajo."
      />

      <div className="flex flex-wrap gap-3">
        {esAdmin && (
          <Link
            to={ROUTES.NOTICIAS_NUEVO}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6F1D46] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={16} />
            Nueva noticia
          </Link>
        )}
        <Link
          to={ROUTES.EVENTOS_NUEVO}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6F1D46] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Nuevo evento
        </Link>
        <Link
          to={ROUTES.DOCUMENTOS_NUEVO}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6F1D46] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Nuevo documento
        </Link>
      </div>

      <div className={`${cardClass} space-y-5`}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filtro === f.value
                  ? "bg-[#6F1D46] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              }`}
            >
              {f.label} ({conteo[f.value]})
            </button>
          ))}
        </div>

        {cargando ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Cargando tus publicaciones...</p>
        ) : visibles.length === 0 ? (
          <EmptyState
            title="Aún no tienes publicaciones"
            message="Lo que publiques aparecerá aquí para que puedas editarlo o eliminarlo cuando lo necesites."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {visibles.map((item) => {
              const tipo = TIPOS[item.tipoPublicacion];
              const Icon = tipo.icon;
              const prioridad = getItemAudience(item).prioridad;

              return (
                <article
                  key={`${item.tipoPublicacion}-${item.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-white p-2 text-[#6F1D46] shadow-sm dark:bg-slate-800 dark:text-pink-200">
                      <Icon size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={tipo.label} variant={tipo.variant} />
                        <StatusBadge
                          label={getPriorityLabel(prioridad)}
                          variant={getPriorityVariant(prioridad)}
                        />
                      </div>

                      <h3 className="mt-2 break-words font-bold text-slate-800 dark:text-white">
                        {getTitulo(item)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.fecha || "Sin fecha"}
                        {item.lugar ? ` · ${item.lugar}` : ""}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          to={getRutaVer(item)}
                          className="inline-flex items-center justify-center rounded-lg bg-[#6F1D46] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                        >
                          Ver
                        </Link>
                        <Link
                          to={getRutaEditar(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Pencil size={14} />
                          Editar
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPorEliminar(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-900/30"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(porEliminar)}
        title={`Eliminar ${porEliminar ? TIPOS[porEliminar.tipoPublicacion].label.toLowerCase() : "publicación"}`}
        message={`¿Deseas eliminar "${porEliminar ? getTitulo(porEliminar) : ""}"? Dejará de estar visible para la comunidad y esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={confirmarEliminacion}
        onCancel={() => setPorEliminar(null)}
      />
    </section>
  );
};
