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
import { useDocumentos } from "../../../context/documentos/useDocumentos";
import { buildAudienceSearchText } from "../../../utils/audience";
import { matchesSearch } from "../../../utils/search";
import {
  formatFileSize,
  getDocumentIcon,
  getDocumentTitle,
} from "../../../utils/documentTypes";

export const AdminDocumentos = () => {
  const { documentos, eliminarDocumento } = useDocumentos();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  const documentosFiltrados = useMemo(
    () =>
      documentos.filter((documento) =>
        matchesSearch(
          documento,
          ["titulo", "nombre", "tipo", "fecha", "categoria", "archivoNombre", buildAudienceSearchText],
          search
        )
      ),
    [documentos, search]
  );

  const abrirModal = (documento) => {
    setDocumentoSeleccionado(documento);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setDocumentoSeleccionado(null);
  };

  const confirmarEliminacion = async () => {
    if (!documentoSeleccionado) return;

    await eliminarDocumento(documentoSeleccionado.id);
    cerrarModal();
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Administración de Documentos"
        description="Gestiona archivos, formatos y documentos publicados."
      />

      <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título, tipo, fecha o categoría..."
        />
      </div>

      <div className="space-y-4 lg:hidden">
        {documentosFiltrados.length === 0 ? (
          <EmptyState
            title="No se encontraron documentos"
            message="Prueba con otra búsqueda. Para publicar un documento, hazlo desde el módulo Documentos."
          />
        ) : (
          documentosFiltrados.map((documento) => (
            <AdminMobileCard
              key={documento.id}
              title={getDocumentTitle(documento)}
              subtitle={documento.fecha || "Sin fecha"}
              description={documento.descripcion || documento.archivoNombre}
              badgeLabel={documento.tipo || "Documento"}
              badgeVariant="primary"
              icon={getDocumentIcon(documento.tipo)}
              item={documento}
              editTo={buildRoute(ROUTES.ADMIN_DOCUMENTOS_EDITAR, { id: documento.id })}
              detailTo={buildRoute(ROUTES.DOCUMENTO_DETALLE, { id: documento.id })}
              onDelete={() => abrirModal(documento)}
              meta={[
                { label: "Archivo", value: documento.archivoNombre || "Sin archivo" },
                {
                  label: "Tamaño",
                  value: documento.archivoTamaño ? formatFileSize(documento.archivoTamaño) : "No registrado",
                },
              ]}
            />
          ))
        )}
      </div>

      <AdminTableWrapper className="hidden lg:block">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="p-4 text-left">Título</th>
              <th className="p-4 text-left">Tipo</th>
              <th className="p-4 text-left">Fecha</th>
              <th className="p-4 text-left">Destinatarios</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {documentosFiltrados.length === 0 ? (
              <EmptyState
                colSpan={5}
                title="No se encontraron documentos"
                message="Prueba con otra búsqueda. Para publicar un documento, hazlo desde el módulo Documentos."
              />
            ) : (
              documentosFiltrados.map((documento) => (
                <tr
                  key={documento.id}
                  className="border-b border-slate-200 dark:border-slate-700"
                >
                  <td className="p-4 font-medium text-slate-800 dark:text-white">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden="true">
                        {getDocumentIcon(documento.tipo)}
                      </span>
                      <div>
                        <p>{getDocumentTitle(documento)}</p>
                        {documento.archivoNombre && (
                          <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                            {documento.archivoNombre}
                            {documento.archivoTamaño
                              ? ` • ${formatFileSize(documento.archivoTamaño)}`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge label={documento.tipo || "Documento"} variant="primary" />
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">
                    {documento.fecha || "Sin fecha"}
                  </td>
                  <td className="p-4">
                    <AudienceSummary item={documento} compact />
                  </td>
                  <td className="p-4">
                    <CrudActions
                      editTo={buildRoute(ROUTES.ADMIN_DOCUMENTOS_EDITAR, {
                        id: documento.id,
                      })}
                      onDelete={() => abrirModal(documento)}
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
        title="Eliminar Documento"
        message={`¿Deseas eliminar "${
          documentoSeleccionado
            ? getDocumentTitle(documentoSeleccionado)
            : "este documento"
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar documento"
        onConfirm={confirmarEliminacion}
        onCancel={cerrarModal}
      />
    </section>
  );
};
