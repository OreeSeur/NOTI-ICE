import { useMemo, useState } from "react";

import { AdminMobileCard } from "../../../components/common/AdminMobileCard";
import { AdminTableWrapper } from "../../../components/common/AdminTableWrapper";
import { AudienceSummary } from "../../../components/common/AudienceSummary";
import { CrudActions } from "../../../components/common/CrudActions";
import { EmptyState } from "../../../components/common/EmptyState";
import { PageHeader } from "../../../components/common/PageHeader";
import { SearchInput } from "../../../components/common/SearchInput";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { ROUTES, buildRoute } from "../../../constants/routes";
import { useNoticias } from "../../../context/noticias/useNoticias";
import { buildAudienceSearchText } from "../../../utils/audience";
import { matchesSearch } from "../../../utils/search";

export const AdminNoticias = () => {
  const { noticias, eliminarNoticia } = useNoticias();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [noticiaSeleccionado, setNoticiaSeleccionado] = useState(null);

  const noticiasFiltrados = useMemo(
    () =>
      noticias.filter((noticia) =>
        matchesSearch(noticia, ["titulo", "fecha", "categoria", buildAudienceSearchText], search)
      ),
    [noticias, search]
  );

  const abrirModal = (noticia) => {
    setNoticiaSeleccionado(noticia);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setNoticiaSeleccionado(null);
  };

  const confirmarEliminacion = async () => {
    if (!noticiaSeleccionado) return;

    await eliminarNoticia(noticiaSeleccionado.id);
    cerrarModal();
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Administración de Noticias"
        description="Gestiona las noticias publicadas en el portal."
      />

      <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título, fecha o categoría..."
        />
      </div>

      <div className="space-y-4 lg:hidden">
        {noticiasFiltrados.length === 0 ? (
          <EmptyState
            title="No se encontraron noticias"
            message="Prueba con otra búsqueda. Para publicar una noticia, hazlo desde el módulo Noticias."
          />
        ) : (
          noticiasFiltrados.map((noticia) => (
            <AdminMobileCard
              key={noticia.id}
              title={noticia.titulo || "Noticia sin título"}
              subtitle={noticia.fecha || "Sin fecha"}
              description={noticia.descripcion}
              badgeLabel="Noticia"
              badgeVariant="primary"
              item={noticia}
              editTo={buildRoute(ROUTES.ADMIN_NOTICIAS_EDITAR, { id: noticia.id })}
              detailTo={buildRoute(ROUTES.NOTICIA_DETALLE, { id: noticia.id })}
              onDelete={() => abrirModal(noticia)}
            />
          ))
        )}
      </div>

      <AdminTableWrapper className="hidden lg:block">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="p-4 text-left">Título</th>
              <th className="p-4 text-left">Fecha</th>
              <th className="p-4 text-left">Destinatarios</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {noticiasFiltrados.length === 0 ? (
              <EmptyState
                colSpan={4}
                title="No se encontraron noticias"
                message="Prueba con otra búsqueda. Para publicar una noticia, hazlo desde el módulo Noticias."
              />
            ) : (
              noticiasFiltrados.map((noticia) => (
                <tr
                  key={noticia.id}
                  className="border-b border-slate-200 dark:border-slate-700"
                >
                  <td className="p-4 font-medium text-slate-800 dark:text-white">
                    {noticia.titulo || "Noticia sin título"}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {noticia.fecha || "Sin fecha"}
                  </td>
                  <td className="p-4">
                    <AudienceSummary item={noticia} compact />
                  </td>
                  <td className="p-4">
                    <CrudActions
                      editTo={buildRoute(ROUTES.ADMIN_NOTICIAS_EDITAR, {
                        id: noticia.id,
                      })}
                      onDelete={() => abrirModal(noticia)}
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
        title="Eliminar Noticia"
        message={`¿Deseas eliminar "${
          noticiaSeleccionado?.titulo || "esta noticia"
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar noticia"
        onConfirm={confirmarEliminacion}
        onCancel={cerrarModal}
      />
    </section>
  );
};
