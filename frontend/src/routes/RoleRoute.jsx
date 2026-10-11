import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/auth/useAuth";
import { hasRole } from "../utils/permissions";

export const RoleRoute = ({
  children,
  roles = [],
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!hasRole(user, roles)) {
    return (
      <Navigate
        to={ROUTES.NO_AUTORIZADO}
        replace
      />
    );
  }

  return children;
};
