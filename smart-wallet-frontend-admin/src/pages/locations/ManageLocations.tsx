import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getStateRegions,
  createStateRegion,
  updateStateRegion,
  deleteStateRegion,
  getTownships,
  createTownship,
  updateTownship,
  deleteTownship,
} from "@/services/location.service";
import { Trash2, Edit2, Search, MapPin, Plus } from "lucide-react";
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

export default function ManageLocations() {
  const [regions, setRegions] = useState<any[]>([]);
  const [townships, setTownships] = useState<any[]>([]);

  const [newRegionName, setNewRegionName] = useState("");
  const [newTownshipName, setNewTownshipName] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");

  const [regionSearch, setRegionSearch] = useState("");
  const [regionPage, setRegionPage] = useState(1);
  const [regionPerPage, setRegionPerPage] = useState(5);

  const [townshipSearch, setTownshipSearch] = useState("");
  const [townshipPage, setTownshipPage] = useState(1);
  const [townshipPerPage, setTownshipPerPage] = useState(5);

  const [deleteRegionId, setDeleteRegionId] = useState<number | null>(null);
  const [deleteTownshipId, setDeleteTownshipId] = useState<number | null>(null);

  const [editRegion, setEditRegion] = useState<{ id: number; name: string } | null>(null);
  const [editTownship, setEditTownship] = useState<{ id: number; name: string; state_region_id: string } | null>(null);

  const fetchRegions = async () => {
    try {
      const res = await getStateRegions();
      setRegions(res.data.data);
    } catch {
      toast.error("Failed to load regions");
    }
  };

  const fetchTownships = async () => {
    try {
      const res = await getTownships();
      setTownships(res.data.data);
    } catch {
      toast.error("Failed to load townships");
    }
  };

  useEffect(() => {
    fetchRegions();
    fetchTownships();
  }, []);

  useEffect(() => { setRegionPage(1); }, [regionSearch]);
  useEffect(() => { setTownshipPage(1); }, [townshipSearch]);

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;
    try {
      await createStateRegion({ name: newRegionName });
      toast.success("Region added");
      setNewRegionName("");
      fetchRegions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add region");
    }
  };

  const handleEditRegionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRegion || !editRegion.name.trim()) return;
    try {
      await updateStateRegion(editRegion.id, { name: editRegion.name });
      toast.success("State/Region updated");
      setEditRegion(null);
      fetchRegions();
      fetchTownships();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update region");
    }
  };

  const handleDeleteRegion = async () => {
    if (!deleteRegionId) return;
    try {
      await deleteStateRegion(deleteRegionId);
      toast.success("Region deleted");
      fetchRegions();
      fetchTownships();
    } catch {
      toast.error("Failed to delete region");
    } finally {
      setDeleteRegionId(null);
    }
  };

  const handleAddTownship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTownshipName.trim() || !selectedRegionId) {
      toast.error("Please provide both name and region.");
      return;
    }
    try {
      await createTownship({ name: newTownshipName, state_region_id: selectedRegionId });
      toast.success("Township added");
      setNewTownshipName("");
      fetchTownships();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add township");
    }
  };

  const handleEditTownshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTownship || !editTownship.name.trim() || !editTownship.state_region_id) {
      toast.error("Please provide both name and region.");
      return;
    }
    try {
      await updateTownship(editTownship.id, {
        name: editTownship.name,
        state_region_id: editTownship.state_region_id,
      });
      toast.success("Township updated");
      setEditTownship(null);
      fetchTownships();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update township");
    }
  };

  const handleDeleteTownship = async () => {
    if (!deleteTownshipId) return;
    try {
      await deleteTownship(deleteTownshipId);
      toast.success("Township deleted");
      fetchTownships();
    } catch {
      toast.error("Failed to delete township");
    } finally {
      setDeleteTownshipId(null);
    }
  };

  // Client-side filtering & pagination for Regions
  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(regionSearch.toLowerCase()),
  );
  const totalRegions = filteredRegions.length;
  const totalRegionPages = Math.ceil(totalRegions / regionPerPage) || 1;
  const paginatedRegions = filteredRegions.slice(
    (regionPage - 1) * regionPerPage,
    regionPage * regionPerPage,
  );
  const regionFrom = totalRegions === 0 ? 0 : (regionPage - 1) * regionPerPage + 1;
  const regionTo = Math.min(regionPage * regionPerPage, totalRegions);

  // Client-side filtering & pagination for Townships
  const filteredTownships = townships.filter(
    (t) =>
      t.name.toLowerCase().includes(townshipSearch.toLowerCase()) ||
      t.state_region?.name?.toLowerCase().includes(townshipSearch.toLowerCase()),
  );
  const totalTownships = filteredTownships.length;
  const totalTownshipPages = Math.ceil(totalTownships / townshipPerPage) || 1;
  const paginatedTownships = filteredTownships.slice(
    (townshipPage - 1) * townshipPerPage,
    townshipPage * townshipPerPage,
  );
  const townshipFrom = totalTownships === 0 ? 0 : (townshipPage - 1) * townshipPerPage + 1;
  const townshipTo = Math.min(townshipPage * townshipPerPage, totalTownships);

  const PaginationControls = ({
    page,
    totalPages,
    totalEntries,
    from,
    to,
    perPage,
    onPageChange,
    onPerPageChange,
  }: {
    page: number;
    totalPages: number;
    totalEntries: number;
    from: number;
    to: number;
    perPage: number;
    onPageChange: (p: number) => void;
    onPerPageChange: (n: number) => void;
  }) => (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-slate-50/30 px-4 py-3 text-xs text-muted-foreground sm:flex-row">
      <div>
        Showing {from} to {to} of {totalEntries} Entries
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span>Show</span>
          <Select
            value={perPage.toString()}
            onValueChange={(val: string | null) => {
              if (val) {
                onPerPageChange(Number(val));
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
                onClick={() => onPageChange(targets[i])}
                disabled={disabled}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Manage Locations">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#AEFF0B] text-[#10110E]">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Manage Locations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add and manage States/Regions and Townships used across the platform.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[#AEFF0B] bg-white px-3 py-1.5 text-xs font-bold text-[#10110E]">
            {regions.length} Regions
          </span>
          <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {townships.length} Townships
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ─── States / Regions Panel ─── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {/* Panel header */}
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">States / Regions</h3>
                <p className="text-xs text-muted-foreground">{totalRegions} records</p>
              </div>
              <span className="rounded-full bg-[#AEFF0B] px-2.5 py-1 text-xs font-bold text-[#10110E]">
                Geo Layer 1
              </span>
            </div>
          </div>

          {/* Add form */}
          <div className="border-b border-border bg-slate-50/30 px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add New Region
            </p>
            <form onSubmit={handleAddRegion} className="flex gap-2">
              <Input
                placeholder="e.g. Yangon Region"
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                className="h-10 flex-1 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="h-10 rounded-lg bg-[#AEFF0B] font-semibold text-[#10110E] hover:bg-[#AEFF0B]/90"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </form>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter regions..."
                value={regionSearch}
                onChange={(e) => setRegionSearch(e.target.value)}
                className="h-10 pl-10 text-sm"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="bg-slate-50/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-14">
                  No
                </TableHead>
                <TableHead className="bg-slate-50/50 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="bg-slate-50/50 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRegions.map((r, index) => (
                <TableRow
                  key={r.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-[#AEFF0B]/10"
                >
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {(regionPage - 1) * regionPerPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                    {r.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border shadow-none hover:bg-[#AEFF0B]"
                        onClick={() => setEditRegion({ id: r.id, name: r.name })}
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-red-100 text-red-500 shadow-none hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteRegionId(r.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {totalRegions === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    No regions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalRegions > 0 && (
            <PaginationControls
              page={regionPage}
              totalPages={totalRegionPages}
              totalEntries={totalRegions}
              from={regionFrom}
              to={regionTo}
              perPage={regionPerPage}
              onPageChange={setRegionPage}
              onPerPageChange={(n) => { setRegionPerPage(n); setRegionPage(1); }}
            />
          )}
        </div>

        {/* ─── Townships Panel ─── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          {/* Panel header */}
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Townships</h3>
                <p className="text-xs text-muted-foreground">{totalTownships} records</p>
              </div>
              <span className="rounded-full border border-border bg-slate-50 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                Geo Layer 2
              </span>
            </div>
          </div>

          {/* Add form */}
          <div className="border-b border-border bg-slate-50/30 px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add New Township
            </p>
            <form onSubmit={handleAddTownship} className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={selectedRegionId}
                onValueChange={(val: string | null) => setSelectedRegionId(val || "")}
              >
                <SelectTrigger className="h-10 w-full text-sm sm:w-[180px]">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="e.g. Hlaing"
                value={newTownshipName}
                onChange={(e) => setNewTownshipName(e.target.value)}
                className="h-10 flex-1 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="h-10 rounded-lg bg-[#AEFF0B] font-semibold text-[#10110E] hover:bg-[#AEFF0B]/90"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </form>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter townships..."
                value={townshipSearch}
                onChange={(e) => setTownshipSearch(e.target.value)}
                className="h-10 pl-10 text-sm"
              />
            </div>
          </div>

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
                  State/Region
                </TableHead>
                <TableHead className="bg-slate-50/50 px-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTownships.map((t, index) => (
                <TableRow
                  key={t.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-[#AEFF0B]/10"
                >
                  <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                    {(townshipPage - 1) * townshipPerPage + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                    {t.name}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="rounded-md border border-border bg-slate-50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {t.state_region?.name || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border shadow-none hover:bg-[#AEFF0B]"
                        onClick={() =>
                          setEditTownship({
                            id: t.id,
                            name: t.name,
                            state_region_id: t.state_region_id?.toString() || "",
                          })
                        }
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-red-100 text-red-500 shadow-none hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteTownshipId(t.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {totalTownships === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No townships found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalTownships > 0 && (
            <PaginationControls
              page={townshipPage}
              totalPages={totalTownshipPages}
              totalEntries={totalTownships}
              from={townshipFrom}
              to={townshipTo}
              perPage={townshipPerPage}
              onPageChange={setTownshipPage}
              onPerPageChange={(n) => { setTownshipPerPage(n); setTownshipPage(1); }}
            />
          )}
        </div>
      </div>

      {/* ─── Delete Region Dialog ─── */}
      <Dialog
        open={deleteRegionId !== null}
        onOpenChange={(open, details) => {
          if (details?.reason === "outside-press") return;
          if (!open) setDeleteRegionId(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete State/Region</DialogTitle>
            <DialogDescription>
              Are you sure? This will also delete associated townships and may break existing data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" onClick={() => setDeleteRegionId(null)}>Cancel</Button>} />
            <Button variant="destructive" onClick={handleDeleteRegion}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Township Dialog ─── */}
      <Dialog
        open={deleteTownshipId !== null}
        onOpenChange={(open, details) => {
          if (details?.reason === "outside-press") return;
          if (!open) setDeleteTownshipId(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Township</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this township? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" onClick={() => setDeleteTownshipId(null)}>Cancel</Button>} />
            <Button variant="destructive" onClick={handleDeleteTownship}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Region Dialog ─── */}
      <Dialog
        open={editRegion !== null}
        onOpenChange={(open, details) => {
          if (details?.reason === "outside-press") return;
          if (!open) setEditRegion(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <form onSubmit={handleEditRegionSubmit}>
            <DialogHeader>
              <DialogTitle>Edit State/Region</DialogTitle>
              <DialogDescription>Update the name of this state/region.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="State/Region name"
                value={editRegion?.name || ""}
                onChange={(e) => setEditRegion((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" onClick={() => setEditRegion(null)}>Cancel</Button>} />
              <Button type="submit" className="bg-[#AEFF0B] font-semibold text-[#10110E] hover:bg-[#AEFF0B]/90">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Township Dialog ─── */}
      <Dialog
        open={editTownship !== null}
        onOpenChange={(open, details) => {
          if (details?.reason === "outside-press") return;
          if (!open) setEditTownship(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <form onSubmit={handleEditTownshipSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Township</DialogTitle>
              <DialogDescription>Update the name or state/region for this township.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  State/Region
                </label>
                <Select
                  value={editTownship?.state_region_id || ""}
                  onValueChange={(val: string | null) =>
                    setEditTownship((prev) => (prev ? { ...prev, state_region_id: val || "" } : null))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select State/Region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Township Name
                </label>
                <Input
                  placeholder="Township name"
                  value={editTownship?.name || ""}
                  onChange={(e) =>
                    setEditTownship((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" onClick={() => setEditTownship(null)}>Cancel</Button>} />
              <Button type="submit" className="bg-[#AEFF0B] font-semibold text-[#10110E] hover:bg-[#AEFF0B]/90">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
