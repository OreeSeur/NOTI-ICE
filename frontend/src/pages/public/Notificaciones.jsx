import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  FileText,
  Megaphone,
  Search,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";

import { EmptyState } from "../../components/common/EmptyState";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useAuth } from "../../context/auth/useAuth";
import { useNoticias } from "../../context/noticias/useNoticias";
import { useEventos } from "../../context/eventos/useEventos";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { PRIORITY_OPTIONS } from "../../constants/audience";
import { normalizeSearchText } from "../../utils/search";
import {
  buildNotificationItems,
  getNotificationId,
  getNotificationStats,
  getReadNotificationIds,
  isNotificationUnread,
  markNotificationAsRead,
  markNotificationAsUnread,
  markNotificationsAsRead,
  saveReadNotificationIds,
} from "../../utils/notifications";

const TYPE_FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "noticia", label: "Noticias" },
  { value: "evento", label: "Eventos" },
  { value: "documento", label: "Documentos" },
];

const STATUS_FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "no-leidas", label: "No leídas" },
  { value: "leidas", label: "Leídas" },
];

const TYPE_ICONS = {
  noticia: Megaphone,
  evento: Trophy,
  documento: FileText,
};

const TYPE_VARIANTS = {
  noticia: "primary",
  evento: "info",
  documento: "success",
};

const priorityFilters = [
  { value: "todas", label: "Todas" },
  ...PRIORITY_OPTIONS,
];

const filterButtonClass = (isActive) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-[#6F1D46] text-white shadow-sm"
      : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
  }`;

export const Notificaciones = () => {
  const { user } = useAuth();
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [readIds, setReadIds] = useState(() => getReadNotificationIds(user));

  const notificationItems = useMemo(
    () => buildNotificationItems({ noticias, eventos, documentos, user }),
    [noticias, eventos, documentos, user]
  );

  const stats = getNotificationStats(notificationItems, readIds);

  const filteredNotifications = useMemo(() => {
    const query = normalizeSearchText(search);

    return notificationItems.filter((item) => {
      const matchesType = typeFilter === "todas" || item.tipo === typeFilter;
      const unread = isNotificationUnread(item, readIds);
      const matchesStatus =
        statusFilter === "todas" ||
        (statusFilter === "no-leidas" && unread) ||
        (statusFilter === "leidas" && !unread);
      const matchesPriority =
        priorityFilter === "todas" || item.prioridad === priorityFilter;
      const matchesQuery =
        !query ||
        normalizeSearchText(
          `${item.titulo} ${item.descripcion} ${item.etiqueta} ${item.audiencia?.roles} ${item.audiencia?.categorias} ${item.academicSearchText || ""}`
        ).includes(query);

      return matchesType && matchesStatus && matchesPriority && matchesQuery;
    });
  }, [notificationItems, priorityFilter, readIds, search, statusFilter, typeFilter]);

  const updateReadIds = (ids) => {
    setReadIds(ids);
    saveReadNotificationIds(ids, user);
  };

  const handleMarkAllRead = () => {
    updateReadIds(markNotificationsAsRead(readIds, notificationItems));
  };

  const handleToggleRead = (notification) => {
    const updatedIds = isNotificationUnread(notification, readIds)
      ? markNotificationAsRead(readIds, notification)
      : markNotificationAsUnread(readIds, notification);

    updateReadIds(updatedIds);
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("todas");
    setStatusFilter("todas");
    setPriorityFilter("todas");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#6F1D46]/10 px-3 py-1 text-sm font-semibold text-[#6F1D46] dark:bg-pink-900/30 dark:text-pink-200">
              <Bell size={16} />
              Centro de notificaciones
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Notificaciones dirigidas a tu perfil
            </h1>

            <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">
              Consulta noticias, eventos y documentos relevantes según tu rol,
              carrera, semestre y preferencias.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={stats.unread === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <CheckCheck size={18} />
            Marcar todas como leídas
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/60">
            <p className="text-sm text-slate-500 dark:text-slate-300">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-200">No leídas</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-100">{stats.unread}</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-600 dark:text-green-200">Leídas</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-100">{stats.read}</p>
          </div>
          <div className="rounded-xl bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-100">Alta/Urgente</p>
            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-50">
              {stats.high + stats.urgent}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <SlidersHorizontal size={18} />
          <h2 className="font-bold">Filtros</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por título, descripción, tipo o categoría..."
          />

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTypeFilter(filter.value)}
                  className={filterButtonClass(typeFilter === filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Estado</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={filterButtonClass(statusFilter === filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Prioridad</p>
            <div className="flex flex-wrap gap-2">
              {priorityFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setPriorityFilter(filter.value)}
                  className={filterButtonClass(priorityFilter === filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.tipo] || Bell;
            const unread = isNotificationUnread(notification, readIds);

            return (
              <article
                key={getNotificationId(notification)}
                className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 sm:p-5 ${
                  unread
                    ? "border-[#6F1D46]/40 ring-1 ring-[#6F1D46]/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6F1D46]/10 text-[#6F1D46] dark:bg-pink-900/30 dark:text-pink-200 sm:h-12 sm:w-12">
                      <Icon size={22} />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={notification.etiqueta}
                          variant={TYPE_VARIANTS[notification.tipo] || "default"}
                        />
                        <StatusBadge
                          label={notification.prioridadLabel}
                          variant={notification.prioridadVariant}
                        />
                        {unread && <StatusBadge label="No leída" variant="danger" />}
                        {!unread && <StatusBadge label="Leída" variant="success" />}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                        {notification.titulo}
                      </h3>

                      {notification.descripcion && (
                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                          {notification.descripcion}
                        </p>
                      )}

                      <div className="mt-3 grid gap-1 text-sm text-slate-500 dark:text-slate-400 md:grid-cols-2">
                        <span>Fecha: {notification.fechaLabel || "Sin fecha"}</span>
                        {notification.academicSummary ? (
                          <>
                            <span>Materia: {notification.academicSummary.materia}</span>
                            <span>Grupo: {notification.academicSummary.grupo}</span>
                            <span>Profesor: {notification.academicSummary.profesor}</span>
                            <span>Periodo: {notification.academicSummary.periodo}</span>
                          </>
                        ) : (
                          <>
                            <span>Roles: {notification.audiencia?.roles}</span>
                            <span>Carreras/áreas: {notification.audiencia?.carreras}</span>
                            <span>Categorías: {notification.audiencia?.categorias}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 flex-wrap gap-2 md:w-auto md:flex-col">
                    <Link
                      to={notification.ruta}
                      onClick={() => updateReadIds(markNotificationAsRead(readIds, notification))}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6F1D46] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 md:flex-none"
                    >
                      <Search size={16} />
                      Ver detalle
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleRead(notification)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 md:flex-none"
                    >
                      {unread ? "Marcar leída" : "Marcar no leída"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            title="No hay notificaciones con esos filtros"
            message="Prueba limpiar la búsqueda o revisar otro tipo de contenido."
            icon={Bell}
          />
        )}
      </section>
    </div>
  );
};
