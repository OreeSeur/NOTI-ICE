import { Navigate, useLocation } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/auth/useAuth";

export const PrivateRoute = ({
  children,
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

  return children;
};
