import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Store,
  Plus,
  Search,
  Eye,
  Copy,
  Loader2,
  RefreshCw,
  KeyRound,
  Wallet,
} from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMerchants,
  createMerchant,
  deleteMerchant,
  toggleMerchantStatus,
  getMerchantPayments,
} from "@/services/merchant.service";

type Merchant = {
  id: number;
  merchant_name: string;
  phone_number?: string | null;
  callback_url?: string | null;
  status: string;
  created_at?: string;
  user?: { id: number; full_name?: string; phone_number?: string; status?: string };
  wallet?: { id: number; wallet_number?: string; balance?: number | string; status?: string };
};

type MerchantPayment = {
  id: number;
  amount: number | string;
  fee: number | string;
  status: string;
  reference?: string | null;
  created_at?: string;
  customer?: { full_name?: string; phone_number?: string };
};

const MerchantStatusBadge = ({ status }: { status?: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
      status === "active"
        ? "border-[#52C41A] bg-white text-[#52C41A]"
        : "border-[#C7C7C7] bg-slate-50 text-slate-500"
    }`}
  >
    {status ?? "inactive"}
  </span>
);

const MerchantsPage = () => {
  const [items, setItems] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    merchant_name: "",
    phone_number: "",
    callback_url: "",
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [paymentsMerchant, setPaymentsMerchant] = useState<Merchant | null>(null);
  const [payments, setPayments] = useState<MerchantPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { per_page: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getMerchants(params);
      const payload = res.data?.data;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!createForm.merchant_name.trim()) {
      toast.error("Please enter a merchant name.");
      return;
    }
    try {
      setCreating(true);
      const res = await createMerchant({
        merchant_name: createForm.merchant_name.trim(),
        phone_number: createForm.phone_number.trim() || undefined,
        callback_url: createForm.callback_url.trim() || undefined,
      });
      const apiKey = res.data?.data?.api_key;
      setGeneratedKey(apiKey ?? null);
      setCreateForm({ merchant_name: "", phone_number: "", callback_url: "" });
      toast.success(res.data?.message || "Merchant created.");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create merchant.");
    } finally {
      setCreating(false);
    }
  };

  const closeCreate = () => {
    if (generatedKey) return; // require explicit close from the key dialog
    setCreateOpen(false);
    setGeneratedKey(null);
    setCreateForm({ merchant_name: "", phone_number: "", callback_url: "" });
  };

  const handleToggle = async (merchant: Merchant) => {
    try {
      setTogglingId(merchant.id);
      await toggleMerchantStatus(merchant.id);
      toast.success("Merchant status updated.");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (merchant: Merchant) => {
    if (!window.confirm(`Delete merchant "${merchant.merchant_name}"? This cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(merchant.id);
      await deleteMerchant(merchant.id);
      toast.success("Merchant deleted.");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete merchant.");
    } finally {
      setDeletingId(null);
    }
  };

  const openPayments = async (merchant: Merchant) => {
    setPaymentsMerchant(merchant);
    setPayments([]);
    setPaymentsLoading(true);
    try {
      const res = await getMerchantPayments(merchant.id, { per_page: 50 });
      const payload = res.data?.data;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setPayments(list);
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const formatBalance = (value?: number | string) =>
    new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

  return (
    <MainLayout title="Merchants">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BCF807] text-[#10110E]">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Third-Party Merchants
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Onboard merchants for wallet payments (phone + OTP + PIN flow).
                Each merchant receives an API key.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setGeneratedKey(null);
              setCreateOpen(true);
            }}
            className="h-11 gap-2 rounded-xl bg-[#BCF807] font-semibold text-[#10110E] shadow-none hover:bg-[#BCF807]/90"
          >
            <Plus className="h-4 w-4" />
            Create Merchant
          </Button>
        </div>

        <Card className="mb-6 rounded-2xl border border-border shadow-none">
          <div className="grid gap-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="merchant-search" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Find a merchant
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="merchant-search"
                  placeholder="Search by name or phone number"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Merchant Directory</h3>
              <p className="text-xs text-muted-foreground">
                {items.length} merchant(s)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg"
              onClick={() => void load()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="bg-slate-50/50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Merchant
                </TableHead>
                <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Contact
                </TableHead>
                <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Wallet
                </TableHead>
                <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
                <TableHead className="bg-slate-50/50 px-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    Loading merchants...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    No merchants found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((merchant) => (
                  <TableRow key={merchant.id} className="border-b border-border last:border-0 hover:bg-[#BCF807]/10">
                    <TableCell className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{merchant.merchant_name}</p>
                      {merchant.callback_url && (
                        <p className="mt-0.5 max-w-[260px] truncate text-xs text-slate-500">
                          {merchant.callback_url}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-600">
                      {merchant.phone_number || (merchant.user?.phone_number) || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-xs text-slate-600">
                      {merchant.wallet ? (
                        <>
                          <p className="font-mono text-slate-800">{merchant.wallet.wallet_number}</p>
                          <p className="mt-0.5">
                            <span className="font-bold text-slate-900">{formatBalance(merchant.wallet.balance)}</span>{" "}
                            <span className="text-slate-400">MMK</span>
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <MerchantStatusBadge status={merchant.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-lg border-border text-foreground shadow-none hover:bg-[#BCF807]"
                          title="View payments"
                          onClick={() => void openPayments(merchant)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg border-border text-foreground shadow-none"
                          disabled={togglingId === merchant.id}
                          onClick={() => void handleToggle(merchant)}
                        >
                          {togglingId === merchant.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : merchant.status === "active" ? (
                            "Deactivate"
                          ) : (
                            "Activate"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-lg border-border text-red-600 shadow-none hover:bg-red-50"
                          disabled={deletingId === merchant.id}
                          onClick={() => void handleDelete(merchant)}
                        >
                          {deletingId === merchant.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create merchant dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) closeCreate(); }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Create Merchant
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              A wallet and API key will be generated for this merchant.
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-[#52C41A] bg-green-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#52C41A]">
                  <KeyRound className="h-4 w-4" />
                  API Key Created
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Save this key now — it will not be shown again.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg border border-border bg-white px-3 py-2 font-mono text-xs text-slate-800">
                    {generatedKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-lg"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(generatedKey);
                        toast.success("API key copied");
                      } catch {
                        toast.error("Unable to copy");
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                className="w-full rounded-xl bg-[#BCF807] font-semibold text-[#10110E] hover:bg-[#BCF807]/90"
                onClick={() => {
                  setGeneratedKey(null);
                  setCreateOpen(false);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchantName" className="text-sm font-medium text-slate-700">
                  Merchant Name
                </Label>
                <Input
                  id="merchantName"
                  placeholder="e.g. Online Shop"
                  value={createForm.merchant_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, merchant_name: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchantPhone" className="text-sm font-medium text-slate-700">
                  Phone Number <span className="text-xs font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="merchantPhone"
                  placeholder="09xxxxxxxxx"
                  value={createForm.phone_number}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone_number: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="merchantCallback" className="text-sm font-medium text-slate-700">
                  Callback URL <span className="text-xs font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="merchantCallback"
                  placeholder="https://shop.example.com/callback"
                  value={createForm.callback_url}
                  onChange={(e) => setCreateForm((f) => ({ ...f, callback_url: e.target.value }))}
                  className="h-11"
                />
              </div>
              <DialogFooter className="gap-2 sm:flex-col">
                <Button
                  onClick={() => void handleCreate()}
                  disabled={creating}
                  className="w-full rounded-xl bg-[#BCF807] font-semibold text-[#10110E] hover:bg-[#BCF807]/90"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create Merchant"
                  )}
                </Button>
                <Button variant="outline" className="w-full rounded-xl" onClick={closeCreate}>
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payments dialog */}
      <Dialog open={!!paymentsMerchant} onOpenChange={(open) => { if (!open) setPaymentsMerchant(null); }}>
        <DialogContent className="sm:max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              <span className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {paymentsMerchant?.merchant_name} — Payments
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Recent wallet payments collected by this merchant.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[420px] overflow-y-auto">
            {paymentsLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading payments…</p>
            ) : payments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No payments yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-slate-50/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {payment.customer?.full_name || payment.customer?.phone_number || "Customer"}
                        {payment.reference && (
                          <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                            {payment.reference}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {payment.created_at ? new Date(payment.created_at).toLocaleString() : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatBalance(payment.amount)}
                        <span className="ml-1 text-xs font-normal text-slate-400">MMK</span>
                      </p>
                      <p className="text-xs text-slate-500">fee {formatBalance(payment.fee)}</p>
                    </div>
                    <MerchantStatusBadge status={payment.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default MerchantsPage;
