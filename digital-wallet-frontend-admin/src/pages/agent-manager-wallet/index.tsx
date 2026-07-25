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
  QrCode,
  Copy,
  Loader2,
  RefreshCw,
  LockKeyhole,
  ShieldAlert,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";
import QrScannerDialog from "@/components/qr/QrScannerDialog";
import AgentManagerLayout from "@/components/layouts/AgentManagerLayout";
import TransferReceiptModal from "@/components/common/TransferReceiptModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
import {
  getUserWallet,
  managerTransfer,
  getAdminWalletInfo,
} from "@/services/transfer.service";
import { getMyQrCode, lookupQrCode } from "@/services/systemWallet.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type WalletRecord = {
  id?: number;
  user_id?: number | string;
  wallet_number?: string;
  balance?: number | string;
  status?: string;
  user?: {
    id?: number | string;
    full_name?: string;
    phone_number?: string;
    role?: { name?: string };
  };
};

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
  wallet?: { wallet_number?: string; status?: string };
};

/** Who the manager is sending to */
type RecipientType = "agent" | "admin";

// ─── Component ────────────────────────────────────────────────────────────────

const ManagerTransferPage = () => {
  // Wallet / session state
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Admin wallet (for manager → admin)
  const [adminWallet, setAdminWallet] = useState<WalletRecord | null>(null);
  const [adminWalletLoading, setAdminWalletLoading] = useState(false);

  // Transfer form state
  const [recipientType, setRecipientType] = useState<RecipientType>("agent");
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

  // Receipt / PIN modal
  const [myQrCode, setMyQrCode] = useState<QrCodeRecord | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<any>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);


  // ── Helpers ────────────────────────────────────────────────────────────────

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
  const { balance: realtimeBalance, refreshBalance } = useRealTimeBalance(
    userId,
    true
  );

  const formatBalance = (value?: number | string) => {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
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
      // ignore
    }
    return trimmed;
  };

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadData = async () => {
    const su = getSessionUser();
    const uid = su?.id;
    if (!uid) {
      setError("Session not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const walletResponse = await getUserWallet(uid);
      const walletList =
        walletResponse.data?.data?.data ?? walletResponse.data?.data ?? [];
      const matchedWallet = Array.isArray(walletList)
        ? walletList.find(
            (item: WalletRecord) => Number(item.user_id) === Number(uid)
          )
        : null;

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
        setError(
          "No wallet is linked to this account yet. Complete PIN setup if you have not."
        );
      }
    } catch (err) {
      setWallet(null);
      setError(err instanceof Error ? err.message : "Unable to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminWallet = async () => {
    try {
      setAdminWalletLoading(true);
      const res = await getAdminWalletInfo();
      const list = res.data?.data?.data ?? res.data?.data ?? [];
      const adminW = Array.isArray(list) ? list[0] ?? null : null;
      setAdminWallet(adminW);
    } catch {
      setAdminWallet(null);
    } finally {
      setAdminWalletLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Load admin wallet when recipient type switches to admin
  useEffect(() => {
    if (recipientType === "admin" && adminWallet === null && !adminWalletLoading) {
      void loadAdminWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientType]);

  // ── QR logic ───────────────────────────────────────────────────────────────

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

      if (!qrData?.user) {
        toast.error("QR code lookup did not return a valid user.");
        setSelectedQr(null);
        return;
      }

      const userRole = qrData.user.role;

      if (recipientType === "agent") {
        if (userRole && userRole !== "agent") {
          const roleDisplay = userRole.replace(/_/g, " ");
          toast.error(
            `Scanned recipient is a ${roleDisplay}. Switch to "Transfer to Admin" if you want to send to admin.`
          );
          setSelectedQr(null);
          return;
        }
      } else {
        // recipientType === "admin"
        if (userRole && userRole !== "admin") {
          const roleDisplay = userRole.replace(/_/g, " ");
          toast.error(
            `Scanned recipient is a ${roleDisplay}. Switch to "Transfer to Agent" to send to an agent.`
          );
          setSelectedQr(null);
          return;
        }
      }

      setSelectedQr(qrData);
      setQrLookupValue(lookupValue);
      const label =
        recipientType === "admin" ? "Admin" : "Agent";
      toast.success(
        `${label} QR code recognized: ${qrData.user.full_name || qrData.user.phone_number}`
      );
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

  // ── Transfer submit ────────────────────────────────────────────────────────

  const handleTransferClick = (event: React.FormEvent) => {
    event.preventDefault();

    if (recipientType === "agent") {
      const usingQr = transferMode === "qr";
      if (usingQr) {
        if (!selectedQr?.id) {
          toast.error("Please scan or look up a valid agent QR code first.");
          return;
        }
      } else if (!receiverPhone) {
        toast.error("Please enter the agent's phone number.");
        return;
      }
    } else {
      // admin
      const usingQr = transferMode === "qr";
      if (usingQr) {
        if (!selectedQr?.id) {
          toast.error("Please scan or look up the admin QR code first.");
          return;
        }
      } else if (!adminWallet?.user_id) {
        toast.error("Admin wallet not found. Please try again.");
        return;
      }
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

      let payload: Parameters<typeof managerTransfer>[0];

      if (recipientType === "admin") {
        if (usingQr && selectedQr?.id) {
          payload = {
            amount: Number(amount),
            qr_id: selectedQr.id,
            pin: enteredPin,
            description: description || undefined,
          };
        } else {
          // Direct transfer to admin by user_id
          payload = {
            amount: Number(amount),
            receiver_user_id: adminWallet?.user_id,
            pin: enteredPin,
            description: description || undefined,
          };
        }
      } else {
        // agent
        payload = {
          amount: Number(amount),
          receiver_user_id: undefined,
          receiver_phone: usingQr ? undefined : receiverPhone || undefined,
          qr_id: usingQr ? selectedQr?.id : undefined,
          pin: enteredPin,
          description: description || undefined,
        };
      }

      const response = await managerTransfer(payload);

      toast.success(response?.data?.message || "Transfer completed.");
      setReceiverPhone("");
      setAmount("");
      setPin("");
      setDescription("");
      setSelectedQr(null);
      setQrLookupValue("");
      setPinModalOpen(false);
      await loadData();
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AgentManagerLayout title="Transfer Money">
      <div className="space-y-6">
        {/* ── Header Banner ── */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BDF40B] text-[#10110E]">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Agent Manager Wallet
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your float balance and transfer funds securely to agents
                or admin.
              </p>
            </div>
          </div>
          {wallet && (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#52C41A] bg-white px-3 py-1.5 text-xs font-bold capitalize text-[#52C41A]">
                {wallet.status || "active"}
              </span>
              <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Agent Manager
              </span>
            </div>
          )}
        </div>

        {/* ── Hero Wallet Card ── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-none">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#BDF40B] text-[#10110E]">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Wallet Overview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time float status
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#BDF40B] px-3 py-1 text-xs font-bold text-[#10110E]">
                Agent Manager Float
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 className="h-5 w-5 animate-spin text-[#10110E]" />
                <p className="text-sm text-muted-foreground">
                  Loading wallet details…
                </p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-500">
                  <Wallet className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-red-500">{error}</p>
              </div>
            ) : wallet ? (
              <div className="space-y-6">
                {/* Balance highlight */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#BDF40B] bg-[#BDF40B] p-8 text-center text-[#10110E]">
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-80">
                    Available Float Balance
                  </span>
                  <span className="text-4xl font-extrabold md:text-5xl">
                    {formatBalance(
                      realtimeBalance !== null
                        ? realtimeBalance
                        : wallet.balance
                    )}
                    <span className="ml-2 text-xl font-semibold">MMK</span>
                  </span>
                  {realtimeBalance !== null && (
                    <p className="mt-3 inline-flex items-center text-xs font-medium opacity-75">
                      <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                      Live balance sync active
                    </p>
                  )}
                </div>

                {/* Wallet metadata */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50/50 p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#10110E] text-[#BDF40B]">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Wallet Number
                      </p>
                      <p className="mt-0.5 truncate font-mono text-sm font-bold text-foreground">
                        {wallet.wallet_number ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50/50 p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#10110E] text-[#BDF40B]">
                      <CircleDollarSign className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Currency
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-foreground">
                        MMK (Myanmar Kyat)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No wallet found.
              </div>
            )}
          </div>
        </div>

        {/* ── Receive QR Card ── */}
        {myQrCode && (
          <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-[#BDF40B] text-[#10110E]">
                  <QrCode className="h-4 w-4" />
                </div>
                Your Receive QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 p-6 md:flex-row md:items-start">
              <div className="flex flex-col items-center shrink-0">
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <QRCode
                    value={String(myQrCode.qr_code_value ?? "")}
                    size={160}
                  />
                </div>
                <Badge className="mt-3 bg-[#BDF40B] text-[#10110E] hover:bg-[#BDF40B]">
                  Manager QR
                </Badge>
              </div>
              <div className="flex-1 space-y-4">
                <div className="rounded-xl border border-border bg-slate-50/50 p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Display or share this QR code with agents or system
                    administrators to receive funds into your wallet.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      QR Code Value
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs font-semibold text-foreground">
                      {String(myQrCode.qr_code_value ?? "")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-3 h-8 shrink-0 border-border text-foreground hover:bg-[#BDF40B]"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          String(myQrCode.qr_code_value ?? "")
                        );
                        toast.success("QR value copied to clipboard");
                      } catch {
                        toast.error("Unable to copy");
                      }
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Send Money Card ── */}
        <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
          <CardHeader className="border-b border-border py-5">
            <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-foreground">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-[#BDF40B] text-[#10110E]">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              Transfer Funds
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Transfer float to an agent or send funds back to the admin.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleTransferClick}>
              {/* ── Recipient Type Selector ── */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transfer To
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-slate-50/50 p-1.5">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      recipientType === "agent"
                        ? "bg-[#BDF40B] text-[#10110E] shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setRecipientType("agent");
                      setSelectedQr(null);
                      setQrLookupValue("");
                      setReceiverPhone("");
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Transfer to Agent
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      recipientType === "admin"
                        ? "bg-[#10110E] text-[#BDF40B] shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setRecipientType("admin");
                      setSelectedQr(null);
                      setQrLookupValue("");
                      setReceiverPhone("");
                      setTransferMode("manual");
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Transfer to Admin
                  </button>
                </div>
              </div>

              {/* ── Admin Info Banner (when admin is selected) ── */}
              {recipientType === "admin" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-800">
                        Sending to System Admin
                      </p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Funds will be transferred directly to the admin's system
                        wallet. This action cannot be reversed. Make sure the
                        amount is correct before confirming.
                      </p>
                      {adminWalletLoading ? (
                        <div className="flex items-center gap-2 pt-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                          <span className="text-xs text-amber-600">
                            Loading admin wallet…
                          </span>
                        </div>
                      ) : adminWallet ? (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Admin Wallet
                          </p>
                          <p className="mt-0.5 font-mono text-xs font-bold text-foreground">
                            {adminWallet.wallet_number ?? "—"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-red-500 pt-1">
                          Admin wallet not found. Contact system support.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Input Mode Switcher (only for agent transfers) ── */}
              {recipientType === "agent" && (
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-slate-50/50 p-1.5">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      transferMode === "manual"
                        ? "bg-[#BDF40B] text-[#10110E] shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setTransferMode("manual");
                      setSelectedQr(null);
                      setQrLookupValue("");
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Manual Phone Entry
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      transferMode === "qr"
                        ? "bg-[#BDF40B] text-[#10110E] shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setTransferMode("qr")}
                  >
                    <ScanLine className="h-4 w-4" />
                    Scan / Lookup QR
                  </button>
                </div>
              )}

              {/* ── Admin QR mode switcher ── */}
              {recipientType === "admin" && (
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-slate-50/50 p-1.5">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      transferMode === "manual"
                        ? "bg-[#10110E] text-[#BDF40B] shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setTransferMode("manual");
                      setSelectedQr(null);
                      setQrLookupValue("");
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Send to Admin Wallet
                  </button>
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                      transferMode === "qr"
                        ? "bg-[#10110E] text-[#BDF40B] shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setTransferMode("qr")}
                  >
                    <ScanLine className="h-4 w-4" />
                    Scan Admin QR
                  </button>
                </div>
              )}

              {/* ── Input Panels ── */}

              {/* Agent manual phone */}
              {recipientType === "agent" && transferMode === "manual" && (
                <div className="space-y-4 rounded-xl border border-border bg-white p-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="receiverPhone"
                      className="text-xs font-semibold text-foreground"
                    >
                      Agent Phone Number
                    </Label>
                    <Input
                      id="receiverPhone"
                      placeholder="09xxxxxxxx"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="h-12 border-[#BDF40B] font-mono focus-visible:ring-[#BDF40B]/30"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the registered phone number of the target agent.
                    </p>
                  </div>
                </div>
              )}

              {/* Agent QR lookup */}
              {recipientType === "agent" && transferMode === "qr" && (
                <div className="space-y-4 rounded-xl border border-border bg-white p-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="qrLookup"
                      className="text-xs font-semibold text-foreground"
                    >
                      Agent QR Code
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="qrLookup"
                        placeholder="SW-XXXXXXXXXX or paste full QR JSON"
                        value={qrLookupValue}
                        onChange={(event) =>
                          setQrLookupValue(event.target.value)
                        }
                        className="h-12 border-[#BDF40B] font-mono text-xs focus-visible:ring-[#BDF40B]/30"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={lookupLoading}
                          onClick={() => void resolveQrLookup(qrLookupValue)}
                          className="h-12 whitespace-nowrap border-border hover:bg-[#BDF40B]"
                        >
                          {lookupLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Lookup
                        </Button>
                        <Button
                          type="button"
                          disabled={lookupLoading}
                          onClick={() => setScannerOpen(true)}
                          className="h-12 bg-[#BDF40B] font-semibold text-[#10110E] hover:bg-[#BDF40B]/90"
                        >
                          <Camera className="mr-1.5 h-4 w-4" />
                          Scan
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedQr ? (
                    <div className="flex items-start gap-4 rounded-xl border border-[#52C41A] bg-emerald-50/50 p-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#52C41A] text-white">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">
                          {selectedQr.user?.full_name || "Recipient"}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {selectedQr.user?.phone_number || "—"}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-red-500 underline underline-offset-2 hover:text-red-700"
                          onClick={() => {
                            setSelectedQr(null);
                            setQrLookupValue("");
                          }}
                        >
                          Clear selection
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Admin direct (no extra input needed — uses adminWallet.user_id) */}
              {recipientType === "admin" && transferMode === "manual" && (
                <div className="rounded-xl border border-border bg-white p-5">
                  {adminWalletLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Fetching admin wallet…
                      </p>
                    </div>
                  ) : adminWallet ? (
                    <div className="flex items-start gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#10110E] text-[#BDF40B]">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">
                          System Administrator
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          Wallet: {adminWallet.wallet_number ?? "—"}
                        </p>
                        <Badge className="mt-2 bg-[#10110E] text-[#BDF40B] hover:bg-[#10110E]">
                          Admin Recipient
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">
                      Admin wallet not found. Please contact system support.
                    </p>
                  )}
                </div>
              )}

              {/* Admin QR lookup */}
              {recipientType === "admin" && transferMode === "qr" && (
                <div className="space-y-4 rounded-xl border border-border bg-white p-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="adminQrLookup"
                      className="text-xs font-semibold text-foreground"
                    >
                      Admin QR Code
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="adminQrLookup"
                        placeholder="SW-XXXXXXXXXX or paste full QR JSON"
                        value={qrLookupValue}
                        onChange={(event) =>
                          setQrLookupValue(event.target.value)
                        }
                        className="h-12 border-[#10110E] font-mono text-xs focus-visible:ring-[#10110E]/30"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={lookupLoading}
                          onClick={() => void resolveQrLookup(qrLookupValue)}
                          className="h-12 whitespace-nowrap border-border hover:bg-[#10110E] hover:text-[#BDF40B]"
                        >
                          {lookupLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Lookup
                        </Button>
                        <Button
                          type="button"
                          disabled={lookupLoading}
                          onClick={() => setScannerOpen(true)}
                          className="h-12 bg-[#10110E] font-semibold text-[#BDF40B] hover:bg-[#10110E]/90"
                        >
                          <Camera className="mr-1.5 h-4 w-4" />
                          Scan
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedQr ? (
                    <div className="flex items-start gap-4 rounded-xl border border-[#10110E] bg-slate-50/80 p-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#10110E] text-[#BDF40B]">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground">
                          {selectedQr.user?.full_name || "System Admin"}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {selectedQr.user?.phone_number || "—"}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-xs font-semibold text-red-500 underline underline-offset-2 hover:text-red-700"
                          onClick={() => {
                            setSelectedQr(null);
                            setQrLookupValue("");
                          }}
                        >
                          Clear selection
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* ── Amount & Description ── */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="amount"
                    className="text-xs font-semibold text-foreground"
                  >
                    Transfer Amount (MMK)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="100,000"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="h-12 border-[#BDF40B] font-bold text-base focus-visible:ring-[#BDF40B]/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-xs font-semibold text-foreground"
                  >
                    Note / Description{" "}
                    <span className="font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    id="description"
                    placeholder={
                      recipientType === "admin"
                        ? "Returning float to admin"
                        : "Float transfer note"
                    }
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="h-12 border-border focus-visible:ring-[#BDF40B]/30"
                  />
                </div>
              </div>

              {/* ── Actions Footer ── */}
              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`h-12 rounded-xl px-8 font-bold ${
                    recipientType === "admin"
                      ? "bg-[#10110E] text-[#BDF40B] hover:bg-[#10110E]/90"
                      : "bg-[#BDF40B] text-[#10110E] hover:bg-[#BDF40B]/90"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      {recipientType === "admin"
                        ? "Send to Admin"
                        : "Authorize & Send"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── QR Scanner Dialog ── */}
      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={(open) => setScannerOpen(open)}
        onScan={(value) => {
          setScannerOpen(false);
          handleScannedQr(value);
        }}
      />

      {/* ── Receipt Modal ── */}
      <TransferReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={receiptTx}
      />

      {/* ── PIN Modal ── */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="items-center text-center space-y-2">
            <div
              className={`mb-2 grid h-12 w-12 place-items-center rounded-full ${
                recipientType === "admin"
                  ? "bg-[#10110E] text-[#BDF40B]"
                  : "bg-[#BDF40B] text-[#10110E]"
              }`}
            >
              <LockKeyhole className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Authorize Transfer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {recipientType === "admin"
                ? "You are sending funds to the system admin. Enter your 4-digit PIN to confirm."
                : "Enter your 4-digit security PIN to confirm this float transfer."}
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
                className="flex-1 rounded-xl"
                onClick={() => setPinModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 rounded-xl font-bold ${
                  recipientType === "admin"
                    ? "bg-[#10110E] text-[#BDF40B] hover:bg-[#10110E]/90"
                    : "bg-[#BDF40B] text-[#10110E] hover:bg-[#BDF40B]/90"
                }`}
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
