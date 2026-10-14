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
import { useAuth } from "../../../context/auth/useAuth";
import { useToast } from "../../../context/toast/useToast";
import {
  obtenerUsuariosInactivosAdministrativos,
  reactivarUsuarioAdministrativo,
} from "../../../services/adminUsuariosService";
import { matchesSearch } from "../../../utils/search";

export const AdminUsuarios = () => {
  const { usuarios, eliminarUsuario, cargando, actualizando, errorCarga, recargarUsuarios } = useUsuarios();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [verInactivos, setVerInactivos] = useState(false);
  const [inactivos, setInactivos] = useState([]);
  const [cargandoInactivos, setCargandoInactivos] = useState(false);
  const [errorInactivos, setErrorInactivos] = useState("");
  const [usuarioDesactivar, setUsuarioDesactivar] = useState(null);
  const [usuarioReactivar, setUsuarioReactivar] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const listaVisible = verInactivos ? inactivos : usuarios;
  const cargandoVista = verInactivos ? cargandoInactivos : cargando;
  const errorVista = verInactivos ? errorInactivos : errorCarga;
  const bloqueado = procesando || cargando || actualizando || cargandoInactivos;

  const usuariosFiltrados = useMemo(() => (verInactivos ? inactivos : usuarios).filter((usuario) => {
    const coincideBusqueda = matchesSearch(usuario, ["nombre", "correo", "boleta"], busqueda);
    const coincideRol = filtroRol === "todos" ||
      normalizeRole(usuario.rol) === normalizeRole(filtroRol);
    return coincideBusqueda && coincideRol;
  }), [verInactivos, inactivos, usuarios, busqueda, filtroRol]);

  const cargarInactivos = async () => {
    setCargandoInactivos(true);
    setErrorInactivos("");
    try {
      const resultado = await obtenerUsuariosInactivosAdministrativos();
      setInactivos(resultado);
    } catch (fallo) {
      setInactivos([]);
      setErrorInactivos(fallo.message || "No se pudieron cargar las cuentas inactivas.");
      throw fallo;
    } finally {
      setCargandoInactivos(false);
    }
  };

  const cambiarVista = async (inactivo) => {
    if (bloqueado) return;
    setVerInactivos(inactivo);
    setBusqueda("");
    if (inactivo) {
      try { await cargarInactivos(); }
      catch (fallo) { error(fallo.message || "No se pudieron cargar las cuentas inactivas."); }
    }
  };

  const actualizarListado = async () => {
    if (bloqueado) return;
    try {
      if (verInactivos) await cargarInactivos();
      else await recargarUsuarios();
    } catch (fallo) {
      error(fallo.message || "No se pudo cargar el listado.");
    }
  };

  const confirmarDesactivacion = async () => {
    if (!usuarioDesactivar || procesando) return;
    setProcesando(true);
    try {
      await eliminarUsuario(usuarioDesactivar.id);
      setUsuarioDesactivar(null);
      success("Usuario desactivado correctamente. Puedes recuperarlo en Cuentas inactivas.");
    } catch (fallo) {
      error(fallo.message || "No se pudo desactivar el usuario.");
    } finally {
      setProcesando(false);
    }
  };

  const confirmarReactivacion = async () => {
    if (!usuarioReactivar || procesando) return;
    setProcesando(true);
    try {
      await reactivarUsuarioAdministrativo(usuarioReactivar.id);
      setUsuarioReactivar(null);
      success("Cuenta reactivada. Conserva su ID y sus relaciones anteriores.");
      try {
        await Promise.all([recargarUsuarios(), cargarInactivos()]);
      } catch (fallo) {
        error(fallo.message || "Cuenta reactivada, pero falló la actualización de las listas.");
      }
    } catch (fallo) {
      error(fallo.message || "No se pudo reactivar el usuario.");
    } finally {
      setProcesando(false);
    }
  };

  const seleccionarDesactivacion = (usuario) => {
    if (String(usuario.id) === String(user?.id)) {
      error("No puedes desactivar tu propia cuenta desde esta pantalla.");
      return;
    }
    setUsuarioDesactivar(usuario);
  };

  return (
    <section className="space-y-6">
      <PageHeader title="Administración de usuarios"
        description="Consulta y administra cuentas activas e inactivas registradas en MySQL."
        actionLabel="Nuevo usuario" actionTo={ROUTES.ADMIN_USUARIOS_NUEVO} actionIcon={Plus} />
      <UsuariosFilters busqueda={busqueda} setBusqueda={setBusqueda}
        filtroRol={filtroRol} setFiltroRol={setFiltroRol} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap gap-2" role="group" aria-label="Estado de las cuentas">
          <button type="button" onClick={() => cambiarVista(false)} disabled={bloqueado}
            aria-pressed={!verInactivos}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${!verInactivos
              ? "bg-[#6F1D46] text-white" : "bg-white text-slate-800 dark:bg-slate-700 dark:text-white"}`}>
            Activos
          </button>
          <button type="button" onClick={() => cambiarVista(true)} disabled={bloqueado}
            aria-pressed={verInactivos}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${verInactivos
              ? "bg-[#6F1D46] text-white" : "bg-white text-slate-800 dark:bg-slate-700 dark:text-white"}`}>
            Cuentas inactivas
          </button>
        </div>
        <button type="button" onClick={actualizarListado} disabled={bloqueado}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700">
          {cargandoVista ? "Cargando…" : "Actualizar listado"}
        </button>
        {!cargandoVista && !errorVista && (
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {listaVisible.length} {verInactivos ? "usuarios inactivos" : "usuarios activos"}
          </span>
        )}
      </div>
      {errorVista && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">{errorVista}</p>}
      {cargandoVista ? <p role="status">Cargando usuarios desde MySQL…</p> : !errorVista && (
        <>
          <div className="space-y-4 xl:hidden">
            {usuariosFiltrados.length === 0 ? (
              <EmptyState title="No se encontraron usuarios" message="Prueba otra búsqueda o cambia el filtro de rol." />
            ) : usuariosFiltrados.map((usuario) => (
              <UsuarioCard key={usuario.id} usuario={usuario} inactivo={verInactivos}
                onDelete={seleccionarDesactivacion} onRestore={setUsuarioReactivar} />
            ))}
          </div>
          <UsuariosTable usuarios={usuariosFiltrados} inactivo={verInactivos}
            onDelete={seleccionarDesactivacion} onRestore={setUsuarioReactivar} />
        </>
      )}
      <ConfirmModal isOpen={Boolean(usuarioDesactivar)} title="Desactivar usuario"
        message={`¿Desactivar a ${usuarioDesactivar?.nombre || "este usuario"}? La cuenta dejará de estar activa, pero conservará sus relaciones académicas.`}
        confirmLabel={procesando ? "Desactivando…" : "Desactivar usuario"}
        onConfirm={confirmarDesactivacion}
        onCancel={() => { if (!procesando) setUsuarioDesactivar(null); }} />
      <ConfirmModal isOpen={Boolean(usuarioReactivar)} title="Reactivar usuario"
        message={`¿Reactivar a ${usuarioReactivar?.nombre || "este usuario"} con su mismo ID y credenciales anteriores?`}
        confirmLabel={procesando ? "Reactivando…" : "Reactivar cuenta"}
        onConfirm={confirmarReactivacion}
        onCancel={() => { if (!procesando) setUsuarioReactivar(null); }} />
    </section>
  );
};
