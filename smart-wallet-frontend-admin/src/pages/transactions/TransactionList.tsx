import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Eye, SlidersHorizontal, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getTransactions } from "@/services/transaction.service";

type Props = {
  filterParams?: Record<string, any>;
  pageTitle?: string;
};

export default function TransactionList({ filterParams = {}, pageTitle = "Transactions" }: Props) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [transactionType, setTransactionType] = useState("all");
  const [status, setStatus] = useState("all");

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [fromEntry, setFromEntry] = useState(0);
  const [toEntry, setToEntry] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const load = async (pageNumber = page, pageSize = perPage) => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        ...filterParams,
        page: pageNumber,
        per_page: pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (transactionType !== "all") params.transaction_type = transactionType;
      if (status !== "all") params.status = status;

      const res = await getTransactions(params);
      const resData = res.data;

      const itemsList = Array.isArray(resData?.data)
        ? resData.data
        : Array.isArray(resData)
          ? resData
          : [];
      const meta = resData?.meta || resData?.pagination || {};

      setItems(itemsList);

      const total = meta?.total ?? itemsList.length;
      const lastPage = meta?.last_page ?? (total > 0 ? Math.ceil(total / pageSize) : 1);
      const from = meta?.from ?? (itemsList.length > 0 ? (pageNumber - 1) * pageSize + 1 : 0);
      const to = meta?.to ?? (itemsList.length > 0 ? (pageNumber - 1) * pageSize + itemsList.length : 0);

      setTotalEntries(total);
      setTotalPages(lastPage);
      setFromEntry(from);
      setToEntry(to);
    } catch {
      setItems([]);
      setTotalEntries(0);
      setTotalPages(1);
      setFromEntry(0);
      setToEntry(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    void load(1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filterParams), debouncedSearch, transactionType, status]);

  useEffect(() => {
    void load(page, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const handleClearFilters = () => {
    setSearch("");
    setTransactionType("all");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726] text-[#10110E]">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">{pageTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                View, filter, and audit real-time transfer records and fee logs across wallets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6 rounded-2xl border border-border shadow-none">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#D5E726] text-[#10110E]">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Search &amp; Filters</h3>
                <p className="text-xs text-muted-foreground">
                  Narrow transfer records by type, status, or search details.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleClearFilters} className="h-9 rounded-lg">
              Clear filters
            </Button>
          </div>
        </div>
        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(280px,.85fr)_minmax(0,1.55fr)]">
          <div className="rounded-xl border border-border bg-white p-4">
            <label
              htmlFor="transaction-search"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Find a transaction
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="transaction-search"
                placeholder="Search transaction no. or phone number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 border-[#D5E726] pl-10 focus-visible:ring-[#D5E726]/30"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Refine results
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Transaction Type</label>
                <Select
                  value={transactionType}
                  onValueChange={(val: string | null) => {
                    setTransactionType(val || "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="admin_to_agent_manager">Admin to Agent Manager</SelectItem>
                    <SelectItem value="manager_to_agent">Manager to Agent</SelectItem>
                    <SelectItem value="manager_to_admin">Manager to Admin</SelectItem>
                    <SelectItem value="agent_to_customer">Agent to Customer</SelectItem>
                    <SelectItem value="agent_to_agent_manager">Agent to Agent Manager</SelectItem>
                    <SelectItem value="customer_to_customer">Customer to Customer</SelectItem>
                    <SelectItem value="customer_to_agent">Customer to Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Status</label>
                <Select
                  value={status}
                  onValueChange={(val: string | null) => {
                    setStatus(val || "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Transaction Directory</h3>
            <p className="text-xs text-muted-foreground">
              {totalEntries} total transactions recorded
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#D5E726] px-3 py-1 text-xs font-bold text-[#10110E]">
            Audited logs
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 py-4 w-16">
                No
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Transaction No
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Type
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Sender / Receiver
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 text-right">
                Amount
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 text-right">
                Fee
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Status
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Date &amp; Time
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((tx: any, index: number) => (
                <TableRow
                  key={tx.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-[#D5E726]/10"
                >
                  <TableCell className="px-6 py-4 text-slate-500 text-sm">
                    {(page - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono font-medium text-slate-900 text-sm">
                    {tx.transaction_number || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-700">
                      {(tx.transaction_type || "-").replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-800">
                        Sender: {tx.sender_name ? `${tx.sender_name} (${tx.sender_phone || "-"})` : (tx.sender_phone || tx.sender_wallet_id || "-")}
                      </p>
                      <p className="text-slate-500">
                        Receiver: {tx.receiver_name ? `${tx.receiver_name} (${tx.receiver_phone || "-"})` : (tx.receiver_phone || tx.receiver_wallet_id || "-")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                    {new Intl.NumberFormat("en-MM").format(Number(tx.amount || 0))}
                    <span className="ml-1 text-xs font-normal text-slate-500">MMK</span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-medium text-slate-700 text-sm">
                    {new Intl.NumberFormat("en-MM").format(Number(tx.fee || 0))}
                    <span className="ml-1 text-xs text-slate-400">MMK</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        tx.status === "completed"
                          ? "border border-[#52C41A] bg-white text-[#52C41A]"
                          : tx.status === "pending"
                            ? "border border-[#D5E726] bg-[#D5E726] text-[#10110E]"
                            : "border border-[#FF4D4F] bg-white text-[#FF4D4F]"
                      }`}
                    >
                      {tx.status || "pending"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-slate-500">
                    {tx.created_at ? new Date(tx.created_at).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg border-border text-foreground shadow-none hover:bg-[#D5E726]"
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {!loading && items.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-white px-6 py-4 text-xs text-muted-foreground sm:flex-row">
            <div>
              Showing {fromEntry} to {toEntry} of {totalEntries} Entries
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <Select
                  value={perPage.toString()}
                  onValueChange={(val: string | null) => {
                    if (val) {
                      setPerPage(Number(val));
                      setPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="w-[60px] h-7 text-xs">
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
                  className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  {"<<"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  {"<"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  {">"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  {">>"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
