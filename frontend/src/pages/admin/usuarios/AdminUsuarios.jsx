import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { EmptyState } from "../../../components/common/EmptyState";
import { PageHeader } from "../../../components/common/PageHeader";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { UsuarioCard } from "../../../components/usuarios/UsuarioCard";
import { UsuariosFilters } from "../../../components/usuarios/UsuariosFilters";
import { UsuariosTable } from "../../../components/usuarios/UsuariosTable";
import { normalizeRole } from "../../../constants/roles";
import { ROUTES } from "../../../constants/routes";
import { useUsuarios } from "../../../context/usuarios/useUsuarios";
import { matchesSearch } from "../../../utils/search";

export const AdminUsuarios = () => {
  const { usuarios, eliminarUsuario } = useUsuarios();

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((usuario) => {
        const coincideBusqueda = matchesSearch(
          usuario,
          ["nombre", "correo", "email", "boleta", "carrera", "semestre"],
          busqueda
        );

        const coincideRol =
          filtroRol === "todos" ||
          normalizeRole(usuario.rol) === normalizeRole(filtroRol);

        return coincideBusqueda && coincideRol;
      }),
    [usuarios, busqueda, filtroRol]
  );

  const abrirModal = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setUsuarioSeleccionado(null);
  };

  const confirmarEliminacion = () => {
    if (!usuarioSeleccionado) return;

    eliminarUsuario(usuarioSeleccionado.id);
    cerrarModal();
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Administración de Usuarios"
        description="Gestiona los usuarios registrados y sus roles de acceso."
        actionLabel="Nuevo Usuario"
        actionTo={ROUTES.ADMIN_USUARIOS_NUEVO}
        actionIcon={Plus}
      />

      <UsuariosFilters
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtroRol={filtroRol}
        setFiltroRol={setFiltroRol}
      />

      <div className="space-y-4 lg:hidden">
        {usuariosFiltrados.length === 0 ? (
          <EmptyState
            title="No se encontraron usuarios"
            message="Prueba con otra búsqueda, cambia el filtro de rol o registra un nuevo usuario."
          />
        ) : (
          usuariosFiltrados.map((usuario) => (
            <UsuarioCard key={usuario.id} usuario={usuario} onDelete={abrirModal} />
          ))
        )}
      </div>

      <UsuariosTable usuarios={usuariosFiltrados} onDelete={abrirModal} />

      <ConfirmModal
        isOpen={modalOpen}
        title="Eliminar Usuario"
        message={`¿Deseas eliminar a ${
          usuarioSeleccionado?.nombre || "este usuario"
        }? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar usuario"
        onConfirm={confirmarEliminacion}
        onCancel={cerrarModal}
      />
    </section>
  );
};
