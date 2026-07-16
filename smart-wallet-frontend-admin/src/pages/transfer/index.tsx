import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { Camera, ScanLine } from "lucide-react";
import QrScannerDialog from "@/components/qr/QrScannerDialog";
import AgentManagerLayout from "@/components/layouts/AgentManagerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCookie } from "@/lib/cookies";
import { getAgents } from "@/services/agent.service";
import { getUserWallet, managerTransfer } from "@/services/transfer.service";
import { getMyQrCode, lookupQrCode } from "@/services/systemWallet.service";

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

type QrCodeRecord = {
  id?: number | string;
  qr_code_value?: string;
  qr_payload?: string;
  user?: { id?: number | string; full_name?: string; phone_number?: string; role?: string };
  wallet?: { wallet_number?: string; currency?: string; status?: string };
};

const ManagerTransferPage = () => {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [receiverUserId, setReceiverUserId] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [qrLookupValue, setQrLookupValue] = useState("");
  const [selectedQr, setSelectedQr] = useState<QrCodeRecord | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [transferMode, setTransferMode] = useState<"manual" | "qr">("manual");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [myQrCode, setMyQrCode] = useState<QrCodeRecord | null>(null);

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
      // fetch my QR code for receive section
      try {
        const qrResponse = await getMyQrCode().catch(() => null);
        setMyQrCode(qrResponse?.data?.data ?? null);
      } catch {
        setMyQrCode(null);
      }

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

    const usingQr = transferMode === "qr";

    if (usingQr) {
      if (!selectedQr?.id) {
        toast.error("Please scan or look up a valid recipient QR code first.");
        return;
      }
    } else if (!receiverUserId && !receiverPhone) {
      toast.error("Please select an agent or enter a receiver phone number.");
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
        receiver_user_id: usingQr ? undefined : receiverUserId || undefined,
        receiver_phone: usingQr ? undefined : receiverPhone || undefined,
        qr_id: usingQr ? selectedQr?.id : undefined,
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

  const resolveQrLookup = async (value: string) => {
    const lookupValue = value.trim();
    if (!lookupValue) {
      toast.error("Enter or paste a QR code value.");
      return;
    }

    try {
      setLookupLoading(true);
      const response = await lookupQrCode(lookupValue);
      const qrData = response.data?.data as QrCodeRecord;

      // allow transferring to agents (role may be 'agent')
      if (!qrData?.user) {
        toast.error("QR code lookup did not return a valid user.");
        setSelectedQr(null);
        return;
      }

      setSelectedQr(qrData);
      setQrLookupValue(lookupValue);
      toast.success("Recipient QR code recognized.");
    } catch (err: any) {
      setSelectedQr(null);
      toast.error(err?.response?.data?.message || "QR code lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleScannedQr = (value: string) => {
    void resolveQrLookup(value);
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

          {myQrCode ? (
            <Card className="border border-slate-200/70 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Your Receive QR</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="rounded-md bg-white p-4">
                  <QRCode value={String(myQrCode.qr_code_value ?? myQrCode.qr_payload ?? "") || ""} size={150} />
                </div>
                <div className="w-full text-center text-sm text-slate-600">
                  <p>Share this QR with customers to receive payments.</p>
                  <div className="mt-2 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(String(myQrCode.qr_code_value ?? myQrCode.qr_payload ?? ""));
                          toast.success("QR value copied to clipboard");
                        } catch {
                          toast.error("Unable to copy");
                        }
                      }}
                    >
                      Copy QR Value
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold text-slate-900">Send Money</CardTitle>
            <p className="text-sm text-slate-500">
              Choose manual receiver mode for an agent or phone number, or scan a QR code to pay a recipient quickly.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleTransfer}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={transferMode === "manual" ? "default" : "outline"}
                    onClick={() => {
                      setTransferMode("manual");
                      setSelectedQr(null);
                      setQrLookupValue("");
                    }}
                  >
                    Manual Receiver
                  </Button>
                  <Button
                    type="button"
                    variant={transferMode === "qr" ? "default" : "outline"}
                    onClick={() => {
                      setTransferMode("qr");
                      setReceiverUserId("");
                    }}
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scan QR
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  {transferMode === "manual"
                    ? "Use an agent selection or phone number for admin/agent transfers."
                    : "Scan or paste the recipient QR code value to identify the receiver."}
                </p>
              </div>

              {transferMode === "manual" ? (
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiver">Agent</Label>
                    <select
                      id="receiver"
                      value={receiverUserId}
                      onChange={(event) => setReceiverUserId(event.target.value)}
                      className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiverPhone">Receiver Phone</Label>
                    <Input
                      id="receiverPhone"
                      placeholder="09xxxxxxxx or +959xxxxxxxx"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Enter the admin or agent phone number if you are sending outside your created agents.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    <Label htmlFor="qrLookup">Recipient QR Code</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="qrLookup"
                        placeholder="Paste scanned QR value or code"
                        value={qrLookupValue}
                        onChange={(event) => setQrLookupValue(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={lookupLoading}
                        onClick={() => void resolveQrLookup(qrLookupValue)}
                      >
                        {lookupLoading ? "Looking up..." : "Lookup QR"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={lookupLoading}
                        onClick={() => setScannerOpen(true)}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Scan QR
                      </Button>
                    </div>
                  </div>

                  {selectedQr ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="font-semibold">{selectedQr.user?.full_name || "Recipient"}</p>
                      <p>{selectedQr.user?.phone_number || "—"}</p>
                      <p className="font-mono text-xs break-all">{selectedQr.qr_code_value}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-auto px-0 text-emerald-800"
                        onClick={() => {
                          setSelectedQr(null);
                          setQrLookupValue("");
                        }}
                      >
                        Clear selection
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Use Scan QR to open your camera, or paste a scanned value manually.
                    </p>
                  )}
                </div>
              )}

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
      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={(open) => setScannerOpen(open)}
        onScan={(value) => {
          setScannerOpen(false);
          handleScannedQr(value);
        }}
      />
    </AgentManagerLayout>
  );
};

export default ManagerTransferPage;
