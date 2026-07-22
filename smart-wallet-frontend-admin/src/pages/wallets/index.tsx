import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CircleDollarSign, Eye, ShieldCheck, Users, Wallet as WalletIcon } from "lucide-react";
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
import { getWallet, getWallets, toggleWalletStatus } from "@/services/wallet.service";

type WalletRecord = {
  id: number;
  user_id?: number;
  wallet_number?: string;
  balance?: number | string;
  
  status?: string;
  user?: {
    id?: number;
    full_name?: string;
    phone_number?: string;
    role_id?: number;
    role?: {
      id?: number;
      name?: string;
      description?: string;
    };
  };
};

type WalletListResponse = {
  data?: WalletRecord[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
};

export default function WalletsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fromEntry, setFromEntry] = useState(0);
  const [toEntry, setToEntry] = useState(0);
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");

  const walletList = useMemo(() => wallets ?? [], [wallets]);
  const visibleBalance = useMemo(
    () => walletList.reduce((total, wallet) => total + Number(wallet.balance ?? 0), 0),
    [walletList],
  );
  const activeWallets = useMemo(
    () => walletList.filter((wallet) => wallet.status === "active").length,
    [walletList],
  );

  useEffect(() => {
    setPage(1);
  }, [status, role]);

  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true);
        const response = await getWallets({
          page,
          per_page: perPage,
          status: status !== "all" ? status : undefined,
          role: role !== "all" ? role : undefined,
        });
        const payload = response.data?.data as WalletListResponse | undefined;
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        setWallets(items);
        setTotalEntries(payload?.total ?? items.length);
        setTotalPages(payload?.last_page ?? 1);
        setFromEntry(payload?.from ?? 0);
        setToEntry(payload?.to ?? 0);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load wallets.");
      } finally {
        setLoading(false);
      }
    };

    void loadWallets();
  }, [page, perPage, status, role]);

  useEffect(() => {
    const loadWalletDetails = async () => {
      if (!id) {
        setSelectedWallet(null);
        return;
      }

      try {
        setDetailsLoading(true);
        const response = await getWallet(id);
        setSelectedWallet(response.data?.data ?? null);
      } catch {
        setSelectedWallet(null);
      } finally {
        setDetailsLoading(false);
      }
    };

    void loadWalletDetails();
  }, [id]);

  const formatBalance = (value?: number | string) => {
    const numericValue = Number(value ?? 0);
    return new Intl.NumberFormat("en-MM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const handleToggleStatus = async (wallet: WalletRecord) => {
    try {
      setTogglingId(wallet.id);
      const response = await toggleWalletStatus(wallet.id);
      const nextStatus = response.data?.status ?? (wallet.status === "active" ? "inactive" : "active");

      setWallets((prev) => prev.map((item) => (item.id === wallet.id ? { ...item, status: nextStatus } : item)));
      setSelectedWallet((prev) => (prev && prev.id === wallet.id ? { ...prev, status: nextStatus } : prev));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update wallet status.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <MainLayout title="Wallets">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Wallets</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-border bg-white p-5 md:flex-row md:items-center md:p-6">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D5E726] text-[#10110E]">
            <WalletIcon className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Wallet Management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Review wallet balances, owners, and account status.</p>
        </div>
        <div className="rounded-xl border border-border px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total wallets</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalEntries}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border border-border shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D5E726] text-[#10110E]"><WalletIcon className="h-5 w-5" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visible wallets</p><p className="mt-1 text-xl font-bold text-foreground">{walletList.length}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#52C41A] text-white"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active wallets</p><p className="mt-1 text-xl font-bold text-foreground">{activeWallets}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10110E] text-white"><CircleDollarSign className="h-5 w-5" /></div>
            <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visible balance</p><p className="mt-1 text-xl font-bold text-foreground">{formatBalance(visibleBalance)} <span className="text-xs font-semibold text-muted-foreground">MMK</span></p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.75fr)]">
        <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
          <CardHeader className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <WalletIcon className="h-5 w-5 text-[#10110E]" />
              All Wallets
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={role} onValueChange={(val) => setRole(val ?? "all")}>
                <SelectTrigger className="h-10 w-full rounded border-border text-xs sm:w-[150px]">
                  <SelectValue placeholder="Owner Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owner Types</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="agent_manager">Agent Manager</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(val) => setStatus(val ?? "all")}>
                <SelectTrigger className="h-10 w-full rounded border-border text-xs sm:w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading wallets...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : walletList.length === 0 ? (
              <p className="text-sm text-slate-500">No wallets found.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walletList.map((wallet) => (
                        <TableRow key={wallet.id} className={id && Number(id) === wallet.id ? "bg-[#D5E726]/20" : "hover:bg-[#D5E726]/10"}>
                          <TableCell>
                            <div className="font-mono font-semibold text-foreground">{wallet.wallet_number ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">#{wallet.id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">{wallet.user?.full_name || "—"}</div>
                            <div className="mb-1 text-xs text-muted-foreground">{wallet.user?.phone_number || "—"}</div>
                            {wallet.user?.role?.name && (
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                'border-[#D5E726] bg-[#D5E726] text-[#10110E]'
                              }`}>
                                {wallet.user.role.name === 'agent_manager'
                                  ? 'Agent Manager'
                                  : wallet.user.role.name.charAt(0).toUpperCase() + wallet.user.role.name.slice(1)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">
                              {formatBalance(wallet.balance)} MMK
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${wallet.status === "active" ? "border-[#52C41A] bg-white text-[#52C41A]" : "border-border bg-white text-muted-foreground"}`}>
                              {wallet.status ?? "active"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/wallets/${wallet.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant={wallet.status === "active" ? "secondary" : "default"}
                                size="sm"
                                onClick={() => void handleToggleStatus(wallet)}
                                disabled={togglingId === wallet.id}
                              >
                                {togglingId === wallet.id
                                  ? "Updating..."
                                  : wallet.status === "active"
                                    ? "Deactivate"
                                    : "Activate"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {!loading && walletList.length > 0 && (
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

        <Card className="h-fit rounded-2xl border border-border shadow-none xl:sticky xl:top-24">
          <CardHeader className="border-b border-border py-5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground"><Users className="h-5 w-5 text-[#10110E]" />Wallet Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!id ? (
              <p className="text-sm text-slate-500">Select a wallet from the list to view details.</p>
            ) : detailsLoading ? (
              <p className="text-sm text-slate-500">Loading details...</p>
            ) : selectedWallet ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wallet Number</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-foreground">{selectedWallet.wallet_number ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-border bg-[#D5E726] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#10110E]">Balance</p>
                  <p className="mt-1 text-lg font-bold text-[#10110E]">
                    {formatBalance(selectedWallet.balance)} MMK
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{selectedWallet.status ?? "active"}</p>
                </div>
                 <div className="rounded-xl border border-border bg-white p-4">
                   <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner</p>
                   <p className="mt-1 text-lg font-semibold text-foreground">{selectedWallet.user?.full_name || "—"}</p>
                   <p className="text-sm text-muted-foreground">{selectedWallet.user?.phone_number || "—"}</p>
                   {selectedWallet.user?.role?.name && (
                     <div className="mt-2">
                       <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                         'border-[#D5E726] bg-[#D5E726] text-[#10110E]'
                       }`}>
                         {selectedWallet.user.role.name === 'agent_manager'
                           ? 'Agent Manager'
                           : selectedWallet.user.role.name.charAt(0).toUpperCase() + selectedWallet.user.role.name.slice(1)}
                       </span>
                     </div>
                   )}
                 </div>
              </div>
            ) : (
              <p className="text-sm text-red-500">Wallet not found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
