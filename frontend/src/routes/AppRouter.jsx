import { Routes, Route } from "react-router-dom";

/* Layout principal */
import { Layout } from "../components/layout/Layout";

/* Páginas públicas */
import { Home } from "../pages/public/Home";

import { Noticias } from "../pages/public/Noticias";
import { NoticiaDetalle } from "../pages/public/NoticiaDetalle";
import { NoticiaNueva } from "../pages/public/NoticiaNueva";

import { Eventos } from "../pages/public/Eventos";
import { EventoDetalle } from "../pages/public/EventoDetalle";
import { EventoNuevo } from "../pages/public/EventoNuevo";

import { Calendario } from "../pages/public/Calendario";

import { Documentos } from "../pages/public/Documentos";
import { DocumentoDetalle } from "../pages/public/DocumentoDetalle";
import { DocumentoNuevo } from "../pages/public/DocumentoNuevo";

import { Perfil } from "../pages/public/Perfil";
import { Notificaciones } from "../pages/public/Notificaciones";
import { DocentePublicaciones } from "../pages/docente/DocentePublicaciones";
import { NoAutorizado } from "../pages/NoAutorizado";

/* Autenticación */
import { Login } from "../pages/auth/Login";

/* Administración */
import { PanelAdmin } from "../pages/PanelAdmin";

import { AdminNoticias } from "../pages/admin/noticias/AdminNoticias";
import { AdminEditarNoticia } from "../pages/admin/noticias/AdminEditarNoticia";

import { AdminEventos } from "../pages/admin/eventos/AdminEventos";
import { AdminEditarEvento } from "../pages/admin/eventos/AdminEditarEvento";

import { AdminDocumentos } from "../pages/admin/documentos/AdminDocumentos";
import { AdminEditarDocumento } from "../pages/admin/documentos/AdminEditarDocumento";

import { AdminUsuarios } from "../pages/admin/usuarios/AdminUsuarios";
import { AdminNuevoUsuario } from "../pages/admin/usuarios/AdminNuevoUsuario";
import { AdminEditarUsuario } from "../pages/admin/usuarios/AdminEditarUsuario";

/* Rutas protegidas */
import { PrivateRoute } from "./PrivateRoute";
import { AdminRoute } from "./AdminRoute";
import { RoleRoute } from "./RoleRoute";
import { ROUTES } from "../constants/routes";
import { ROLES } from "../constants/roles";

/*Recuperar contraseña*/
import { RecuperarContrasena } from "../pages/auth/RecuperarContrasena";
import { RestablecerContrasena } from "../pages/auth/RestablecerContrasena";



/* Error 404 */
import { NotFound } from "../pages/NotFound";

