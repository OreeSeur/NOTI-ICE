import {
  Bell,
  CalendarDays,
  FileText,
  UserPlus,
  Users,
} from "lucide-react";

import { AdminListCard } from "../components/admin/AdminListCard";
import { AdminStatCard } from "../components/admin/AdminStatCard";
import { QuickActionCard } from "../components/admin/QuickActionCard";
import { getRoleLabel, normalizeRole } from "../constants/roles";
import { ROUTES, buildRoute } from "../constants/routes";
import { useNoticias } from "../context/noticias/useNoticias";
import { useDocumentos } from "../context/documentos/useDocumentos";
import { useEventos } from "../context/eventos/useEventos";
import { useUsuarios } from "../context/usuarios/useUsuarios";

const meses = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const obtenerTituloDocumento = (documento) =>
  documento.titulo || documento.nombre || "Documento sin título";

const obtenerTitulo = (item, fallback) => item.titulo || item.nombre || fallback;

const convertirFecha = (fecha) => {
  if (!fecha) return null;

  const fechaNativa = new Date(fecha);

  if (!Number.isNaN(fechaNativa.getTime())) {
    return fechaNativa;
  }

  const partes = fecha
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})\s+([a-záéíóúñ]+)\s+(\d{4})$/u);

  if (!partes) return null;

  const [, dia, mes, anio] = partes;
  const indiceMes = meses[mes];

  if (indiceMes === undefined) return null;

  return new Date(Number(anio), indiceMes, Number(dia));
};

const ordenarPorFechaDesc = (items) =>
  [...items].sort((a, b) => {
    const fechaA = convertirFecha(a.fecha)?.getTime() || 0;
    const fechaB = convertirFecha(b.fecha)?.getTime() || 0;

    return fechaB - fechaA;
  });

const obtenerEventosProximos = (eventos) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return eventos
    .map((evento) => ({
      ...evento,
      fechaOrden: convertirFecha(evento.fecha),
    }))
    .filter((evento) => !evento.fechaOrden || evento.fechaOrden >= hoy)
    .sort((a, b) => {
      const fechaA = a.fechaOrden?.getTime() || Number.MAX_SAFE_INTEGER;
      const fechaB = b.fechaOrden?.getTime() || Number.MAX_SAFE_INTEGER;

      return fechaA - fechaB;
    });
};

const contarPorRol = (usuarios) => {
  const conteo = usuarios.reduce((acumulado, usuario) => {
    const rol = normalizeRole(usuario.rol) || "sin-rol";

    return {
      ...acumulado,
      [rol]: (acumulado[rol] || 0) + 1,
    };
  }, {});

  return Object.entries(conteo)
    .map(([rol, total]) => ({
      id: rol,
      title: getRoleLabel(rol),
      subtitle: `${total} usuario${total === 1 ? "" : "s"}`,
      badge: total,
    }))
    .sort((a, b) => b.badge - a.badge);
};

