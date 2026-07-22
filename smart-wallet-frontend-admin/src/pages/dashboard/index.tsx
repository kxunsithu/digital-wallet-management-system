import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  LayoutDashboard,
  Users,
  Wallet as WalletIcon,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  Shield,
  Activity,
  Hash,
  CircleDollarSign
} from "lucide-react";
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

  const getSessionUserName = () => {
    try {
      const adminCookie = getCookie("admin_user");
      if (!adminCookie) return "User";
      const adminData = JSON.parse(adminCookie);
      return adminData?.name ?? adminData?.full_name ?? "Administrator";
    } catch {
      return "User";
    }
  };

  const userId = getSessionUser();
  const userName = getSessionUserName();
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

  // Agent Manager Dashboard View
  if (isAgentManager) {
    return (
      <RoleAwareLayout title="Dashboard">
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726] text-[#10110E]">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome back, {userName}!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your agents, distribute float balances, and review live transfer operations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#D5E726] bg-[#D5E726] px-3 py-1.5 text-xs font-bold text-[#10110E]">
                Manager Workspace
              </span>
              <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Agent Manager
              </span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
            {/* Left Column: Wallet details */}
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-none">
                <div className="border-b border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#D5E726] text-[#10110E]">
                        <WalletIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Wallet Overview</h3>
                        <p className="text-xs text-muted-foreground">Real-time float status</p>
                      </div>
                    </div>
                    {wallet && (
                      <span className="rounded-full border border-[#52C41A] bg-white px-3 py-0.5 text-xs font-bold capitalize text-[#52C41A]">
                        {wallet.status ?? "active"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  {walletLoading ? (
                    <div className="flex items-center justify-center gap-3 py-12">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#10110E]" />
                      <p className="text-sm text-muted-foreground">Loading wallet details…</p>
                    </div>
                  ) : wallet ? (
                    <div className="space-y-6">
                      {/* Balance Highlight Box */}
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D5E726] bg-[#D5E726] p-8 text-center text-[#10110E]">
                        <span className="mb-2 text-xs font-semibold tracking-wider uppercase opacity-80">
                          Available Float Balance
                        </span>
                        <span className="text-4xl font-extrabold md:text-5xl">
                          {formatBalance(realtimeBalance !== null ? realtimeBalance : wallet.balance)}
                          <span className="ml-2 text-xl font-semibold">MMK</span>
                        </span>
                        {realtimeBalance !== null && (
                          <p className="mt-3 inline-flex items-center text-xs font-medium opacity-75">
                            <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                            Live balance sync active
                          </p>
                        )}
                      </div>

                      {/* Detail Info Row */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-xl border border-border bg-slate-50/50 p-4">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#10110E] text-[#D5E726]">
                            <Hash className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Wallet Number
                            </p>
                            <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">
                              {wallet.wallet_number ?? "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-border bg-slate-50/50 p-4">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#10110E] text-[#D5E726]">
                            <CircleDollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Currency
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-foreground">MMK</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button
                          onClick={() => navigate("/transfer")}
                          className="h-11 bg-[#D5E726] font-semibold text-[#10110E] hover:bg-[#D5E726]/90 shadow-none border-0"
                        >
                          Transfer to Agent
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate("/agent-manager-wallet")}
                          className="h-11 border-border bg-white text-foreground hover:bg-slate-50 hover:text-foreground shadow-none"
                        >
                          My QR &amp; Wallet
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Wallet account not found.
                    </div>
                  )}
                </div>
              </div>

              {/* Status Stats Summary */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border bg-white shadow-none hover:border-[#D5E726]/50 transition-all">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agents Managed</p>
                      <h3 className="text-3xl font-bold mt-1 text-foreground">{agentCount ?? "—"}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Active retail outlets</p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726]/10 text-[#10110E]">
                      <Users className="h-6 w-6 text-[#10110E]" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-white shadow-none hover:border-[#D5E726]/50 transition-all">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Float Ledger</p>
                      <h3 className="text-sm font-semibold mt-2 text-foreground">Verified Transfers</h3>
                      <p className="text-xs text-muted-foreground mt-1">Status audited in real-time</p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726]/10 text-[#10110E]">
                      <TrendingUp className="h-6 w-6 text-[#10110E]" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column: Actions & Info */}
            <div className="space-y-6">
              <Card className="border-border bg-white shadow-none">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <LayoutDashboard className="h-4 w-4" />
                    Overview
                  </CardTitle>
                  <CardDescription>System control center</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Use this dashboard to onboard new retail agents, view performance logs, and perform float distribution transfers. All operations are signed via your security PIN.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-white shadow-none">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <Activity className="h-4 w-4" />
                    Workspace Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  <Button
                    className="w-full justify-between h-12 font-medium border-border hover:bg-slate-50"
                    variant="outline"
                    onClick={() => navigate("/agents/create")}
                  >
                    <span className="flex items-center">
                      <Users className="mr-2.5 h-4 w-4 text-slate-500" />
                      Create New Agent
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button
                    className="w-full justify-between h-12 font-medium border-border hover:bg-slate-50"
                    variant="outline"
                    onClick={() => navigate("/agents")}
                  >
                    <span className="flex items-center">
                      <Users className="mr-2.5 h-4 w-4 text-slate-500" />
                      View Onboarded Agents
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button
                    className="w-full justify-between h-12 font-medium border-border hover:bg-slate-50"
                    variant="outline"
                    onClick={() => navigate("/transfer")}
                  >
                    <span className="flex items-center">
                      <Banknote className="mr-2.5 h-4 w-4 text-slate-500" />
                      Float Money Transfer
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </RoleAwareLayout>
    );
  }

  // System Admin Dashboard View
  return (
    <RoleAwareLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726] text-[#10110E]">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome back, {userName}!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage system reserves, distribute float balances to managers, and audit global wallet statuses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#D5E726] bg-[#D5E726] px-3 py-1.5 text-xs font-bold text-[#10110E]">
              Treasury Console
            </span>
            <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              System Admin
            </span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          {/* Left Column: Wallet details */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-none">
              <div className="border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#D5E726] text-[#10110E]">
                      <WalletIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">System Wallet Overview</h3>
                      <p className="text-xs text-muted-foreground">Treasury reserve status</p>
                    </div>
                  </div>
                  {wallet && (
                    <span className="rounded-full border border-[#52C41A] bg-white px-3 py-0.5 text-xs font-bold capitalize text-[#52C41A]">
                      {wallet.status ?? "active"}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8">
                {walletLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#10110E]" />
                    <p className="text-sm text-muted-foreground">Loading system reserves…</p>
                  </div>
                ) : wallet ? (
                  <div className="space-y-6">
                    {/* Balance Highlight Box */}
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D5E726] bg-[#D5E726] p-8 text-center text-[#10110E]">
                      <span className="mb-2 text-xs font-semibold tracking-wider uppercase opacity-80">
                        Total Treasury Balance
                      </span>
                      <span className="text-4xl font-extrabold md:text-5xl">
                        {formatBalance(realtimeBalance !== null ? realtimeBalance : wallet.balance)}
                        <span className="ml-2 text-xl font-semibold">MMK</span>
                      </span>
                      {realtimeBalance !== null && (
                        <p className="mt-3 inline-flex items-center text-xs font-medium opacity-75">
                          <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                          Live balance sync active
                        </p>
                      )}
                    </div>

                    {/* Detail Info Row */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-3 rounded-xl border border-border bg-slate-50/50 p-4">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#10110E] text-[#D5E726]">
                          <Hash className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Wallet Number
                          </p>
                          <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">
                            {wallet.wallet_number ?? "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-xl border border-border bg-slate-50/50 p-4">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#10110E] text-[#D5E726]">
                          <CircleDollarSign className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Currency
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">MMK</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        onClick={() => navigate("/system-wallet")}
                        className="h-11 bg-[#D5E726] font-semibold text-[#10110E] hover:bg-[#D5E726]/90 shadow-none border-0"
                      >
                        Manage Reserves
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/wallets")}
                        className="h-11 border-border bg-white text-foreground hover:bg-slate-50 hover:text-foreground shadow-none"
                      >
                        Inspect Directory
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    System wallet reserves not found.
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border bg-white shadow-none hover:border-[#D5E726]/50 transition-all">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Audits</p>
                    <h3 className="text-sm font-semibold mt-2 text-foreground">Global Ledger Summary</h3>
                    <p className="text-xs text-muted-foreground mt-1">Compliant ledger records</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726]/10 text-[#10110E]">
                    <Shield className="h-6 w-6 text-[#10110E]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-white shadow-none hover:border-[#D5E726]/50 transition-all">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engine Status</p>
                    <h3 className="text-sm font-semibold mt-2 text-[#52C41A] flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#52C41A] opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#52C41A]"></span>
                      </span>
                      Operational
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">Transaction core up & running</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726]/10 text-[#10110E]">
                    <Activity className="h-6 w-6 text-[#10110E]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Actions & Info */}
          <div className="space-y-6">
            <Card className="border-border bg-white shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Overview
                </CardTitle>
                <CardDescription>Secure management console</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed text-slate-600">
                  The treasury and operations console provides direct tools to oversee wallet distribution hierarchies, assign float levels, and manage core registry parameters.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-white shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Activity className="h-4 w-4" />
                  Administrative Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                <Button
                  className="w-full justify-between h-12 font-medium border-border hover:bg-slate-50"
                  variant="outline"
                  onClick={() => navigate("/system-wallet")}
                >
                  <span className="flex items-center">
                    <Banknote className="mr-2.5 h-4 w-4 text-slate-500" />
                    Treasury Reserve Transfer
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Button>
                <Button
                  className="w-full justify-between h-12 font-medium border-border hover:bg-slate-50"
                  variant="outline"
                  onClick={() => navigate("/wallets")}
                >
                  <span className="flex items-center">
                    <WalletIcon className="mr-2.5 h-4 w-4 text-slate-500" />
                    Inspect Audited Wallet Logs
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Button>
                <Button
                  className="w-full justify-between h-12 font-medium border-border hover:bg-slate-50"
                  variant="outline"
                  onClick={() => navigate("/agents")}
                >
                  <span className="flex items-center">
                    <Users className="mr-2.5 h-4 w-4 text-slate-500" />
                    Onboarded Agent List
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
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
