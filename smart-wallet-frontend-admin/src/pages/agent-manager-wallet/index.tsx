import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
  Camera,
  ScanLine,
  Wallet,
  Hash,
  CircleDollarSign,
  UserCheck,
  ArrowUpRight,
  Phone,
  FileText,
  QrCode,
  Copy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";
import QrScannerDialog from "@/components/qr/QrScannerDialog";
import AgentManagerLayout from "@/components/layouts/AgentManagerLayout";
import TransferReceiptModal from "@/components/common/TransferReceiptModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { getCookie } from "@/lib/cookies";
import { getUserWallet, managerTransfer } from "@/services/transfer.service";
import { getMyQrCode, lookupQrCode } from "@/services/systemWallet.service";

type WalletRecord = {
  id?: number;
  user_id?: number | string;
  wallet_number?: string;
  balance?: number | string;
  
  status?: string;
};

type QrCodeRecord = {
  id?: number | string;
  qr_code_value?: string;
  qr_payload?: string;
  user?: { id?: number | string; full_name?: string; phone_number?: string; role?: string };
  wallet?: { wallet_number?: string;  status?: string };
};

const ManagerTransferPage = () => {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<any>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [autoSaveReceipt, setAutoSaveReceipt] = useState(false);

  const getSessionUser = () => {
    try {
      const cookieValue = getCookie("admin_user");
      if (!cookieValue) return null;
      return JSON.parse(cookieValue) as { id?: number | string };
    } catch {
      return null;
    }
  };

  const sessionUser = getSessionUser();
  const userId = sessionUser?.id;
  const { balance: realtimeBalance, refreshBalance } = useRealTimeBalance(userId, true);

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
      const walletResponse = await getUserWallet(userId);

      const walletList = walletResponse.data?.data?.data ?? walletResponse.data?.data ?? [];
      const matchedWallet = Array.isArray(walletList)
        ? walletList.find((item: WalletRecord) => Number(item.user_id) === Number(userId))
        : null;

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

  const handleTransferClick = (event: React.FormEvent) => {
    event.preventDefault();

    const usingQr = transferMode === "qr";

    if (usingQr) {
      if (!selectedQr?.id) {
        toast.error("Please scan or look up a valid recipient QR code first.");
        return;
      }
    } else if (!receiverPhone) {
      toast.error("Please enter a receiver phone number.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setPin("");
    setPinModalOpen(true);
  };

  const executeTransfer = async (enteredPin: string) => {
    if (!enteredPin || enteredPin.length !== 4) {
      toast.error("PIN must be 4 digits.");
      return;
    }

    const usingQr = transferMode === "qr";

    try {
      setSubmitting(true);
      const response = await managerTransfer({
        amount: Number(amount),
        receiver_user_id: undefined,
        receiver_phone: usingQr ? undefined : receiverPhone || undefined,
        qr_id: usingQr ? selectedQr?.id : undefined,
        pin: enteredPin,
        description: description || undefined,
      });

      toast.success(response?.data?.message || "Transfer completed.");
      setReceiverPhone("");
      setAmount("");
      setPin("");
      setDescription("");
      setPinModalOpen(false);
      await loadData();
      
      // Refresh balance immediately after successful transfer
      await refreshBalance();

      if (response?.data?.data) {
        setReceiptTx(response.data.data);
        setReceiptOpen(true);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const resolveQrLookup = async (value: string) => {
    const lookupValue = normalizeQrValue(value);
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

  const normalizeQrValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && "qr_code_value" in parsed) {
        return String((parsed as any).qr_code_value).trim();
      }
    } catch {
      // not JSON, keep raw string
    }

    return trimmed;
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

  const statusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "frozen":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "suspended":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <AgentManagerLayout title="Transfer Money">
      <div className="space-y-8">
        {/* ───────── Hero Wallet Card ───────── */}
        <div className="overflow-hidden rounded-xl shadow-sm bg-slate-900">
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                <p className="text-sm text-slate-400">Loading wallet details…</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                  <Wallet className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : wallet ? (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-500/30">
                    <Wallet className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Your Wallet</h2>
                    <p className="text-xs text-slate-400">Agent manager account</p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusColor(wallet.status)}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {wallet.status ?? "active"}
                    </span>
                  </div>
                </div>

                {/* Balance highlight */}
                <div className="mb-8">
                  <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                    Available Balance
                  </p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-white md:text-5xl">
                    {formatBalance(realtimeBalance !== null ? realtimeBalance : wallet.balance)}
                    <span className="ml-2 text-lg font-medium text-slate-400">
                      MMK
                    </span>
                  </p>
                  {realtimeBalance !== null && (
                    <p className="mt-2 text-xs text-slate-400">
                      <RefreshCw className="inline h-3 w-3 mr-1 animate-spin" />
                      Real-time updates enabled
                    </p>
                  )}
                </div>

                {/* Wallet meta row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="group flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition-all hover:bg-white/[0.07] hover:ring-white/20">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Wallet Number
                      </p>
                      <p className="mt-0.5 truncate font-mono text-sm font-semibold text-slate-200">
                        {wallet.wallet_number ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="group flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition-all hover:bg-white/[0.07] hover:ring-white/20">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                      <CircleDollarSign className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Currency
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-200">
                        MMK
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700/50">
                  <Wallet className="h-6 w-6 text-slate-500" />
                </div>
                <p className="text-sm text-slate-500">No wallet found.</p>
              </div>
            )}
          </div>
        </div>

        {/* ───────── Receive QR Card ───────── */}
        {myQrCode ? (
          <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200/60">
            <CardHeader className="border-b border-slate-100 bg-blue-50/60 px-6 py-5">
              <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <QrCode className="h-4 w-4 text-blue-600" />
                </div>
                Your Receive QR
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-6 md:flex-row md:items-start">
              <div className="group flex-shrink-0">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-shadow group-hover:shadow-md">
                  <QRCode
                    value={String(myQrCode.qr_payload ?? myQrCode.qr_code_value ?? "") || ""}
                    size={150}
                  />
                </div>
                <div className="mt-3 flex justify-center">
                  <Badge variant="secondary" className="text-xs font-normal text-slate-500">
                    Manager QR
                  </Badge>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Share this QR with customers to receive payments.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-4 py-3 ring-1 ring-slate-100">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      QR Value
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs text-slate-700">
                      {String(myQrCode.qr_payload ?? myQrCode.qr_code_value ?? "")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-3 h-8 w-8 flex-shrink-0 p-0 text-slate-400 hover:text-slate-600"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          String(myQrCode.qr_payload ?? myQrCode.qr_code_value ?? "")
                        );
                        toast.success("QR value copied to clipboard");
                      } catch {
                        toast.error("Unable to copy");
                      }
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* ───────── Send Money Card ───────── */}
        <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200/60">
          <CardHeader className="space-y-1 border-b border-slate-100 bg-emerald-50/50 px-6 py-5">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
              Send Money
            </CardTitle>
            <p className="text-sm text-slate-500">
              Choose manual receiver mode for an agent or phone number, or scan a QR code to pay a
              recipient quickly.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleTransferClick}>
              {/* Mode switcher */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${transferMode === "manual"
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-500 hover:text-slate-700"
                    }`}
                  onClick={() => {
                    setTransferMode("manual");
                    setSelectedQr(null);
                    setQrLookupValue("");
                  }}
                >
                  <Phone className="h-4 w-4" />
                  Manual Receiver
                </button>
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${transferMode === "qr"
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-500 hover:text-slate-700"
                    }`}
                  onClick={() => {
                    setTransferMode("qr");
                  }}
                >
                  <ScanLine className="h-4 w-4" />
                  Scan QR Code
                </button>
              </div>

              {/* Transfer mode panels */}
              {transferMode === "manual" ? (
                <div className="space-y-5 rounded-xl border border-slate-200/70 bg-slate-50/50 p-5">
                  <div className="space-y-2">
                    <Label htmlFor="receiverPhone" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Receiver Phone
                    </Label>
                    <Input
                      id="receiverPhone"
                      placeholder="09xxxxxxxx or +959xxxxxxxx"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="h-11"
                    />
                    <p className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="mt-0.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-slate-400" />
                      Enter the receiver's phone number to send money.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-slate-200/70 bg-slate-50/50 p-5">
                  <div className="space-y-3">
                    <Label htmlFor="qrLookup" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <QrCode className="h-3.5 w-3.5 text-slate-400" />
                      Recipient QR Code
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="qrLookup"
                        placeholder="Paste scanned QR value or code"
                        value={qrLookupValue}
                        onChange={(event) => setQrLookupValue(event.target.value)}
                        className="h-11"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={lookupLoading}
                          onClick={() => void resolveQrLookup(qrLookupValue)}
                          className="h-11 whitespace-nowrap"
                        >
                          {lookupLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Looking up…
                            </>
                          ) : (
                            "Lookup QR"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={lookupLoading}
                          onClick={() => setScannerOpen(true)}
                          className="h-11"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Scan
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedQr ? (
                    <div className="flex items-start gap-4 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-emerald-900">
                          {selectedQr.user?.full_name || "Recipient"}
                        </p>
                        <p className="text-sm text-emerald-700">
                          {selectedQr.user?.phone_number || "—"}
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-emerald-600/80">
                          {selectedQr.qr_code_value}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition-colors hover:text-emerald-900"
                          onClick={() => {
                            setSelectedQr(null);
                            setQrLookupValue("");
                          }}
                        >
                          Clear selection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="flex items-start gap-2 text-xs text-slate-500">
                      <span className="mt-0.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-slate-400" />
                      Use Scan QR to open your camera, or paste a scanned value manually.
                    </p>
                  )}
                </div>
              )}

              <hr className="border-slate-100" />

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="100,000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-11"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Description
                  <span className="text-xs font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="description"
                  placeholder="Add a note for this transfer…"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="h-11"
                />
              </div>

              {/* Submit & Auto Save Toggle */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auto-save" 
                    checked={autoSaveReceipt} 
                    onCheckedChange={(checked) => setAutoSaveReceipt(checked === true)} 
                  />
                  <Label htmlFor="auto-save" className="text-sm font-medium text-slate-600 cursor-pointer">
                    Auto-save receipt to device
                  </Label>
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full gap-2 rounded-xl bg-slate-900 text-sm font-semibold tracking-wide text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25 disabled:opacity-60 md:w-auto md:px-8"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-4 w-4" />
                      Send Money
                    </>
                  )}
                </Button>
              </div>
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

      <TransferReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={receiptTx}
        autoDownload={autoSaveReceipt}
      />

      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-slate-900">Verify PIN</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Enter your 4-digit PIN to authorize this transfer.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col items-center gap-6">
            <InputOTP
              value={pin}
              onChange={(value) => {
                const cleaned = value.replace(/\D/g, "");
                setPin(cleaned);
                if (cleaned.length === 4) {
                  void executeTransfer(cleaned);
                }
              }}
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              containerClassName="justify-center gap-3"
              render={({ slots }) => (
                <InputOTPGroup className="gap-3">
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index} index={index} {...slot} />
                  ))}
                </InputOTPGroup>
              )}
            />

            <div className="flex w-full gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPinModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={submitting || pin.length !== 4}
                onClick={() => void executeTransfer(pin)}
              >
                {submitting ? "Verifying..." : "Confirm & Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AgentManagerLayout>
  );
};

export default ManagerTransferPage;
