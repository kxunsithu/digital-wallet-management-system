import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Banknote, LayoutDashboard, Users, Wallet as WalletIcon, RefreshCw } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import RoleAwareLayout from "@/components/layouts/RoleAwareLayout";
import { useEffect, useState } from "react";
import { getAdminWallet } from "@/services/systemWallet.service";
import { getUserWallet } from "@/services/transfer.service";
import { getAgents } from "@/services/agent.service";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";

type WalletRecord = {
  id?: number | string;
  user_id?: number | string;
  wallet_number?: string;
  balance?: number | string;
  
  status?: string;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const userRole = getCookie("user_role") ?? "";
  const isAgentManager = userRole === "agent_manager";

  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [agentCount, setAgentCount] = useState<number | null>(null);

  const getSessionUser = () => {
    try {
      const adminCookie = getCookie("admin_user");
      if (!adminCookie) return null;
      const adminData = JSON.parse(adminCookie);
      return adminData?.id ?? adminData?.user_id ?? adminData?.user?.id ?? null;
    } catch {
      return null;
    }
  };

  const userId = getSessionUser();
  const { balance: realtimeBalance } = useRealTimeBalance(userId, true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminCookie = getCookie("admin_user");
        let fetchUserId: number | null = null;

        if (adminCookie) {
          try {
            const adminData = JSON.parse(adminCookie);
            fetchUserId = adminData?.id ?? adminData?.user_id ?? adminData?.user?.id ?? null;
          } catch {
            fetchUserId = null;
          }
        }

        if (!fetchUserId) {
          setWallet(null);
          return;
        }

        if (isAgentManager) {
          const [walletRes, agentsRes] = await Promise.all([
            getUserWallet(fetchUserId),
            getAgents({ per_page: 1 }),
          ]);

          const walletPayload = walletRes?.data?.data;
          const wallets = Array.isArray(walletPayload?.data)
            ? walletPayload.data
            : Array.isArray(walletPayload)
              ? walletPayload
              : [];

          const matchedWallet = Array.isArray(wallets)
            ? wallets.find((item: WalletRecord) => Number(item.user_id) === Number(fetchUserId)) ?? wallets[0]
            : null;

          setWallet(matchedWallet ?? null);
          setAgentCount(agentsRes?.data?.meta?.total ?? agentsRes?.data?.data?.length ?? 0);
        } else {
          const res = await getAdminWallet(fetchUserId);
          const walletPayload = res?.data?.data;
          const wallets = Array.isArray(walletPayload?.data)
            ? walletPayload.data
            : Array.isArray(walletPayload)
              ? walletPayload
              : Array.isArray(res?.data?.data)
                ? res.data.data
                : [];

          const matchedWallet = Array.isArray(wallets) && wallets.length > 0
            ? wallets.find((item: WalletRecord) => Number(item.user_id) === Number(fetchUserId)) ?? wallets[0]
            : null;

          setWallet(matchedWallet ?? null);
        }
      } catch {
        setWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };

    void fetchData();
  }, [isAgentManager]);

  const formatBalance = (value?: number | string) => {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  if (isAgentManager) {
    return (
      <RoleAwareLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WalletIcon className="h-5 w-5" />
                  My Wallet
                </CardTitle>
                <CardDescription>Your agent manager wallet balance</CardDescription>
              </CardHeader>
              <CardContent>
                {walletLoading ? (
                  <div className="text-sm text-slate-500">Loading wallet...</div>
                ) : wallet ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {wallet.wallet_number ?? "—"}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        {wallet.status ?? "active"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Available balance</p>
                      <p className="mt-1 text-3xl font-semibold text-slate-900">
                        {formatBalance(realtimeBalance !== null ? realtimeBalance : wallet.balance)} MMK
                      </p>
                      {realtimeBalance !== null && (
                        <p className="mt-2 text-xs text-slate-400">
                          <RefreshCw className="inline h-3 w-3 mr-1 animate-spin" />
                          Real-time updates enabled
                        </p>
                      )}
                    </div>
                    <Button onClick={() => navigate("/transfer")}>
                      Transfer to agent
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Wallet not found.</div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    Overview
                  </CardTitle>
                  <CardDescription>Manage the agents you created and send them float.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    You currently manage{" "}
                    <span className="font-semibold text-slate-900">{agentCount ?? "—"}</span> agent
                    {(agentCount ?? 0) === 1 ? "" : "s"}.
                  </p>
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
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/agents/create")}>
                    <Users className="mr-2 h-4 w-4" />
                    Create agent
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/agents")}>
                    <Users className="mr-2 h-4 w-4" />
                    View my agents
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/transfer")}>
                    <Banknote className="mr-2 h-4 w-4" />
                    Transfer money
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </RoleAwareLayout>
    );
  }

  return (
    <RoleAwareLayout title="Dashboard">
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
              ) : wallet ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {wallet.wallet_number ?? "—"}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      {wallet.status ?? "active"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Available balance</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-900">
                      {formatBalance(realtimeBalance !== null ? realtimeBalance : wallet.balance)} MMK
                    </p>
                    {realtimeBalance !== null && (
                      <p className="mt-2 text-xs text-slate-400">
                        <RefreshCw className="inline h-3 w-3 mr-1 animate-spin" />
                        Real-time updates enabled
                      </p>
                    )}
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
                <p className="text-sm text-slate-600">
                  The login flow is now connected to the backend OTP and PIN endpoints. You can manage wallets,
                  transfers, and agent operations from here.
                </p>
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
    </RoleAwareLayout>
  );
};

export default DashboardPage;
