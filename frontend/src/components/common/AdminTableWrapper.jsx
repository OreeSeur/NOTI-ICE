export const AdminTableWrapper = ({ children, className = "" }) => {
  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-md dark:bg-slate-800 ${className}`}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
};
