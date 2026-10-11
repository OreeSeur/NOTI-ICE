import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AcademicTargetSummary } from "../../components/common/AcademicTargetSummary";
import { AudienceSummary } from "../../components/common/AudienceSummary";
import { EmptyState } from "../../components/common/EmptyState";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useDocumentos } from "../../context/documentos/useDocumentos";
import {
  formatFileSize,
  getDocumentIcon,
  getDocumentTitle,
} from "../../utils/documentTypes";
import { mismoId } from "../../utils/id";

export const DocumentoDetalle = () => {
  const { id } = useParams();

  const { documentos } = useDocumentos();

  const documento = documentos.find((item) => mismoId(item.id, id));

  if (!documento) {
    return (
      <section className="space-y-6">
        <EmptyState
          icon={FileText}
          title="Documento no encontrado"
          message="El documento pudo haber sido eliminado o la dirección no es correcta."
        />

        <Link
          to="/documentos"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6F1D46] px-5 py-3 font-semibold text-white transition hover:opacity-90"
        >
          <ArrowLeft size={18} />
          Volver a Documentos
        </Link>
      </section>
    );
  }

  const titulo = getDocumentTitle(documento);
  const icono = getDocumentIcon(documento.tipo);

  return (
    <section className="space-y-6">
      <Link
        to="/documentos"
        className="inline-flex items-center gap-2 font-semibold text-[#6F1D46] transition hover:gap-3 dark:text-pink-100"
      >
        <ArrowLeft size={18} />
        Volver a Documentos
      </Link>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#6F1D46] via-[#750946] to-[#636569] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mb-5 flex flex-wrap items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-4xl" aria-hidden="true">
              {icono}
            </span>
            <StatusBadge label={documento.tipo || "Documento"} variant="primary" className="bg-white/15 text-white" />
          </div>

          <h1 className="relative text-3xl font-black tracking-tight sm:text-4xl">{titulo}</h1>
          <p className="relative mt-3 text-sm font-medium text-white/85 sm:text-base">
            {documento.fecha || "Sin fecha"}
          </p>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] sm:p-8">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/30">
            <h2 className="mb-3 text-lg font-black text-slate-900 dark:text-white">
              Descripción
            </h2>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              {documento.descripcion}
            </p>

            {documento.archivoNombre && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/60">
                <p className="font-semibold text-slate-800 dark:text-white">
                  Archivo adjunto
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {documento.archivoNombre}
                  {documento.archivoTamaño
                    ? ` • ${formatFileSize(documento.archivoTamaño)}`
                    : ""}
                </p>
              </div>
            )}

            {documento.archivoUrl || documento.url ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {documento.archivoUrl && (
                  <a
                    href={documento.archivoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#6F1D46] px-6 py-3 font-semibold text-white transition hover:opacity-90"
                  >
                    Descargar archivo
                    <ExternalLink size={18} />
                  </a>
                )}

                {documento.url && (
                  <a
                    href={documento.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#6F1D46] px-6 py-3 font-semibold text-[#6F1D46] transition hover:bg-[#6F1D46]/10 dark:border-slate-400 dark:text-slate-200"
                  >
                    Abrir enlace
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                Este documento no tiene un archivo ni un enlace disponible.
              </p>
            )}
          </div>

          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <div>
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#6F1D46] dark:text-slate-300">
                Datos académicos
              </h2>
              <AcademicTargetSummary item={documento} />
            </div>

            <div>
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#6F1D46] dark:text-slate-300">
                Dirigido a
              </h2>
              <AudienceSummary item={documento} />
            </div>
          </aside>
        </div>
      </article>
    </section>
  );
};
