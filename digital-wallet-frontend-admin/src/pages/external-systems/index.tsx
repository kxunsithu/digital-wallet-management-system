import { useEffect, useState, useCallback } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getExternalSystems,
  updateExternalSystem,
  deleteExternalSystem,
  toggleExternalSystemStatus,
} from "@/services/externalSystem.service";
import { Search, Trash2, Edit2, PlugZap } from "lucide-react";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExternalSystem = {
  id: number;
  name: string;
  api_key_prefix: string;
  system_link?: string | null;
  status: string;
  created_at: string;
  user?: {
    id: number;
    full_name?: string;
    phone_number?: string;
  } | null;
};

export default function ExternalSystemsPage() {
  const [systems, setSystems] = useState<ExternalSystem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [editTarget, setEditTarget] = useState<ExternalSystem | null>(null);
  const [editName, setEditName] = useState("");
  const [editLink, setEditLink] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ExternalSystem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await getExternalSystems(params);
      const payload = res.data.data;
      setSystems(payload.data || []);
      setTotal(payload.total || 0);
    } catch {
      toast.error("Failed to load external systems");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter]);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const openEdit = (system: ExternalSystem) => {
    setEditTarget(system);
    setEditName(system.name);
    setEditLink(system.system_link || "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    setSavingEdit(true);
    try {
      const res = await updateExternalSystem(editTarget.id, {
        name: editName.trim(),
        system_link: editLink.trim() || null,
      });
      toast.success(res.data.message || "External system updated");
      setEditTarget(null);
      await fetchSystems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update external system");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggle = async (system: ExternalSystem) => {
    try {
      const res = await toggleExternalSystemStatus(system.id);
      toast.success(res.data.message || "Status updated");
      await fetchSystems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteExternalSystem(deleteTarget.id);
      toast.success(res.data.message || "External system deleted");
      setDeleteTarget(null);
      await fetchSystems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete external system");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / perPage) || 1;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <MainLayout title="External Systems">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BCF807] text-[#10110E]">
            <PlugZap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">External Systems</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage API integrations that accept payments from customer wallets.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
                Name
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Agent
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                System Link
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                API Key
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Created
              </TableHead>
              <TableHead className="bg-slate-50/50 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              systems.map((s, index) => (
                <TableRow
                  key={s.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-[#BCF807]/10"
                >
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {(page - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                    {s.name}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {s.user?.full_name || "-"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.user?.phone_number || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {s.system_link ? (
                      <a
                        href={s.system_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[200px] truncate text-sm text-blue-600 underline decoration-dotted underline-offset-2 hover:text-blue-800"
                        title={s.system_link}
                      >
                        {s.system_link}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {s.api_key_prefix ? (
                      <code className="rounded-md border border-border bg-slate-50 px-2 py-1 font-mono text-xs text-muted-foreground">
                        {s.api_key_prefix}••••••••••
                      </code>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not generated</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        s.status === "active"
                          ? "border-[#BCF807] bg-[#BCF807]/15 text-[#10110E]"
                          : "border-border bg-slate-100 text-muted-foreground"
                      }
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border shadow-none hover:bg-[#BCF807]"
                        onClick={() => openEdit(s)}
                        title="Edit name"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-border text-xs shadow-none"
                        onClick={() => void handleToggle(s)}
                        title="Toggle status"
                      >
                        {s.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-red-100 text-red-500 shadow-none hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteTarget(s)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && systems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No external systems found
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

      {/* Edit Dialog */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open, details) => {
          if (details?.reason === "outside-press") return;
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit External System</DialogTitle>
              <DialogDescription>Update the name and system link of this integration.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">System Name</label>
                <Input
                  placeholder="System name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">System Link (Web)</label>
                <Input
                  type="url"
                  placeholder="e.g. https://shopkart.com"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>} />
              <Button
                type="submit"
                disabled={savingEdit || !editName.trim()}
                className="bg-[#BCF807] font-semibold text-[#10110E] hover:bg-[#BCF807]/90"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open, details) => {
          if (details?.reason === "outside-press") return;
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete External System</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.name ? `"${deleteTarget.name}"` : "this system"}? Its API key will stop working immediately. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>} />
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}
