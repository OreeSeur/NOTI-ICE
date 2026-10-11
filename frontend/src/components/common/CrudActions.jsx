import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

export const CrudActions = ({ editTo, onDelete, editLabel = "Editar" }) => {
  return (
    <div className="flex justify-center gap-3">
      {editTo && (
        <Link
          to={editTo}
          className="inline-flex items-center justify-center rounded-lg bg-blue-100 p-2 text-blue-700 transition hover:bg-blue-200"
          aria-label={editLabel}
          title={editLabel}
        >
          <Pencil size={18} />
        </Link>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-red-100 p-2 text-red-700 transition hover:bg-red-200"
          aria-label="Eliminar"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
};
