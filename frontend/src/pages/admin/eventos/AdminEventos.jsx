import { useMemo, useState } from "react";

import { AdminMobileCard } from "../../../components/common/AdminMobileCard";
import { AdminTableWrapper } from "../../../components/common/AdminTableWrapper";
import { AudienceSummary } from "../../../components/common/AudienceSummary";
import { CrudActions } from "../../../components/common/CrudActions";
import { EmptyState } from "../../../components/common/EmptyState";
import { PageHeader } from "../../../components/common/PageHeader";
import { SearchInput } from "../../../components/common/SearchInput";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { ROUTES, buildRoute } from "../../../constants/routes";
import { useEventos } from "../../../context/eventos/useEventos";
import { buildAudienceSearchText } from "../../../utils/audience";
import { matchesSearch } from "../../../utils/search";

export const AdminEventos = () => {
  const { eventos, eliminarEvento } = useEventos();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

  const eventosFiltrados = useMemo(
    () =>
      eventos.filter((evento) =>
        matchesSearch(evento, ["titulo", "fecha", "lugar", "categoria", buildAudienceSearchText], search)
      ),
    [eventos, search]
  );

  const abrirModal = (evento) => {
    setEventoSeleccionado(evento);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEventoSeleccionado(null);
  };

  const confirmarEliminacion = async () => {
    if (!eventoSeleccionado) return;

    await eliminarEvento(eventoSeleccionado.id);
    cerrarModal();
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Administración de Eventos"
        description="Gestiona eventos, actividades y fechas importantes."
      />

      <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título, fecha, lugar o categoría..."
        />
      </div>

      <div className="space-y-4 lg:hidden">
        {eventosFiltrados.length === 0 ? (
          <EmptyState
            title="No se encontraron eventos"
            message="Prueba con otra búsqueda. Para publicar un evento, hazlo desde el módulo Eventos."
          />
        ) : (
          eventosFiltrados.map((evento) => (
            <AdminMobileCard
              key={evento.id}
              title={evento.titulo || "Evento sin título"}
              subtitle={`${evento.fecha || "Sin fecha"}${evento.lugar ? ` · ${evento.lugar}` : ""}`}
              description={evento.descripcion}
              badgeLabel={evento.categoria || "Evento"}
              badgeVariant="info"
              item={evento}
              editTo={buildRoute(ROUTES.ADMIN_EVENTOS_EDITAR, { id: evento.id })}
              detailTo={buildRoute(ROUTES.EVENTO_DETALLE, { id: evento.id })}
              onDelete={() => abrirModal(evento)}
              meta={[
                { label: "Fecha", value: evento.fecha || "Sin fecha" },
                { label: "Lugar", value: evento.lugar || "Sin lugar" },
              ]}
            />
          ))
        )}
      </div>

      <AdminTableWrapper className="hidden lg:block">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="p-4 text-left">Título</th>
              <th className="p-4 text-left">Fecha</th>
              <th className="p-4 text-left">Lugar</th>
              <th className="p-4 text-left">Categoría</th>
              <th className="p-4 text-left">Destinatarios</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {eventosFiltrados.length === 0 ? (
              <EmptyState
                colSpan={6}
                title="No se encontraron eventos"
                message="Prueba con otra búsqueda. Para publicar un evento, hazlo desde el módulo Eventos."
              />
            ) : (
              eventosFiltrados.map((evento) => (
                <tr
                  key={evento.id}
                  className="border-b border-slate-200 dark:border-slate-700"
                >
                  <td className="p-4 font-medium text-slate-800 dark:text-white">
                    {evento.titulo || "Evento sin título"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {evento.fecha || "Sin fecha"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {evento.lugar || "Sin lugar"}
                  </td>
                  <td className="p-4">
                    <StatusBadge label={evento.categoria || "Evento"} variant="info" />
                  </td>
                  <td className="p-4">
                    <AudienceSummary item={evento} compact />
                  </td>
                  <td className="p-4">
                    <CrudActions
                      editTo={buildRoute(ROUTES.ADMIN_EVENTOS_EDITAR, {
                        id: evento.id,
                      })}
                      onDelete={() => abrirModal(evento)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableWrapper>

      <ConfirmModal
        isOpen={modalOpen}
        title="Eliminar Evento"
        message={`¿Deseas eliminar "${
          eventoSeleccionado?.titulo || "este evento"
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar evento"
        onConfirm={confirmarEliminacion}
        onCancel={cerrarModal}
      />
    </section>
  );
};
