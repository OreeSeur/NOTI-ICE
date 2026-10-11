import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  Bell,
  Search,
  User,
  Menu,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/auth/useAuth";
import { useNoticias } from "../../context/noticias/useNoticias";
import { useEventos } from "../../context/eventos/useEventos";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { ROUTES } from "../../constants/routes";
import { getRoleLabel } from "../../constants/roles";
import { getDocumentTitle } from "../../utils/documentTypes";
import { canReceiveItem } from "../../utils/audience";
import {
  buildNotificationItems,
  getNotificationId,
  getReadNotificationIds,
  markNotificationsAsRead,
  saveReadNotificationIds,
} from "../../utils/notifications";

export const Topbar = ({
  setMobileOpen,
  darkMode,
  setDarkMode,
}) => {
  const { user, logout, canAccessAdmin } = useAuth();
  const { pathname } = useLocation();
  // En las pantallas de "crear nuevo" (/noticias/nuevo, /eventos/nuevo, ...) no se muestra el buscador
  const esModoCrear = pathname.endsWith("/nuevo");
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();

  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(() =>
    getReadNotificationIds(user)
  );

  const resultados = [
    ...noticias.filter((item) => canReceiveItem(item, user)).map((item) => ({
      id: item.id,
      titulo: item.titulo ?? "",
      tipo: "Noticia",
      ruta: `/noticias/${item.id}`,
    })),

    ...eventos.filter((item) => canReceiveItem(item, user)).map((item) => ({
      id: item.id,
      titulo: item.titulo ?? "",
      tipo: "Evento",
      ruta: `/eventos/${item.id}`,
    })),

    ...documentos.filter((item) => canReceiveItem(item, user)).map((item) => ({
      id: item.id,
      titulo: getDocumentTitle(item),
      tipo: "Documento",
      ruta: `/documentos/${item.id}`,
    })),
  ].filter((item) =>
    item.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const notificationItems = useMemo(
    () => buildNotificationItems({ noticias, eventos, documentos, user }).slice(0, 15),
    [noticias, eventos, documentos, user]
  );
  const unreadCount = notificationItems.filter(
    (item) => !readNotificationIds.includes(getNotificationId(item))
  ).length;

  const handleToggleNotifications = () => {
    setShowUserMenu(false);

    setShowNotifications((prev) => {
      const nextValue = !prev;

      if (nextValue) {
        const updatedIds = markNotificationsAsRead(
          readNotificationIds,
          notificationItems
        );

        setReadNotificationIds(updatedIds);
        saveReadNotificationIds(updatedIds, user);
      }

      return nextValue;
    });
  };

  const closeNotifications = () => {
    setShowNotifications(false);
  };

  return (
    <header
      className="
        bg-white
        dark:bg-slate-800
        text-slate-800
        dark:text-white
        rounded-xl
        shadow-md
        p-3
        sm:p-4
        flex
        flex-wrap
        justify-between
        items-center
        gap-3
        sm:gap-4
        mb-6
        md:mb-8
      "
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden"
        >
          <Menu size={24} />
        </button>

        {!esModoCrear && (
        <div className="relative w-full max-w-none md:max-w-sm">
          <div
            className="
              flex
              items-center
              gap-2
              bg-slate-100
              dark:bg-slate-700
              px-3
              py-2
              sm:px-4
              rounded-lg
            "
          >
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                bg-transparent
                outline-none
                w-full
                min-w-0
                text-sm
                sm:text-base
                text-slate-800
                dark:text-white
              "
            />
          </div>

          {search && (
            <div
              className="
                absolute
                top-14
                left-0
                right-0
                bg-white
                dark:bg-slate-800
                shadow-lg
                rounded-lg
                p-3
                z-50
                max-h-80
                overflow-y-auto
              "
            >
              {resultados.length > 0 ? (
                resultados.map((item) => (
                  <Link
                    key={`${item.tipo}-${item.id}`}
                    to={item.ruta}
                    onClick={() => setSearch("")}
                    className="
                      block
                      py-2
                      px-2
                      border-b
                      last:border-none
                      rounded
                      text-slate-800
                      dark:text-slate-200
                      hover:bg-slate-100
                      dark:hover:bg-slate-700
                    "
                  >
                    <span className="font-semibold">[{item.tipo}]</span>{" "}
                    {item.titulo}
                  </Link>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  Sin resultados
                </p>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="cursor-pointer transition hover:scale-110"
        >
          {darkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative cursor-pointer"
            aria-label="Abrir notificaciones"
          >
            <Bell size={22} />

            {unreadCount > 0 && (
              <span
                className="
                  absolute
                  -top-2
                  -right-2
                  bg-red-500
                  text-white
                  text-xs
                  rounded-full
                  min-w-5
                  h-5
                  px-1
                  flex
                  items-center
                  justify-center
                "
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="
                fixed
                left-3
                right-3
                top-20
                mt-0
                max-h-[70vh]
                sm:absolute
                sm:left-auto
                sm:right-0
                sm:top-auto
                sm:mt-3
                sm:w-80
                sm:max-h-96
                overflow-y-auto
                bg-white
                dark:bg-slate-800
                shadow-lg
                rounded-lg
                p-4
                z-50
              "
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    Notificaciones
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contenido reciente dirigido a tu perfil
                  </p>
                </div>

                <Link
                  to={ROUTES.NOTIFICACIONES}
                  onClick={closeNotifications}
                  className="text-xs font-semibold text-[#6A0032] hover:underline dark:text-pink-300"
                >
                  Ver todas
                </Link>
              </div>

              {notificationItems.length > 0 ? (
                notificationItems.map((item) => (
                  <Link
                    key={getNotificationId(item)}
                    to={item.ruta}
                    onClick={closeNotifications}
                    className="
                      block
                      py-2
                      px-2
                      border-b
                      last:border-none
                      rounded
                      transition
                      text-slate-800
                      dark:text-slate-200
                      hover:bg-slate-100
                      dark:hover:bg-slate-700
                    "
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#6A0032] dark:text-pink-300">
                          {item.etiqueta}
                        </span>
                        {item.prioridad && item.prioridad !== "normal" && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-200">
                            {item.prioridadLabel}
                          </span>
                        )}
                      </div>
                      {item.fechaLabel && (
                        <span className="text-[11px] text-slate-400">
                          {item.fechaLabel}
                        </span>
                      )}
                    </div>

                    <p className="font-medium line-clamp-1">{item.titulo}</p>

                    {item.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.descripcion}
                      </p>
                    )}

                    {item.academicSummary ? (
                      <p className="mt-1 text-[11px] font-medium text-[#6A0032] line-clamp-1 dark:text-pink-200">
                        {item.academicSummary.materia} · {item.academicSummary.grupo} · {item.academicSummary.profesor}
                      </p>
                    ) : item.audiencia?.categorias ? (
                      <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                        {item.audiencia.categorias}
                      </p>
                    ) : null}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Todavía no hay contenido reciente.
                </p>
              )}
            </div>
          )}
        </div>

        {!user && (
          <Link
            to={ROUTES.LOGIN}
            className="
              flex
              items-center
              gap-2
              bg-[#6A0032]
              text-white
              px-3
              py-2
              sm:px-4
              rounded-lg
              hover:opacity-90
              transition
            "
          >
            <User size={18} />

            <span className="hidden sm:inline">Acceder</span>
          </Link>
        )}

        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(false);
                setShowUserMenu(!showUserMenu);
              }}
              className="flex min-w-0 items-center gap-2 cursor-pointer"
            >
              <User size={20} />

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-32 truncate font-semibold lg:max-w-44">{user.nombre}</p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getRoleLabel(user.rol)}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div
                className="
                  fixed
                  left-3
                  right-3
                  top-20
                  mt-0
                  sm:absolute
                  sm:left-auto
                  sm:right-0
                  sm:top-auto
                  sm:mt-3
                  sm:w-56
                  bg-white
                  dark:bg-slate-800
                  rounded-lg
                  shadow-lg
                  p-2
                  z-50
                "
              >
                <Link
                  to={ROUTES.PERFIL}
                  onClick={() => setShowUserMenu(false)}
                  className="
                    block
                    px-3
                    py-2
                    rounded
                    hover:bg-slate-100
                    dark:hover:bg-slate-700
                  "
                >
                  Mi Perfil
                </Link>
                {canAccessAdmin() && (
                  <Link
                    to={ROUTES.ADMIN}
                    onClick={() => setShowUserMenu(false)}
                    className="
                      block
                      px-3
                      py-2
                      rounded
                      hover:bg-slate-100
                      dark:hover:bg-slate-700
                    "
                  >
                    Panel Admin
                  </Link>
                )}

                <button
                  type="button"
                  onClick={logout}
                  className="
                    w-full
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded
                    hover:bg-red-100
                    text-red-600
                  "
                >
                  <LogOut size={16} />

                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
