import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { clearAdminSession } from "@/lib/cookies";
import MainLayout from "@/components/layouts/MainLayout";
import { useEffect, useState } from "react";
import { getCookie } from "@/lib/cookies";
import { logout as logoutService } from "@/services/auth.service";
import { getAdminWallet } from "@/services/systemWallet.service";

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutService();
    } catch {
      // ignore backend errors and clear the client session anyway
    }

    clearAdminSession();
    navigate("/login");
  };

  const [systemWallet, setSystemWallet] = useState<any | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    const fetchSystemWallet = async () => {
      try {
        const adminCookie = getCookie("admin_user");
        let adminId: number | null = null;

        if (adminCookie) {
          try {
            const adminData = JSON.parse(adminCookie);
            adminId = adminData?.id ?? adminData?.user_id ?? adminData?.user?.id ?? null;
          } catch {
            adminId = null;
          }
        }

        if (!adminId) {
          setSystemWallet(null);
          return;
        }

        const res = await getAdminWallet(adminId);
        const walletPayload = res?.data?.data;
        const wallets = Array.isArray(walletPayload)
          ? walletPayload
          : Array.isArray(walletPayload?.data)
            ? walletPayload.data
            : [];

        const adminWallet = Array.isArray(wallets) && wallets.length > 0 ? wallets[0] : null;
        setSystemWallet(adminWallet ?? null);
      } catch {
        setSystemWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };

    void fetchSystemWallet();
  }, []);

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Dashboard</h1>
          </div>
          <Button variant="outline" onClick={() => void handleLogout()}>
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
          <Card>
            <CardHeader>
              <CardTitle>System Wallet</CardTitle>
              <CardDescription>Current system/admin wallet summary</CardDescription>
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <div className="text-sm text-slate-500">Loading wallet...</div>
              ) : systemWallet ? (
                <div className="space-y-2 text-sm">
                  <div>Wallet Number: <strong>{systemWallet.wallet_number}</strong></div>
                  <div>Balance: <strong>{systemWallet.balance} {systemWallet.currency}</strong></div>
                  <div>Status: <strong>{systemWallet.status}</strong></div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">System wallet not found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
