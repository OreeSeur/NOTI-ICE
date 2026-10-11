import { useCallback, useMemo, useState } from "react";

import { crearId } from "../../utils/id";
import { ToastContext } from "./ToastContext";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      const id = crearId();

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
        },
      ]);

      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  const success = useCallback(
    (message) => showToast(message, "success"),
    [showToast]
  );

  const error = useCallback(
    (message) => showToast(message, "error"),
    [showToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      success,
      error,
      removeToast,
    }),
    [toasts, showToast, success, error, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed top-5 right-5 z-[9999] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-4
              py-3
              rounded-lg
              shadow-lg
              text-white
              font-medium
              animate-pulse
              ${
                toast.type === "error"
                  ? "bg-red-600"
                  : "bg-green-600"
              }
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
