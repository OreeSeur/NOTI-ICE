export const Footer = () => {
  return (
      <footer
        className="
          mt-10
          text-center
          text-sm
          text-slate-500
          dark:text-slate-400
        "
      >
      <h3
        className="
          font-bold
          text-[#6F1D46]
          text-lg
        "
      >
        Instituto Politécnico Nacional
      </h3>

      <p className="text-slate-600">
        ESIME Unidad Zacatenco
      </p>

      <p
        className="
          text-sm
          text-slate-500
          mt-2
        "
      >
        © 2026 Portal ESIME Zacatenco
      </p>

{/*      <p
        className="
          text-xs
          text-slate-400
          mt-1
        "
      >
        Desarrollado con React y Tailwind CSS
      </p>*/}
    </footer>
  );
};