import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, Wallet as WalletIcon } from "lucide-react";
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
import { getWallet, getWallets, toggleWalletStatus } from "@/services/wallet.service";

type WalletRecord = {
  id: number;
  user_id?: number;
  wallet_number?: string;
  balance?: number | string;
  currency?: string;
  status?: string;
  user?: {
    id?: number;
    full_name?: string;
    phone_number?: string;
    role_id?: number;
  };
};

type WalletListResponse = {
  data?: WalletRecord[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
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

  const walletList = useMemo(() => wallets ?? [], [wallets]);

  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true);
        const response = await getWallets({ page: 1, per_page: 100 });
        const payload = response.data?.data as WalletListResponse | undefined;
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        setWallets(items);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load wallets.");
      } finally {
        setLoading(false);
      }
    };

    void loadWallets();
  }, []);

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

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <WalletIcon className="h-5 w-5" />
              Wallets List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading wallets...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : walletList.length === 0 ? (
              <p className="text-sm text-slate-500">No wallets found.</p>
            ) : (
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
                      <TableRow key={wallet.id} className={id && Number(id) === wallet.id ? "bg-slate-50" : ""}>
                        <TableCell>
                          <div className="font-medium text-slate-900">{wallet.wallet_number ?? "—"}</div>
                          <div className="text-xs text-slate-500">#{wallet.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{wallet.user?.full_name || "—"}</div>
                          <div className="text-xs text-slate-500">{wallet.user?.phone_number || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {formatBalance(wallet.balance)} {wallet.currency ?? "MMK"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${wallet.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-700"}`}>
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
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Wallet Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!id ? (
              <p className="text-sm text-slate-500">Select a wallet from the list to view details.</p>
            ) : detailsLoading ? (
              <p className="text-sm text-slate-500">Loading details...</p>
            ) : selectedWallet ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Wallet Number</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{selectedWallet.wallet_number ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Balance</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatBalance(selectedWallet.balance)} {selectedWallet.currency ?? "MMK"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{selectedWallet.status ?? "active"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{selectedWallet.user?.full_name || "—"}</p>
                  <p className="text-sm text-slate-500">{selectedWallet.user?.phone_number || "—"}</p>
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
