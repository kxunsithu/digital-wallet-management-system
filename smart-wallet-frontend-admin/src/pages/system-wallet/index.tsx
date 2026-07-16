import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { Camera, QrCode, ScanLine } from "lucide-react";
import QrScannerDialog from "@/components/qr/QrScannerDialog";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCookie } from "@/lib/cookies";
import {
  adminTransferToAgentManager,
  getAdminWallet,
  getMyQrCode,
  lookupQrCode,
} from "@/services/systemWallet.service";

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

// AgentManagerOption removed — previously used for a select that's been removed

type QrCodeRecord = {
  id?: number | string;
  qr_code_value?: string;
  qr_payload?: string;
  user?: {
    id?: number | string;
    full_name?: string;
    phone_number?: string;
    role?: string;
  };
  wallet?: {
    wallet_number?: string;
    currency?: string;
    status?: string;
  };
};

const SystemWalletPage = () => {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [myQrCode, setMyQrCode] = useState<QrCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // agentManagers removed — manual receiver will use phone input only
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
      const [walletResponse, qrResponse] = await Promise.all([
        getAdminWallet(adminId),
        getMyQrCode().catch(() => null),
      ]);

      const walletList = walletResponse.data?.data?.data ?? walletResponse.data?.data ?? [];
      const matchedWallet = Array.isArray(walletList)
        ? walletList.find((item: WalletRecord) => Number(item.user_id) === Number(adminId))
        : null;

      setMyQrCode(qrResponse?.data?.data ?? null);

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

      if (qrData?.user?.role !== "agent_manager") {
        toast.error("This QR code does not belong to an agent manager.");
        setSelectedQr(null);
        return;
      }

      setSelectedQr(qrData);
      setQrLookupValue(lookupValue);
      toast.success("Agent manager QR code recognized.");
    } catch (err: any) {
      setSelectedQr(null);
      toast.error(err?.response?.data?.message || "QR code lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleQrLookup = async () => {
    await resolveQrLookup(qrLookupValue);
  };

  const handleScannedQr = (value: string) => {
    void resolveQrLookup(value);
  };

  const clearQrSelection = () => {
    setSelectedQr(null);
    setQrLookupValue("");
  };

  const handleTransfer = async (event: React.FormEvent) => {
    event.preventDefault();

    const usingQr = transferMode === "qr";

    if (usingQr) {
      if (!selectedQr?.id) {
        toast.error("Please scan or look up a valid agent manager QR code first.");
        return;
      }
    } else if (!receiverUserId && !receiverPhone) {
      toast.error("Please select an agent manager or enter a receiver phone number.");
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
        receiver_user_id: usingQr ? undefined : receiverUserId || undefined,
        receiver_phone: usingQr ? undefined : receiverPhone || undefined,
        qr_id: usingQr ? selectedQr?.id : undefined,
        pin,
        description: description || undefined,
      });

      toast.success(response?.data?.message || "Transfer completed.");
      setReceiverUserId("");
      setReceiverPhone("");
      setAmount("");
      setPin("");
      setDescription("");
      clearQrSelection();
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
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <QrCode className="h-5 w-5 text-blue-600" />
              Receive Money via QR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading QR code...</p>
            ) : myQrCode?.qr_payload ? (
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <QRCode value={myQrCode.qr_payload} size={180} />
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    Agent managers can scan this QR code to send money to the system wallet
                    using the <span className="font-medium">manager → admin</span> transfer flow.
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">QR value:</span>{" "}
                    <span className="font-mono text-xs">{myQrCode.qr_code_value}</span>
                  </p>
                  {myQrCode.wallet?.wallet_number && (
                    <p>
                      <span className="font-medium text-slate-800">Wallet:</span>{" "}
                      {myQrCode.wallet.wallet_number}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                QR code is not available yet. Complete PIN setup to generate one automatically.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Transfer to Agent Manager
            </CardTitle>
            <p className="text-sm text-slate-500">
              Send money to an agent manager using phone number or QR code lookup.
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
                      clearQrSelection();
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
                      setReceiverPhone("");
                    }}
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Scan QR
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  {transferMode === "manual"
                    ? "Enter a receiver phone number to send money directly."
                    : "Scan or paste the agent manager QR code to look up recipient details."}
                </p>
              </div>

              {transferMode === "manual" ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiverPhone">Receiver Phone Number</Label>
                    <Input
                      id="receiverPhone"
                      type="tel"
                      placeholder="09xxxxxxxxx"
                      value={receiverPhone}
                      onChange={(event) => setReceiverPhone(event.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Use the agent manager phone number or admin phone if you want to send money to the system wallet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    <Label htmlFor="qrLookup">Agent Manager QR Code</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="qrLookup"
                        placeholder="Paste scanned QR value or SW-XXXXXXXXXXXX"
                        value={qrLookupValue}
                        onChange={(event) => setQrLookupValue(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={lookupLoading}
                        onClick={() => void handleQrLookup()}
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
                      <p className="font-semibold">
                        {selectedQr.user?.full_name || "Agent Manager"}
                      </p>
                      <p>{selectedQr.user?.phone_number || "—"}</p>
                      <p className="font-mono text-xs break-all">{selectedQr.qr_code_value}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 h-auto px-0 text-emerald-800"
                        onClick={clearQrSelection}
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

        <QrScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleScannedQr}
          title="Scan Agent Manager QR"
          description="Align the agent manager QR code inside the frame."
        />
      </div>
    </MainLayout>
  );
};

export default SystemWalletPage;
