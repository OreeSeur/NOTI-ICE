import { ErrorState } from "../components/common/ErrorState";
import { ROUTES } from "../constants/routes";

export const NoAutorizado = () => {
  return (
    <ErrorState
      code="403"
      title="Acceso no autorizado"
      description="Tu cuenta no tiene permisos para entrar a esta sección. Si consideras que deberías tener acceso, solicita la revisión de tu rol o permisos al administrador del portal."
      primaryLabel="Volver al inicio"
      primaryTo={ROUTES.HOME}
    />
  );
};
