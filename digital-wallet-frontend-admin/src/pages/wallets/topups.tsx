import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Clock3, Loader2, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTopups, approveTopup } from "@/services/wallet.service";

type TopupUser = {
  id?: number;
  full_name?: string;
  phone_number?: string;
  role?: {
    id?: number;
    name?: string;
  };
};

type TopupRecord = {
  id: number;
  user_id?: number;
  amount?: number | string;
  reference?: string;
  status?: string;
  note?: string | null;
  approved_by?: number | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: TopupUser;
  approver?: TopupUser | null;
};

type TopupListResponse = {
  data?: TopupRecord[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
};

export default function TopupsPage() {
  const [topups, setTopups] = useState<TopupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fromEntry, setFromEntry] = useState(0);
  const [toEntry, setToEntry] = useState(0);
  const [status, setStatus] = useState("all");

  const [approving, setApproving] = useState<TopupRecord | null>(null);
  const [approveBusy, setApproveBusy] = useState(false);

  const topupList = useMemo(() => topups ?? [], [topups]);
  const pendingCount = useMemo(
    () => topupList.filter((t) => t.status === "pending").length,
    [topupList],
  );
  const pendingAmount = useMemo(
    () => topupList.filter((t) => t.status === "pending").reduce((sum, t) => sum + Number(t.amount ?? 0), 0),
    [topupList],
  );
  const completedCount = useMemo(
    () => topupList.filter((t) => t.status === "completed").length,
    [topupList],
  );

  useEffect(() => {
    setPage(1);
  }, [status]);

  const loadTopups = async (targetPage: number = page) => {
    try {
      setLoading(true);
      const response = await getTopups({
        page: targetPage,
        per_page: perPage,
        status: status !== "all" ? status : undefined,
      });
      const payload = response.data?.data as TopupListResponse | undefined;
      const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];
      setTopups(items);
      setTotalEntries(payload?.total ?? items.length);
      setTotalPages(payload?.last_page ?? 1);
      setFromEntry(payload?.from ?? 0);
      setToEntry(payload?.to ?? 0);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load top-up requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTopups(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, status]);

  const formatAmount = (value?: number | string) => {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-MM", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const roleLabel = (roleName?: string) => {
    if (!roleName) return "";
    if (roleName === "agent_manager") return "Agent Manager";
    return roleName.charAt(0).toUpperCase() + roleName.slice(1);
  };

  const handleApprove = async () => {
    if (!approving) return;
    setApproveBusy(true);
    try {
      const response = await approveTopup(approving.id);
      toast.success(response?.data?.message || "Top-up approved and wallet credited.");
      setApproving(null);
      if (status === "pending" && topupList.length <= 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadTopups(page);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || "Failed to approve top-up.");
    } finally {
      setApproveBusy(false);
    }
  };

  return (
    <MainLayout title="Top-ups">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/wallets" />}>Wallets</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Top-ups</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-border bg-white p-5 md:flex-row md:items-center md:p-6">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#BCF807] text-[#10110E]">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Wallet Top-ups</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review customer top-up requests and credit the wallet once the transfer is confirmed.
          </p>
        </div>
        <div className="rounded-xl border border-border px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total requests</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalEntries}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-border shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending (this page)</p>
              <p className="mt-1 text-xl font-bold text-foreground">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BCF807] text-[#10110E]">
              <WalletIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending amount (this page)</p>
              <p className="mt-1 text-xl font-bold text-foreground">{formatAmount(pendingAmount)} MMK</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#52C41A] text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed (this page)</p>
              <p className="mt-1 text-xl font-bold text-foreground">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ArrowUpRight className="h-5 w-5 text-[#10110E]" />
            Top-up Requests
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={status} onValueChange={(val) => setStatus(val ?? "all")}>
              <SelectTrigger className="h-10 w-full rounded border-border text-xs sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading top-up requests...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : topupList.length === 0 ? (
            <p className="text-sm text-slate-500">No top-up requests found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Paid At</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topupList.map((topup) => (
                      <TableRow key={topup.id}>
                        <TableCell>
                          <div className="font-mono text-xs font-semibold text-foreground">{topup.reference ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">#{topup.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{topup.user?.full_name || "—"}</div>
                          <div className="mb-1 text-xs text-muted-foreground">{topup.user?.phone_number || "—"}</div>
                          {topup.user?.role?.name && (
                            <span className="inline-flex rounded border border-[#BCF807] bg-[#BCF807] px-2 py-0.5 text-[10px] font-semibold text-[#10110E]">
                              {roleLabel(topup.user.role.name)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{formatAmount(topup.amount)} MMK</div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              topup.status === "completed"
                                ? "border-[#52C41A] bg-white text-[#52C41A]"
                                : topup.status === "pending"
                                  ? "border-amber-400 bg-white text-amber-600"
                                  : "border-border bg-white text-muted-foreground"
                            }`}
                          >
                            {topup.status ?? "pending"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{topup.note || "—"}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(topup.created_at)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(topup.paid_at)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {topup.approver?.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {topup.status === "pending" ? (
                            <Button size="sm" onClick={() => setApproving(topup)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!loading && topupList.length > 0 && (
                <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    Showing {fromEntry} to {toEntry} of {totalEntries} Entries
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span>Show</span>
                      <Select
                        value={perPage.toString()}
                        onValueChange={(val) => {
                          setPerPage(Number(val));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-7 w-[60px] text-xs">
                          <SelectValue placeholder={perPage.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>entries</span>
                    </div>

                    <span>
                      Page {page} of {totalPages}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-slate-200 text-xs shadow-none"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                      >
                        {"<<"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-slate-200 text-xs shadow-none"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                      >
                        {"<"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-slate-200 text-xs shadow-none"
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                      >
                        {">"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-slate-200 text-xs shadow-none"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                      >
                        {">>"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve confirmation dialog */}
      <Dialog open={Boolean(approving)} onOpenChange={(v) => { if (!v) setApproving(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#52C41A]" />
              Approve Top-up
            </DialogTitle>
            <DialogDescription>
              Confirm the transfer has been received. The wallet will be credited immediately.
            </DialogDescription>
          </DialogHeader>
          {approving && (
            <div className="space-y-3 rounded-xl border border-border bg-white p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-semibold text-foreground">{approving.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">User</span>
                <span className="font-medium text-foreground">
                  {approving.user?.full_name || `#${approving.user_id ?? "—"}`}{approving.user?.phone_number ? ` (${approving.user.phone_number})` : ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">{formatAmount(approving.amount)} MMK</span>
              </div>
              {approving.note && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Note</span>
                  <span className="text-foreground">{approving.note}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setApproving(null)} disabled={approveBusy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleApprove()} disabled={approveBusy}>
              {approveBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve & Credit Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
