import { useEffect, useState } from "react";
import { toast } from "sonner";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCookie } from "@/lib/cookies";
import { adminTransferToAgentManager, getAdminWallet, getAgentManagers } from "@/services/systemWallet.service";

type AdminUserCookie = {
  id?: number | string;
  name?: string;
  phone?: string;
  role?: string;
};

type WalletRecord = {
  id?: number;
  user_id?: number | string;
  wallet_number?: string;
  balance?: number | string;
  currency?: string;
  status?: string;
};

type AgentManagerOption = {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  phone_number?: string;
};

const SystemWalletPage = () => {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agentManagers, setAgentManagers] = useState<AgentManagerOption[]>([]);
  const [receiverUserId, setReceiverUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getAdminUser = () => {
    try {
      const cookieValue = getCookie("admin_user");
      if (!cookieValue) return null;
      return JSON.parse(cookieValue) as AdminUserCookie;
    } catch {
      return null;
    }
  };

  const loadWallet = async () => {
    const adminUser = getAdminUser();
    const adminId = adminUser?.id;

    if (!adminId) {
      setError("Admin session not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [walletResponse, managersResponse] = await Promise.all([
        getAdminWallet(adminId),
        getAgentManagers(),
      ]);

      const walletList = walletResponse.data?.data?.data ?? walletResponse.data?.data ?? [];
      const matchedWallet = Array.isArray(walletList)
        ? walletList.find((item: WalletRecord) => Number(item.user_id) === Number(adminId))
        : null;

      const managersList = managersResponse.data?.data?.data ?? managersResponse.data?.data ?? [];
      setAgentManagers(Array.isArray(managersList) ? managersList : []);

      if (matchedWallet) {
        setWallet(matchedWallet);
        setError("");
      } else {
        setWallet(null);
        setError("No wallet is linked to this admin account yet.");
      }
    } catch (err) {
      setWallet(null);
      setError(err instanceof Error ? err.message : "Unable to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

  const handleTransfer = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!receiverUserId) {
      toast.error("Please select an agent manager.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (!pin || pin.length !== 4) {
      toast.error("PIN must be 4 digits.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await adminTransferToAgentManager({
        amount: Number(amount),
        receiver_user_id: receiverUserId,
        pin,
        description: description || undefined,
      });

      toast.success(response?.data?.message || "Transfer completed.");
      setReceiverUserId("");
      setAmount("");
      setPin("");
      setDescription("");
      await loadWallet();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatBalance = (value?: number | string) => {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  return (
    <MainLayout title="System Wallet">
      <div className="space-y-6">
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Admin Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading wallet details...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : wallet ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Wallet Number</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {wallet.wallet_number ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Balance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatBalance(wallet.balance)} {wallet.currency ?? "MMK"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {wallet.status ?? "active"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Linked Admin ID</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {wallet.user_id ?? "—"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No wallet found for the current admin.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Transfer to Agent Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleTransfer}>
              <div className="space-y-2">
                <Label htmlFor="receiver">Agent Manager</Label>
                <select
                  id="receiver"
                  value={receiverUserId}
                  onChange={(event) => setReceiverUserId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">Select an agent manager</option>
                  {agentManagers.map((manager) => {
                    const managerId = manager.user_id ?? manager.id;
                    const label = manager.name || `Agent Manager ${managerId}`;
                    return (
                      <option key={String(managerId)} value={String(managerId)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100000"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="****"
                    value={pin}
                    onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional note"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                {submitting ? "Processing..." : "Send Money"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SystemWalletPage;