export const AppRouter = () => {
return ( <Routes>

  {/* Login */}
  <Route
    path={ROUTES.LOGIN}
    element={<Login />}
  />

  <Route
    path={ROUTES.NO_AUTORIZADO}
    element={
      <Layout>
        <NoAutorizado />
      </Layout>
    }
  />

  <Route
    path={ROUTES.NOT_FOUND}
    element={
      <Layout>
        <NotFound />
      </Layout>
    }
  />

  {/* Home */}
  <Route
    path={ROUTES.HOME}
    element={
      <Layout>
        <Home />
      </Layout>
    }
  />

  {/* Noticias */}
  <Route
    path={ROUTES.NOTICIAS}
    element={
      <Layout>
        <Noticias />
      </Layout>
    }
  />

  <Route
    path={ROUTES.NOTICIA_DETALLE}
    element={
      <Layout>
        <NoticiaDetalle />
      </Layout>
    }
  />

  {/* Eventos */}
  <Route
    path={ROUTES.EVENTOS}
    element={
      <Layout>
        <Eventos />
      </Layout>
    }
  />

  <Route
    path={ROUTES.EVENTO_DETALLE}
    element={
      <Layout>
        <EventoDetalle />
      </Layout>
    }
  />

  {/* Calendario */}
  <Route
    path={ROUTES.CALENDARIO}
    element={
      <Layout>
        <Calendario />
      </Layout>
    }
  />

  {/* Documentos */}
  <Route
    path={ROUTES.DOCUMENTOS}
    element={
      <Layout>
        <Documentos />
      </Layout>
    }
  />

  <Route
    path={ROUTES.DOCUMENTO_DETALLE}
    element={
      <Layout>
        <DocumentoDetalle />
      </Layout>
    }
  />

  {/* Perfil */}
  <Route
    path={ROUTES.PERFIL}
    element={
      <PrivateRoute>
        <Layout>
          <Perfil />
        </Layout>
      </PrivateRoute>
    }
  />

  {/* Notificaciones */}
  <Route
    path={ROUTES.NOTIFICACIONES}
    element={
      <PrivateRoute>
        <Layout>
          <Notificaciones />
        </Layout>
      </PrivateRoute>
    }
  />


  {/* Crear contenido desde cada módulo (permisos iguales a los del backend) */}
  <Route
    path={ROUTES.NOTICIAS_NUEVO}
    element={
      <RoleRoute roles={[ROLES.ADMIN]}>
        <Layout>
          <NoticiaNueva />
        </Layout>
      </RoleRoute>
    }
  />

  <Route
    path={ROUTES.EVENTOS_NUEVO}
    element={
      <RoleRoute roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
        <Layout>
          <EventoNuevo />
        </Layout>
      </RoleRoute>
    }
  />

  <Route
    path={ROUTES.DOCUMENTOS_NUEVO}
    element={
      <RoleRoute roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
        <Layout>
          <DocumentoNuevo />
        </Layout>
      </RoleRoute>
    }
  />

  {/* Editar lo propio: el Docente edita lo que él publicó (la pantalla valida que sea suyo) */}
  <Route
    path={ROUTES.EVENTOS_EDITAR}
    element={
      <RoleRoute roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
        <Layout>
          <AdminEditarEvento />
        </Layout>
      </RoleRoute>
    }
  />

  <Route
    path={ROUTES.DOCUMENTOS_EDITAR}
    element={
      <RoleRoute roles={[ROLES.ADMIN, ROLES.DOCENTE]}>
        <Layout>
          <AdminEditarDocumento />
        </Layout>
      </RoleRoute>
    }
  />

  {/* Publicaciones docentes */}
  <Route
    path={ROUTES.DOCENTE_PUBLICACIONES}
    element={
      <RoleRoute roles={[ROLES.DOCENTE, ROLES.ADMIN]}>
        <Layout>
          <DocentePublicaciones />
        </Layout>
      </RoleRoute>
    }
  />

{/* Administración */}
<Route
  path={ROUTES.ADMIN}
  element={
    <AdminRoute>
      <Layout>
        <PanelAdmin />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_NOTICIAS}
  element={
    <AdminRoute>
      <Layout>
        <AdminNoticias />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_NOTICIAS_EDITAR}
  element={
    <AdminRoute>
      <Layout>
        <AdminEditarNoticia />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_EVENTOS}
  element={
    <AdminRoute>
      <Layout>
        <AdminEventos />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_EVENTOS_EDITAR}
  element={
    <AdminRoute>
      <Layout>
        <AdminEditarEvento />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_DOCUMENTOS}
  element={
    <AdminRoute>
      <Layout>
        <AdminDocumentos />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_DOCUMENTOS_EDITAR}
  element={
    <AdminRoute>
      <Layout>
        <AdminEditarDocumento />
      </Layout>
    </AdminRoute>
  }
/>
<Route
  path={ROUTES.ADMIN_USUARIOS}
  element={
    <AdminRoute>
      <Layout>
        <AdminUsuarios />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_USUARIOS_NUEVO}
  element={
    <AdminRoute>
      <Layout>
        <AdminNuevoUsuario />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path={ROUTES.ADMIN_USUARIOS_EDITAR}
  element={
    <AdminRoute>
      <Layout>
        <AdminEditarUsuario />
      </Layout>
    </AdminRoute>
  }
/>

<Route
  path="*"
  element={
    <Layout>
      <NotFound />
    </Layout>
  }
/>

<Route 
  path={ROUTES.RECUPERAR_CONTRASENA}  
  element={
  <RecuperarContrasena />
  } 
  />

<Route 
  path={ROUTES.RESTABLECER_CONTRASENA} 
  element={
  <RestablecerContrasena />} 
  />

</Routes>

);
};
