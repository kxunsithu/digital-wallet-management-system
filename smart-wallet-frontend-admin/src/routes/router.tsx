import { createBrowserRouter, Navigate } from "react-router-dom";
import { getCookie } from "@/lib/cookies";
import LoginPage from "../pages/auth/login";
import DashboardPage from "../pages/dashboard";
import ProtectedRoute from "./ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: getCookie("admin_access_token") ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Navigate to="/login" replace />
    ),
  },
]);

export default router;
