import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getCookie } from "@/lib/cookies";

type Props = {
  children: ReactNode;
  /** If provided, only these roles can access this route */
  allowedRoles?: string[];
};

/**
 * Protects a route by checking:
 * 1. Whether a valid access token exists (otherwise → /login)
 * 2. Optionally whether the user's role is in allowedRoles (otherwise → /dashboard)
 */
const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const token = getCookie("admin_access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = getCookie("user_role") ?? "";
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
