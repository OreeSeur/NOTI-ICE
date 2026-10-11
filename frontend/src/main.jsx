import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/auth/AuthProvider";
import { UsuariosProvider } from "./context/usuarios/UsuariosProvider";
import { NoticiasProvider } from "./context/noticias/NoticiasProvider";
import { EventosProvider } from "./context/eventos/EventosProvider";
import { DocumentosProvider } from "./context/documentos/DocumentosProvider";
import { ToastProvider } from "./context/toast/ToastProvider";
import { AcademicoProvider } from "./context/academico/AcademicoProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <UsuariosProvider>
      <AuthProvider>
        <NoticiasProvider>
          <EventosProvider>
            <DocumentosProvider>
              <AcademicoProvider>
              <BrowserRouter>
                <ToastProvider>
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </ToastProvider>
              </BrowserRouter>
              </AcademicoProvider>
            </DocumentosProvider>
          </EventosProvider>
        </NoticiasProvider>
      </AuthProvider>
    </UsuariosProvider>
  </React.StrictMode>
);