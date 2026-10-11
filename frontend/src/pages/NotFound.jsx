import { ErrorState } from "../components/common/ErrorState";
import { ROUTES } from "../constants/routes";

export const NotFound = () => {
  return (
    <ErrorState
      code="404"
      title="Página no encontrada"
      description="La página que intentas visitar no existe, fue movida o la dirección está escrita incorrectamente."
      primaryLabel="Volver al inicio"
      primaryTo={ROUTES.HOME}
    />
  );
};
