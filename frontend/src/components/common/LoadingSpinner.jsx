export const LoadingSpinner = ({
  label = "Cargando...",
  size = "md",
  showLabel = true,
}) => {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="inline-flex items-center gap-3 text-slate-600 dark:text-slate-300">
      <span
        className={`
          ${sizeClasses[size] || sizeClasses.md}
          inline-block
          rounded-full
          border-slate-200
          border-t-[#6F1D46]
          animate-spin
          dark:border-slate-700
          dark:border-t-[#D6A2B8]
        `}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {label}
        </span>
      )}
    </div>
  );
};
