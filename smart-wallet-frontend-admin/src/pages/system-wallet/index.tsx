import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
  Camera,
  QrCode,
  ScanLine,
  Wallet,
  Hash,
  CircleDollarSign,
  ShieldCheck,
  UserCheck,
  ArrowUpRight,
  Phone,
  FileText,
  Copy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";
import QrScannerDialog from "@/components/qr/QrScannerDialog";
import MainLayout from "@/components/layouts/MainLayout";
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
import { Separator } from "@/components/ui/separator";
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
    
    status?: string;
  };
};

const SystemWalletPage = () => {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [myQrCode, setMyQrCode] = useState<QrCodeRecord | null>(null);
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
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<any>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [autoSaveReceipt, setAutoSaveReceipt] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [adminUserId, setAdminUserId] = useState<number | string | undefined>(undefined);

  const getAdminUser = () => {
    try {
      const cookieValue = getCookie("admin_user");
      if (!cookieValue) return null;
      return JSON.parse(cookieValue) as AdminUserCookie;
    } catch {
      return null;
    }
  };

  const loadWallet = useCallback(async () => {
    const adminUser = getAdminUser();
    const adminId = adminUser?.id;

    if (!adminId) {
      setError("Admin session not found.");
      setLoading(false);
      return;
    }

    setAdminUserId(adminId);

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
  }, []);

  // Real-time balance hook — polls every 2 s
  const {
    balance: liveBalance,
    loading: balanceLoading,
    refreshBalance,
  } = useRealTimeBalance(adminUserId, !!adminUserId);

  // Track last-updated timestamp whenever a live balance arrives
  useEffect(() => {
    if (liveBalance !== null) {
      setLastUpdated(new Date());
    }
  }, [liveBalance]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const normalizeQrValue = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && "qr_code_value" in parsed) {
        return String((parsed as any).qr_code_value).trim();
      }
    } catch {
      // not JSON — treat as raw code
    }
    return trimmed;
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

  const handleTransferClick = (event: React.FormEvent) => {
    event.preventDefault();

    const usingQr = transferMode === "qr";

    if (usingQr) {
      if (!selectedQr?.id) {
        toast.error("Please scan or look up a valid agent manager QR code first.");
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
      const response = await adminTransferToAgentManager({
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
      clearQrSelection();
      await loadWallet();

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
        return "border-[#D5E726] bg-[#D5E726] text-[#10110E]";
      case "frozen":
        return "border-[#2F332B] bg-[#161814] text-white";
      case "suspended":
        return "border-[#FF4D4F] bg-white text-[#FF4D4F]";
      default:
        return "border-[#C7C7C7] bg-white text-[#10110E]";
    }
  };

  return (
    <MainLayout title="System Wallet">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-[#D5E726] px-6 py-3 text-xs font-bold tracking-[0.2em] text-[#10110E] uppercase md:px-8">
            System treasury
          </div>
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex items-center gap-3 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#10110E]" />
                <p className="text-sm text-muted-foreground">Loading wallet details…</p>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D5E726] text-[#10110E]">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Admin Wallet</h2>
                    <p className="text-xs text-muted-foreground">System treasury account</p>
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
                  <div className="mb-1 flex items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Available Balance
                    </p>
                    {/* Live indicator */}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-700">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                      </span>
                      LIVE
                    </span>
                    {/* Manual refresh */}
                    <button
                      type="button"
                      title="Refresh balance"
                      onClick={() => void refreshBalance()}
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:border-[#D5E726] hover:text-[#10110E]"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    {formatBalance(liveBalance ?? wallet.balance)}
                    <span className="ml-2 text-lg font-medium text-muted-foreground">
                      MMK
                    </span>
                  </p>
                  {lastUpdated && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Updated {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {/* Wallet meta row */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-[#D5E726]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D5E726] text-[#10110E]">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Wallet Number
                      </p>
                      <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">
                        {wallet.wallet_number ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-[#D5E726]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D5E726] text-[#10110E]">
                      <CircleDollarSign className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Currency
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        MMK
                      </p>
                    </div>
                  </div>
                  <div className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-[#D5E726]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D5E726] text-[#10110E]">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Linked Admin ID
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {wallet.user_id ?? "—"}
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
                <p className="text-sm text-slate-500">No wallet found for the current admin.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.35fr)]">
        {/* ───────── Receive QR Card ───────── */}
        <Card className="overflow-hidden rounded-2xl border border-border shadow-none xl:sticky xl:top-24">
          <CardHeader className="border-b border-border px-6 py-5">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D5E726] text-[#10110E]">
                <QrCode className="h-4 w-4" />
              </div>
              Receive Money via QR
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center gap-3 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Loading QR code…</p>
              </div>
            ) : myQrCode?.qr_code_value ? (
              <div className="flex flex-col items-center gap-6">
                <div className="group relative flex-shrink-0">
                  <div className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow group-hover:border-[#D5E726]">
                    <QRCode value={String(myQrCode.qr_code_value)} size={180} />
                  </div>
                  <div className="mt-3 flex justify-center">
                    <Badge variant="secondary" className="text-xs font-normal text-white">
                      Admin QR Code
                    </Badge>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="rounded-xl border border-border bg-white p-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                      Agent managers can scan this QR code to send money to the system wallet
                      using the{" "}
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#D5E726] px-2 py-0.5 text-xs font-medium text-[#10110E]">
                        <ArrowUpRight className="h-3 w-3" />
                        manager → admin
                      </span>{" "}
                      transfer flow.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          QR Value
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-700">
                          {myQrCode.qr_code_value}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(String(myQrCode.qr_code_value ?? ""));
                            toast.success("QR value copied to clipboard");
                          } catch {
                            toast.error("Unable to copy");
                          }
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {myQrCode.wallet?.wallet_number && (
                    <div className="rounded-lg border border-border bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Linked Wallet
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-700">
                          {myQrCode.wallet.wallet_number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <QrCode className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">
                  QR code is not available yet. Complete PIN setup to generate one automatically.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ───────── Transfer Card ───────── */}
        <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
          <CardHeader className="space-y-1 border-b border-border px-6 py-5">
            <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D5E726] text-[#10110E]">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              Transfer to Agent Manager
            </CardTitle>
            <p className="text-sm text-slate-500">
              Send money to an agent manager using phone number or QR code lookup.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleTransferClick}>
              {/* Mode switcher */}
              <div className="flex items-center gap-1 rounded-xl border border-border bg-white p-1">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${transferMode === "manual"
                      ? "bg-[#D5E726] text-[#10110E] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => {
                    setTransferMode("manual");
                    clearQrSelection();
                  }}
                >
                  <Phone className="h-4 w-4" />
                  Phone Number
                </button>
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${transferMode === "qr"
                      ? "bg-[#D5E726] text-[#10110E] shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={() => {
                    setTransferMode("qr");
                    setReceiverPhone("");
                  }}
                >
                  <ScanLine className="h-4 w-4" />
                  Scan QR Code
                </button>
              </div>

              {/* Transfer mode panels */}
              {transferMode === "manual" ? (
                <div className="space-y-4 rounded-xl border border-border bg-white p-5">
                  <div className="space-y-2">
                    <Label htmlFor="receiverPhone" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Receiver Phone Number
                    </Label>
                    <Input
                      id="receiverPhone"
                      type="tel"
                      placeholder="09xxxxxxxxx"
                      value={receiverPhone}
                      onChange={(event) => setReceiverPhone(event.target.value)}
                      className="h-11"
                    />
                  </div>
                  <p className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="mt-0.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-slate-400" />
                    Use the agent manager phone number or admin phone if you want to send money to the system wallet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 rounded-xl border border-border bg-white p-5">
                  <div className="space-y-3">
                    <Label htmlFor="qrLookup" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <QrCode className="h-3.5 w-3.5 text-slate-400" />
                      Agent Manager QR Code
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="qrLookup"
                        placeholder="SW-XXXXXXXXXX or paste full QR JSON"
                        value={qrLookupValue}
                        onChange={(event) => setQrLookupValue(event.target.value)}
                        className="h-11"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={lookupLoading}
                          onClick={() => void handleQrLookup()}
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
                    <div className="flex items-start gap-4 rounded-xl border border-[#52C41A] bg-white p-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#52C41A] text-white">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {selectedQr.user?.full_name || "Agent Manager"}
                        </p>
                        <p className="text-sm text-[#10110E]">
                          {selectedQr.user?.phone_number || "—"}
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-[#10110E]">
                          {selectedQr.qr_code_value}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-medium text-[#10110E] underline decoration-[#52C41A] underline-offset-2"
                          onClick={clearQrSelection}
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

              <Separator />

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
                  className="h-12 w-full gap-2 rounded-xl bg-[#D5E726] text-sm font-semibold tracking-wide text-[#10110E] shadow-none transition-all hover:bg-[#D5E726] disabled:opacity-60 md:w-auto md:px-8"
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
          onOpenChange={setScannerOpen}
          onScan={handleScannedQr}
          title="Scan Agent Manager QR"
          description="Align the agent manager QR code inside the frame."
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
      </div>
    </MainLayout>
  );
};

export default SystemWalletPage;
