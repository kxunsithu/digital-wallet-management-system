import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getCookie } from "@/lib/cookies";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = getCookie("admin_access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
