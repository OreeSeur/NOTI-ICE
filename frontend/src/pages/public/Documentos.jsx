import { FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AcademicTargetSummary } from "../../components/common/AcademicTargetSummary";
import { EmptyState } from "../../components/common/EmptyState";
import { PageHeader } from "../../components/common/PageHeader";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import { useAuth } from "../../context/auth/useAuth";
import { ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import {
  formatFileSize,
  getDocumentIcon,
  getDocumentTitle,
} from "../../utils/documentTypes";
import { buildAudienceSearchText } from "../../utils/audience";
import { buildAcademicTargetSearchText } from "../../utils/academicTarget";
import { matchesSearch } from "../../utils/search";

export const Documentos = () => {
  const { documentos } = useDocumentos();
  const { hasRole } = useAuth();
  const puedeCrear = hasRole([ROLES.ADMIN, ROLES.DOCENTE]);
  const [busqueda, setBusqueda] = useState("");

  const documentosFiltrados = useMemo(
    () =>
      documentos.filter((documento) =>
        matchesSearch(
          documento,
          [
            getDocumentTitle,
            "descripcion",
            "tipo",
            "fecha",
            "archivoNombre",
            buildAudienceSearchText,
            buildAcademicTargetSearchText,
          ],
          busqueda
        )
      ),
    [documentos, busqueda]
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Repositorio"
        title="Documentos"
        description="Consulta documentos, formatos, imágenes y archivos institucionales organizados por tipo y fecha."
        actionLabel={puedeCrear ? "Nuevo documento" : undefined}
        actionTo={puedeCrear ? ROUTES.DOCUMENTOS_NUEVO : undefined}
        actionIcon={Plus}
      />

      <SearchInput
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar documentos por título, tipo o archivo..."
      />

      {documentosFiltrados.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No se encontraron documentos"
          message="Prueba con otro título, tipo de archivo o limpia la búsqueda para ver todo el repositorio."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {documentosFiltrados.map((documento) => {
            const titulo = getDocumentTitle(documento);
            const icono = getDocumentIcon(documento.tipo);

            return (
              <Link key={documento.id} to={`/documentos/${documento.id}`}>
                <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#6F1D46]/30 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6F1D46] via-[#750946] to-[#C9A227] opacity-80" />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#6F1D46]/10 text-3xl dark:bg-[#6F1D46]/30" aria-hidden="true">
                        {icono}
                      </span>

                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-lg font-bold text-slate-800 transition group-hover:text-[#6F1D46] dark:text-white dark:group-hover:text-pink-100">
                          {titulo}
                        </h2>

                        <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                          {documento.fecha || "Sin fecha"}
                        </p>
                      </div>
                    </div>

                    <StatusBadge label={documento.tipo || "Documento"} variant="primary" />
                  </div>

                  {documento.descripcion && (
                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {documento.descripcion}
                    </p>
                  )}

                  {documento.archivoNombre && (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-700/70 dark:text-slate-300">
                      {documento.archivoNombre}
                      {documento.archivoTamaño
                        ? ` • ${formatFileSize(documento.archivoTamaño)}`
                        : ""}
                    </p>
                  )}

                  <AcademicTargetSummary item={documento} compact />

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm dark:border-slate-700">
                    <span className="font-semibold text-[#6F1D46] dark:text-pink-100">
                      Ver documento
                    </span>
                    <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#6F1D46] dark:text-slate-500 dark:group-hover:text-pink-100">
                      →
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
