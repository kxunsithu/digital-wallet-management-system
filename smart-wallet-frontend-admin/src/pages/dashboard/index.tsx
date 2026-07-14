import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Banknote, LayoutDashboard, Users, Wallet as WalletIcon } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import MainLayout from "@/components/layouts/MainLayout";
import { useEffect, useState } from "react";
import { getAdminWallet } from "@/services/systemWallet.service";

type AdminWallet = {
  id?: number | string;
  user_id?: number | string;
  wallet_number?: string;
  balance?: number | string;
  currency?: string;
  status?: string;
};

const DashboardPage = () => {
  const navigate = useNavigate();

  const [systemWallet, setSystemWallet] = useState<AdminWallet | null>(null);
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
        const wallets = Array.isArray(walletPayload?.data)
          ? walletPayload.data
          : Array.isArray(walletPayload)
            ? walletPayload
            : Array.isArray(res?.data?.data)
              ? res.data.data
              : [];

        const matchedWallet = Array.isArray(wallets) && wallets.length > 0
          ? wallets.find((item: AdminWallet) => Number(item.user_id) === Number(adminId)) ?? wallets[0]
          : null;

        setSystemWallet(matchedWallet ?? null);
      } catch {
        setSystemWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };

    void fetchSystemWallet();
  }, []);

  const formatBalance = (value?: number | string) => {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="h-5 w-5" />
                System Wallet
              </CardTitle>
              <CardDescription>Current system and admin wallet summary</CardDescription>
            </CardHeader>
            <CardContent>
              {walletLoading ? (
                <div className="text-sm text-slate-500">Loading wallet...</div>
              ) : systemWallet ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {systemWallet.wallet_number ?? "—"}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      {systemWallet.status ?? "active"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Available balance</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-900">
                      {formatBalance(systemWallet.balance)} {systemWallet.currency ?? "MMK"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => navigate("/system-wallet")}>
                      Go to system wallet
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/wallets")}>
                      Manage wallets
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">System wallet not found.</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Admin Overview
                </CardTitle>
                <CardDescription>Secure access has been completed successfully.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">The login flow is now connected to the backend OTP and PIN endpoints. You can manage wallets, transfers, and agent operations from here.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/system-wallet")}>
                  <Banknote className="mr-2 h-4 w-4" />
                  Transfer to agent manager
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/wallets")}>
                  <WalletIcon className="mr-2 h-4 w-4" />
                  View all wallets
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/agents")}>
                  <Users className="mr-2 h-4 w-4" />
                  Review agents
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
