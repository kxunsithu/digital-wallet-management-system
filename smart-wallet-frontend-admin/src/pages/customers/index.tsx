import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Eye, Trash2, User } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCustomers, deleteCustomer } from "@/services/customer.service";
import { getStateRegions, getTownships } from "@/services/location.service";

const kycStatusClass = (status?: string) => {
  switch (status) {
    case "verified":
    case "approved":
      return "bg-green-50 text-green-700 border border-green-200";
    case "rejected":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  }
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kycStatus, setKycStatus] = useState("all");
  const [regionId, setRegionId] = useState("");
  const [townshipId, setTownshipId] = useState("");

  const [regionsList, setRegionsList] = useState<any[]>([]);
  const [townshipsList, setTownshipsList] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fromEntry, setFromEntry] = useState(0);
  const [toEntry, setToEntry] = useState(0);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    getStateRegions().then((res) => setRegionsList(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (regionId) {
      getTownships({ state_region_id: regionId })
        .then((res) => setTownshipsList(res.data.data))
        .catch(() => {});
    } else {
      setTownshipsList([]);
    }
  }, [regionId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        kyc_status: kycStatus !== "all" ? kycStatus : undefined,
        state_region_id: regionId || undefined,
        township_id: townshipId || undefined,
      });
      setCustomers(response.data.data);

      const meta = response.data.meta;
      if (meta) {
        setTotalEntries(meta.total);
        setTotalPages(meta.last_page);
        setFromEntry(meta.from || 0);
        setToEntry(meta.to || 0);
      }
    } catch (err) {
      const error = err as any;
      toast.error(error?.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, perPage, debouncedSearch, kycStatus, regionId, townshipId]);

  useEffect(() => {
    setPage(1);
  }, [kycStatus, regionId, townshipId]);

  const handleClearFilters = () => {
    setSearch("");
    setKycStatus("all");
    setRegionId("");
    setTownshipId("");
    setPage(1);
    setTimeout(() => fetchCustomers(), 0);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCustomer(deleteId);
      toast.success("Customer deleted");
      fetchCustomers();
    } catch (err) {
      const error = err as any;
      toast.error(error?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <MainLayout title="Customers">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Customers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="mb-6 shadow-sm border-slate-100">
        <div className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, or referral code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={kycStatus} onValueChange={(val) => setKycStatus(val as string)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all KYC</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="verified">verified</SelectItem>
                <SelectItem value="approved">approved</SelectItem>
                <SelectItem value="rejected">rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={regionId}
              onValueChange={(val) => {
                setRegionId(val === "all" || val === null ? "" : val);
                setTownshipId("");
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="State/Region">
                  {(val: string | null) => {
                    if (!val) return "State/Region";
                    if (val === "all") return "All States/Regions";
                    return regionsList.find((r) => r.id.toString() === val)?.name || val;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States/Regions</SelectItem>
                {regionsList.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={townshipId}
              onValueChange={(val) => setTownshipId(val === "all" || val === null ? "" : val)}
              disabled={!regionId}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Township">
                  {(val: string | null) => {
                    if (!val) return "Township";
                    if (val === "all") return "All Townships";
                    return townshipsList.find((t) => t.id.toString() === val)?.name || val;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Townships</SelectItem>
                {townshipsList.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <div className="rounded bg-white shadow-sm overflow-hidden border border-slate-100">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 py-4 w-16">
                No
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Customer
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Referral Code
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                KYC Status
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                State/Region &amp; Township
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 last:border-0"
                >
                  <TableCell className="px-6 py-4 text-slate-500 text-sm">
                    {(page - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {customer.user?.full_name?.charAt(0) || (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">
                          {customer.user?.full_name || "-"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {customer.user?.phone_number || "-"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-slate-700 text-sm">
                    {customer.referral_code || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${kycStatusClass(customer.kyc_status)}`}
                    >
                      {customer.kyc_status || "pending"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium text-slate-800">
                        {customer.state_region?.name || "-"}
                      </p>
                      {customer.township?.name && (
                        <p className="text-slate-500 text-xs">{customer.township.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-50 text-slate-600 shadow-none"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 shadow-none"
                        onClick={() => setDeleteId(customer.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && customers.length > 0 && (
          <div className="border-t border-slate-100 py-3.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30 text-slate-500 text-xs">
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

      <Dialog
        open={deleteId !== null}
        onOpenChange={(open, details) => {
          if (details?.reason === "outside-press") return;
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>}
            />
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
