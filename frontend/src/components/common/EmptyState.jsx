import { Inbox } from "lucide-react";

const EmptyStateContent = ({ title, message, icon: Icon = Inbox }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-3xl border border-[#6F1D46]/10 bg-[#6F1D46]/10 p-4 text-[#6F1D46] shadow-sm dark:border-pink-100/10 dark:bg-pink-100/10 dark:text-pink-100">
        <Icon size={30} />
      </div>

      <p className="text-lg font-black text-slate-800 dark:text-white">
        {title}
      </p>

      {message && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
};

export const EmptyState = ({
  title = "Sin resultados",
  message,
  icon,
  colSpan,
  className = "",
}) => {
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className={`p-8 ${className}`}>
          <EmptyStateContent title={title} message={message} icon={icon} />
        </td>
      </tr>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white/90 p-8 shadow-sm dark:border-slate-600 dark:bg-slate-800/90 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6F1D46] via-[#750946] to-[#636569] opacity-70" />
      <EmptyStateContent title={title} message={message} icon={icon} />
    </div>
  );
};
