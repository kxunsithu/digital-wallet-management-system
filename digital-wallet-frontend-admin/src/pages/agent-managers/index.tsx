import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Edit2, Trash2, Power, SlidersHorizontal, User } from "lucide-react";
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
import {
  getAgentManagers,
  toggleAgentManagerStatus,
  deleteAgentManager,
} from "@/services/agentManager.service";
import { getStateRegions, getTownships } from "@/services/location.service";

export default function AgentManagersPage() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [regionId, setRegionId] = useState("");
  const [townshipId, setTownshipId] = useState("");

  const [regionsList, setRegionsList] = useState<any[]>([]);
  const [townshipsList, setTownshipsList] = useState<any[]>([]);

  // Debounce search state
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fromEntry, setFromEntry] = useState(0);
  const [toEntry, setToEntry] = useState(0);

  useEffect(() => {
    getStateRegions().then(res => setRegionsList(res.data.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (regionId) {
      getTownships({ state_region_id: regionId }).then(res => setTownshipsList(res.data.data)).catch(() => { });
    } else {
      setTownshipsList([]);
    }
  }, [regionId]);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const response = await getAgentManagers({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
        state_region_id: regionId || undefined,
        township_id: townshipId || undefined,
      });
      setManagers(response.data.data);

      const meta = response.data.meta;
      if (meta) {
        setTotalEntries(meta.total);
        setTotalPages(meta.last_page);
        setFromEntry(meta.from || 0);
        setToEntry(meta.to || 0);
      }
    } catch (err) {
      const error = err as any;
      toast.error(error?.response?.data?.message || "Failed to load agent managers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [page, perPage, debouncedSearch, status, regionId, townshipId]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, regionId, townshipId]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setRegionId("");
    setTownshipId("");
    setPage(1);
    setTimeout(() => fetchManagers(), 0);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleAgentManagerStatus(id);
      toast.success("Status updated");
      fetchManagers();
    } catch (err) {
      const error = err as any;
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAgentManager(deleteId);
      toast.success("Agent Manager deleted");
      fetchManagers();
    } catch (err) {
      const error = err as any;
      toast.error(error?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  const activeManagers = managers.filter((manager) => manager.status === "active").length;

  return (
    <MainLayout title="Agent Managers">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Agent Managers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BDF40B] text-[#10110E]"><User className="h-6 w-6" /></div>
            <div><h2 className="text-xl font-bold tracking-tight text-foreground">Agent Managers</h2><p className="mt-1 text-sm text-muted-foreground">Manage manager accounts, KYC records, and operating locations.</p></div>
          </div>
          <Button onClick={() => navigate("/agent-managers/create")} className="h-11 rounded-lg bg-[#BDF40B] px-5 font-semibold text-[#10110E] hover:bg-[#BDF40B]">
            <Plus className="mr-2 h-4 w-4" /> Create Agent Manager
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6 rounded-2xl border border-border shadow-none">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#BDF40B] text-[#10110E]"><SlidersHorizontal className="h-4 w-4" /></div><div><h3 className="text-sm font-semibold text-foreground">Search & Filters</h3><p className="text-xs text-muted-foreground">Narrow the manager directory by location or account status.</p></div></div>
            <Button variant="outline" onClick={handleClearFilters} className="h-9 rounded-lg">Clear filters</Button>
          </div>
        </div>
        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(280px,.85fr)_minmax(0,1.55fr)]">
          <div className="rounded-xl border border-border bg-white p-4">
            <label htmlFor="manager-search" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Find a manager</label>
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="manager-search" placeholder="Search name, phone, or NRC number" value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 border-[#BDF40B] pl-10 focus-visible:ring-[#BDF40B]/30" /></div>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Refine results</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Account status</label>
                <Select value={status} onValueChange={(val) => setStatus(val as string)}>
                  <SelectTrigger className="h-12 w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">State / Region</label>
                <Select value={regionId} onValueChange={(val) => { setRegionId(val === "all" || val === null ? "" : val); setTownshipId(""); }}>
                  <SelectTrigger className="h-12 w-full"><SelectValue placeholder="State/Region">{(val: string | null) => { if (!val) return "All states"; if (val === "all") return "All states"; return regionsList.find(r => r.id.toString() === val)?.name || val; }}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="all">All States/Regions</SelectItem>{regionsList.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Township</label>
                <Select value={townshipId} onValueChange={(val) => setTownshipId(val === "all" || val === null ? "" : val)} disabled={!regionId}>
                  <SelectTrigger className="h-12 w-full"><SelectValue placeholder="Township">{(val: string | null) => { if (!val) return "All townships"; if (val === "all") return "All townships"; return townshipsList.find(t => t.id.toString() === val)?.name || val; }}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Townships</SelectItem>{townshipsList.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-semibold text-foreground">Manager Directory</h3><p className="text-xs text-muted-foreground">{totalEntries} total managers · {activeManagers} active on this page</p></div>
          <span className="w-fit rounded-full bg-[#BDF40B] px-3 py-1 text-xs font-bold text-[#10110E]">KYC managed</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 py-4 w-16">No</TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">Agent Manager</TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">Manager Code</TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">NRC Number</TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">State/Region &amp; Township</TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">Status</TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : managers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No agent managers found.
                </TableCell>
              </TableRow>
            ) : (
              managers.map((manager, index) => (
                <TableRow key={manager.id} className="border-b border-border transition-colors last:border-0 hover:bg-[#BDF40B]/10">
                  <TableCell className="px-6 py-4 text-slate-500 text-sm">
                    {(page - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#BDF40B] text-sm font-semibold text-[#10110E]">
                        {manager.user?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">{manager.user?.full_name || "-"}</span>
                        <span className="text-xs text-slate-500">{manager.user?.phone_number || "-"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-slate-700 text-sm">{manager.manager_code}</TableCell>
                  <TableCell className="px-4 py-3 text-slate-600 text-sm">{manager.user?.nrc_number || "-"}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium text-slate-800">{manager.state_region?.name || "-"}</p>
                      {manager.township?.name && (
                        <p className="text-slate-500 text-xs">{manager.township.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${manager.status === "active"
                        ? "border border-[#52C41A] bg-white text-[#52C41A]"
                        : manager.status === "pending"
                          ? "border border-[#BDF40B] bg-[#BDF40B] text-[#10110E]"
                          : "border border-[#FF4D4F] bg-white text-[#FF4D4F]"
                        }`}
                    >
                      {manager.status || "inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg border-border text-foreground shadow-none hover:bg-[#BDF40B]"
                        onClick={() => navigate(`/agent-managers/${manager.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg border-border text-foreground shadow-none hover:bg-[#BDF40B]"
                        onClick={() => handleToggleStatus(manager.id)}
                        title="Toggle Status"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg border-border text-foreground shadow-none hover:bg-[#BDF40B]"
                        onClick={() => navigate(`/agent-managers/${manager.id}/edit`)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-lg border-[#FF4D4F] text-[#FF4D4F] shadow-none hover:bg-white"
                        onClick={() => setDeleteId(manager.id)}
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

        {/* Pagination Footer */}
        {!loading && managers.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-white px-6 py-4 text-xs text-muted-foreground sm:flex-row">
            <div>
              Showing {fromEntry} to {toEntry} of {totalEntries} Entries
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <Select value={perPage.toString()} onValueChange={(val) => {
                  setPerPage(Number(val));
                  setPage(1);
                }}>
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

              <span>Page {page} of {totalPages}</span>

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
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  {"<"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open, details) => {
        if (details?.reason === "outside-press") return;
        if (!open) setDeleteId(null);
      }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agent manager? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>} />
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
