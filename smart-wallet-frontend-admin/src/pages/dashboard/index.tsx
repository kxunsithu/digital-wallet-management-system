import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { deleteCookie } from "@/lib/cookies";
import MainLayout from "@/components/layouts/MainLayout";

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    deleteCookie("admin_access_token");
    deleteCookie("admin_user");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
    navigate("/login");
  };

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Admin Overview
              </CardTitle>
              <CardDescription>Secure access has been completed successfully.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">The login flow is now connected to the backend OTP and PIN endpoints. You can expand this page to include wallet, agent, and transfer management views.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
