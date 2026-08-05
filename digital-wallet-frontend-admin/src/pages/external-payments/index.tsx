import { useEffect, useState, useCallback } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getExternalPayments } from "@/services/externalPayment.service";
import { Search, ShoppingCart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExternalPayment = {
  id: number;
  reference: string;
  external_system?: { id: number; name: string };
  customer?: { full_name?: string; phone_number?: string; role?: { name?: string } };
  agent?: { full_name?: string; phone_number?: string; role?: { name?: string } };
  amount: number | string;
  fee: number | string;
  order_reference?: string | null;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-300 bg-amber-100 text-amber-700",
  completed: "border-[#BCF807] bg-[#BCF807]/15 text-[#10110E]",
  expired: "border-border bg-slate-100 text-muted-foreground",
  failed: "border-red-200 bg-red-50 text-red-600",
};

export default function ExternalPaymentsPage() {
  const [payments, setPayments] = useState<ExternalPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await getExternalPayments(params);
      const payload = res.data.data;
      setPayments(payload.data || []);
      setTotal(payload.total || 0);
    } catch {
      toast.error("Failed to load external payments");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalPages = Math.ceil(total / perPage) || 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const formatAmount = (value: number | string) =>
    Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <MainLayout title="External Payments">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BCF807] text-[#10110E]">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">External Payments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Payments initiated by external systems against customer or agent wallets.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {total} Payments
        </span>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reference, order, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 pl-10 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val || "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-full sm:w-[180px] text-sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="bg-slate-50/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-14">
                No
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reference
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                System
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sender
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Agent
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fee
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p, index) => (
                <TableRow
                  key={p.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-[#BCF807]/10"
                >
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {(page - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-foreground">{p.reference}</p>
                      {p.order_reference ? (
                        <p className="text-xs text-muted-foreground">Order: {p.order_reference}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-foreground">
                    {p.external_system?.name || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{p.customer?.full_name || "—"}</p>
                      {p.customer?.role?.name ? (
                        <Badge variant="outline" className="border-slate-200 bg-slate-100 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {p.customer.role.name}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.customer?.phone_number || ""}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{p.agent?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{p.agent?.phone_number || ""}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    {formatAmount(p.amount)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {formatAmount(p.fee)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className={STATUS_STYLES[p.status] || "border-border bg-slate-100 text-muted-foreground"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  No external payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-slate-50/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row">
            <div>
              Showing {from} to {to} of {total} Entries
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <Select
                  value={perPage.toString()}
                  onValueChange={(val) => {
                    if (val) {
                      setPerPage(Number(val));
                      setPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 w-[55px] text-xs">
                    <SelectValue placeholder={perPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                {(["<<", "<", ">", ">>"] as const).map((label, i) => {
                  const targets = [1, Math.max(page - 1, 1), Math.min(page + 1, totalPages), totalPages];
                  const disabled = i < 2 ? page === 1 : page === totalPages;
                  return (
                    <Button
                      key={label}
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 text-xs shadow-none"
                      onClick={() => setPage(targets[i])}
                      disabled={disabled}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
