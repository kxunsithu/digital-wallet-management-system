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
import { getAgents, deleteAgent } from "@/services/agent.service";
import { getStateRegions, getTownships } from "@/services/location.service";

export default function AgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
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

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await getAgents({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
        state_region_id: regionId || undefined,
        township_id: townshipId || undefined,
      });
      setAgents(response.data.data);

      const meta = response.data.meta;
      if (meta) {
        setTotalEntries(meta.total);
        setTotalPages(meta.last_page);
        setFromEntry(meta.from || 0);
        setToEntry(meta.to || 0);
      }
    } catch (err) {
      const error = err as any;
      toast.error(error?.response?.data?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page, perPage, debouncedSearch, status, regionId, townshipId]);

  useEffect(() => {
    setPage(1);
  }, [status, regionId, townshipId]);

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setRegionId("");
    setTownshipId("");
    setPage(1);
    setTimeout(() => fetchAgents(), 0);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAgent(deleteId);
      toast.success("Agent deleted");
      fetchAgents();
    } catch (err) {
      const error = err as any;
      toast.error(error?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <MainLayout title="Agents">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Agents</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Card className="mb-6 shadow-sm border-slate-100">
        <div className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, phone, agent code, or shop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={status} onValueChange={(val) => setStatus(val as string)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">all statuses</SelectItem>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="inactive">inactive</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
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
                Agent
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Agent Code
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Shop Name
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                State/Region &amp; Township
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">
                Status
              </TableHead>
              <TableHead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider px-6 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No agents found.
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent, index) => (
                <TableRow
                  key={agent.id}
                  className="hover:bg-slate-50/40 transition-colors border-b border-slate-100 last:border-0"
                >
                  <TableCell className="px-6 py-4 text-slate-500 text-sm">
                    {(page - 1) * perPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {agent.user?.full_name?.charAt(0) || (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">
                          {agent.user?.full_name || "-"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {agent.user?.phone_number || "-"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-slate-700 text-sm">
                    {agent.agent_code}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-slate-600 text-sm">
                    {agent.shop_name || "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium text-slate-800">
                        {agent.state_region?.name || "-"}
                      </p>
                      {agent.township?.name && (
                        <p className="text-slate-500 text-xs">{agent.township.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        agent.status === "active"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : agent.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {agent.status || "inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-50 text-slate-600 shadow-none"
                        onClick={() => navigate(`/agents/${agent.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 shadow-none"
                        onClick={() => setDeleteId(agent.id)}
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

        {!loading && agents.length > 0 && (
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
              Are you sure you want to delete this agent? This action cannot be undone.
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
