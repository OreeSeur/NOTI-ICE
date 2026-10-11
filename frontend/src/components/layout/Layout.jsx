import { useEffect, useState } from "react";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Footer } from "./Footer";

export const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(() => {
      const saved =
        localStorage.getItem("darkMode");

      return saved === "true";
    });

  useEffect(() => {
    localStorage.setItem(
      "darkMode",
      darkMode
    );

    if (darkMode) {
      document.documentElement.classList.add(
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark"
      );
    }
  }, [darkMode]);

  return (
    <div
      className={`
        flex
        min-h-screen
        ${
          darkMode
            ? "bg-slate-900"
            : "bg-slate-100"
        }
      `}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main
        className="
          min-w-0
          flex-1
          overflow-x-hidden
          p-3
          sm:p-4
          md:p-8
        "
      >
        <Topbar
          setMobileOpen={setMobileOpen}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {children}

        <Footer />
      </main>
    </div>
  );
};