export const PanelAdmin = () => {
  const { noticias } = useNoticias();
  const { eventos } = useEventos();
  const { documentos } = useDocumentos();
  const { usuarios } = useUsuarios();

  const eventosProximos = obtenerEventosProximos(eventos);
  const documentosRecientes = ordenarPorFechaDesc(documentos).slice(0, 4);
  const noticiasRecientes = ordenarPorFechaDesc(noticias).slice(0, 4);

  const usuariosActivos = usuarios.filter(
    (usuario) => usuario.estado !== "inactivo"
  ).length;

  const actividadReciente = [
    ...noticiasRecientes.map((noticia) => ({
      id: `noticia-${noticia.id}`,
      title: obtenerTitulo(noticia, "Noticia sin título"),
      subtitle: noticia.fecha || "Sin fecha registrada",
      badge: "Noticia",
      to: buildRoute(ROUTES.ADMIN_NOTICIAS_EDITAR, { id: noticia.id }),
    })),
    ...eventosProximos.slice(0, 4).map((evento) => ({
      id: `evento-${evento.id}`,
      title: obtenerTitulo(evento, "Evento sin título"),
      subtitle: `${evento.fecha || "Sin fecha"}${
        evento.lugar ? ` · ${evento.lugar}` : ""
      }`,
      badge: "Evento",
      to: buildRoute(ROUTES.ADMIN_EVENTOS_EDITAR, { id: evento.id }),
    })),
    ...documentosRecientes.map((documento) => ({
      id: `documento-${documento.id}`,
      title: obtenerTituloDocumento(documento),
      subtitle: `${documento.fecha || "Sin fecha"}${
        documento.tipo ? ` · ${documento.tipo}` : ""
      }`,
      badge: "Documento",
      to: buildRoute(ROUTES.ADMIN_DOCUMENTOS_EDITAR, { id: documento.id }),
    })),
  ].slice(0, 8);

  const resumenRoles = contarPorRol(usuarios);

  const estadisticas = [
    {
      title: "Noticias",
      value: noticias.length,
      description: "Comunicados publicados en el portal",
      icon: Bell,
      to: ROUTES.ADMIN_NOTICIAS,
    },
    {
      title: "Eventos",
      value: eventos.length,
      description: `${eventosProximos.length} próximo${
        eventosProximos.length === 1 ? "" : "s"
      } en calendario`,
      icon: CalendarDays,
      to: ROUTES.ADMIN_EVENTOS,
    },
    {
      title: "Documentos",
      value: documentos.length,
      description: "Archivos y formatos disponibles",
      icon: FileText,
      to: ROUTES.ADMIN_DOCUMENTOS,
    },
    {
      title: "Usuarios",
      value: usuarios.length,
      description: `${usuariosActivos} activo${usuariosActivos === 1 ? "" : "s"}`,
      icon: Users,
      to: ROUTES.ADMIN_USUARIOS,
    },
  ];

  const accionesRapidas = [
    {
      title: "Nuevo usuario",
      description: "Agrega acceso para la comunidad",
      icon: UserPlus,
      to: ROUTES.ADMIN_USUARIOS_NUEVO,
    },
  ];

  return (
    <section className="space-y-8">
      <div
        className="
          rounded-2xl
          bg-gradient-to-r
          from-[#6F1D46]
          to-[#9b1b54]
          p-5
          sm:p-6
          md:p-8
          text-white
          shadow-md
        "
      >
        <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
          Administración general
        </p>

        <h1 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
          Panel de Administración
        </h1>

        <p className="mt-3 max-w-3xl text-white/80">
          Consulta el estado general del portal, accede rápidamente a los módulos
          principales y revisa la actividad más reciente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {estadisticas.map((estadistica) => (
          <AdminStatCard key={estadistica.title} {...estadistica} />
        ))}
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Acciones rápidas
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Accesos directos de administración. Las noticias, eventos y documentos se crean desde su propio módulo.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {accionesRapidas.map((accion) => (
            <QuickActionCard key={accion.title} {...accion} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AdminListCard
            title="Actividad reciente"
            description="Últimas noticias, eventos y documentos registrados."
            items={actividadReciente}
            emptyMessage="Aún no hay actividad para mostrar."
            actionLabel="Ver noticias"
            actionTo={ROUTES.ADMIN_NOTICIAS}
          />
        </div>

        <AdminListCard
          title="Usuarios por rol"
          description="Distribución actual de cuentas registradas."
          items={resumenRoles}
          emptyMessage="Aún no hay usuarios registrados."
          actionLabel="Gestionar"
          actionTo={ROUTES.ADMIN_USUARIOS}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminListCard
          title="Próximos eventos"
          description="Eventos próximos ordenados por fecha."
          items={eventosProximos.slice(0, 4).map((evento) => ({
            id: evento.id,
            title: obtenerTitulo(evento, "Evento sin título"),
            subtitle: `${evento.fecha || "Sin fecha"}${
              evento.lugar ? ` · ${evento.lugar}` : ""
            }`,
            badge: evento.categoria || "Evento",
            to: buildRoute(ROUTES.ADMIN_EVENTOS_EDITAR, { id: evento.id }),
          }))}
          emptyMessage="No hay eventos próximos registrados."
          actionLabel="Ver eventos"
          actionTo={ROUTES.ADMIN_EVENTOS}
        />

        <AdminListCard
          title="Documentos recientes"
          description="Últimos documentos disponibles para la comunidad."
          items={documentosRecientes.map((documento) => ({
            id: documento.id,
            title: obtenerTituloDocumento(documento),
            subtitle: documento.fecha || "Sin fecha registrada",
            badge: documento.tipo || "Documento",
            to: buildRoute(ROUTES.ADMIN_DOCUMENTOS_EDITAR, { id: documento.id }),
          }))}
          emptyMessage="No hay documentos registrados."
          actionLabel="Ver documentos"
          actionTo={ROUTES.ADMIN_DOCUMENTOS}
        />
      </div>
    </section>
  );
};
