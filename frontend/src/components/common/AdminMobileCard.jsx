import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { AudienceSummary } from "./AudienceSummary";
import { StatusBadge } from "./StatusBadge";

export const AdminMobileCard = ({
  title,
  subtitle,
  description,
  badgeLabel,
  badgeVariant = "default",
  icon,
  item,
  editTo,
  onDelete,
  detailTo,
  meta = [],
}) => {
  return (
    <article className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              {icon && (
                <span className="mt-0.5 shrink-0 text-xl" aria-hidden="true">
                  {icon}
                </span>
              )}
              <h3 className="line-clamp-2 text-lg font-bold text-slate-800 dark:text-white">
                {title}
              </h3>
            </div>
          </div>

          {badgeLabel && (
            <div className="shrink-0">
              <StatusBadge label={badgeLabel} variant={badgeVariant} />
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-slate-600 dark:text-slate-300">{subtitle}</p>
        )}

        {description && (
          <p className="line-clamp-3 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}

        {meta.length > 0 && (
          <div className="space-y-1 pt-1">
            {meta.map((itemMeta) => (
              <p key={itemMeta.label} className="text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-800 dark:text-white">
                  {itemMeta.label}:
                </span>{" "}
                {itemMeta.value}
              </p>
            ))}
          </div>
        )}

        {item && (
          <div className="pt-1">
            <p className="mb-2 text-sm font-medium text-slate-800 dark:text-white">
              Destinatarios:
            </p>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/60">
              <AudienceSummary item={item} compact />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {detailTo && (
          <Link
            to={detailTo}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 py-2 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            <Eye size={18} />
            Ver
          </Link>
        )}

        {editTo && (
          <Link
            to={editTo}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-100 py-2 text-blue-700 transition hover:bg-blue-200"
          >
            <Pencil size={18} />
            Editar
          </Link>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-100 py-2 text-red-700 transition hover:bg-red-200"
        >
          <Trash2 size={18} />
          Eliminar
        </button>
      </div>
    </article>
  );
};
