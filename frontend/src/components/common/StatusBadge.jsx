const variantClasses = {
  default:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200",
  primary:
    "border-[#6F1D46]/20 bg-[#6F1D46]/10 text-[#6F1D46] dark:border-pink-100/20 dark:bg-pink-100/10 dark:text-pink-100",
  success:
    "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200",
  warning:
    "border-yellow-200 bg-yellow-100 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  info: "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  danger:
    "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export const StatusBadge = ({
  label,
  variant = "default",
  className = "",
  showDot = true,
}) => {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
    >
      {showDot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {label}
    </span>
  );
};
