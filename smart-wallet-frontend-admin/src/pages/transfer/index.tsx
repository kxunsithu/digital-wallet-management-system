import { useEffect, useState } from "react";
import { toast } from "sonner";
import AgentManagerLayout from "@/components/layouts/AgentManagerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCookie } from "@/lib/cookies";
import { getAgents } from "@/services/agent.service";
import { getUserWallet, managerTransfer } from "@/services/transfer.service";

type WalletRecord = {
  id?: number;
  user_id?: number | string;
  wallet_number?: string;
  balance?: number | string;
  currency?: string;
  status?: string;
};

type AgentOption = {
  id?: number | string;
  user_id?: number | string;
  user?: { id?: number | string; full_name?: string; phone_number?: string };
  agent_code?: string;
  shop_name?: string;
};

const ManagerTransferPage = () => {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [receiverUserId, setReceiverUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getSessionUser = () => {
    try {
      const cookieValue = getCookie("admin_user");
      if (!cookieValue) return null;
      return JSON.parse(cookieValue) as { id?: number | string };
    } catch {
      return null;
    }
  };

  const loadData = async () => {
    const sessionUser = getSessionUser();
    const userId = sessionUser?.id;

    if (!userId) {
      setError("Session not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [walletResponse, agentsResponse] = await Promise.all([
        getUserWallet(userId),
        getAgents({ per_page: 100, status: "active" }),
      ]);

      const walletList = walletResponse.data?.data?.data ?? walletResponse.data?.data ?? [];
      const matchedWallet = Array.isArray(walletList)
        ? walletList.find((item: WalletRecord) => Number(item.user_id) === Number(userId))
        : null;

      const agentsList = agentsResponse.data?.data ?? [];
      setAgents(Array.isArray(agentsList) ? agentsList : []);

      if (matchedWallet) {
        setWallet(matchedWallet);
        setError("");
      } else {
        setWallet(null);
        setError("No wallet is linked to this account yet. Complete PIN setup if you have not.");
      }
    } catch (err) {
      setWallet(null);
      setError(err instanceof Error ? err.message : "Unable to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTransfer = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!receiverUserId) {
      toast.error("Please select an agent.");
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
      const response = await managerTransfer({
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
      await loadData();
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
    <AgentManagerLayout title="Transfer Money">
      <div className="space-y-6">
        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">Your Wallet</CardTitle>
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
                  <p className="mt-1 text-lg font-semibold text-slate-900">{wallet.wallet_number ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Balance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatBalance(wallet.balance)} {wallet.currency ?? "MMK"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No wallet found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">Transfer to Your Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleTransfer}>
              <div className="space-y-2">
                <Label htmlFor="receiver">Agent</Label>
                <select
                  id="receiver"
                  value={receiverUserId}
                  onChange={(event) => setReceiverUserId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                >
                  <option value="">Select an agent you created</option>
                  {agents.map((agent) => {
                    const agentUserId = agent.user_id ?? agent.user?.id;
                    const label = `${agent.user?.full_name || "Agent"} (${agent.agent_code || agentUserId})`;
                    return (
                      <option key={String(agentUserId)} value={String(agentUserId)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-slate-500">Only agents you created can receive money from you.</p>
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
    </AgentManagerLayout>
  );
};

export default ManagerTransferPage;
