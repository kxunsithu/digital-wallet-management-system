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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Edit2, Search } from "lucide-react";
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

  // Search & client-side pagination states
  const [regionSearch, setRegionSearch] = useState("");
  const [regionPage, setRegionPage] = useState(1);
  const [regionPerPage, setRegionPerPage] = useState(5);

  const [townshipSearch, setTownshipSearch] = useState("");
  const [townshipPage, setTownshipPage] = useState(1);
  const [townshipPerPage, setTownshipPerPage] = useState(5);

  // Controlled delete dialog state
  const [deleteRegionId, setDeleteRegionId] = useState<number | null>(null);
  const [deleteTownshipId, setDeleteTownshipId] = useState<number | null>(null);

  // Controlled edit dialog state
  const [editRegion, setEditRegion] = useState<{ id: number; name: string } | null>(null);
  const [editTownship, setEditTownship] = useState<{ id: number; name: string; state_region_id: string } | null>(null);

  const fetchRegions = async () => {
    try {
      const res = await getStateRegions();
      setRegions(res.data.data);
    } catch (err) {
      toast.error("Failed to load regions");
    }
  };

  const fetchTownships = async () => {
    try {
      const res = await getTownships();
      setTownships(res.data.data);
    } catch (err) {
      toast.error("Failed to load townships");
    }
  };

  useEffect(() => {
    fetchRegions();
    fetchTownships();
  }, []);

  useEffect(() => {
    setRegionPage(1);
  }, [regionSearch]);

  useEffect(() => {
    setTownshipPage(1);
  }, [townshipSearch]);

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
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to delete township");
    } finally {
      setDeleteTownshipId(null);
    }
  };

  // Client-side filtering & pagination calculation for Region
  const filteredRegions = regions.filter(r => r.name.toLowerCase().includes(regionSearch.toLowerCase()));
  const totalRegions = filteredRegions.length;
  const totalRegionPages = Math.ceil(totalRegions / regionPerPage) || 1;
  const paginatedRegions = filteredRegions.slice((regionPage - 1) * regionPerPage, regionPage * regionPerPage);
  const regionFrom = totalRegions === 0 ? 0 : (regionPage - 1) * regionPerPage + 1;
  const regionTo = Math.min(regionPage * regionPerPage, totalRegions);

  // Client-side filtering & pagination calculation for Township
  const filteredTownships = townships.filter(t =>
    t.name.toLowerCase().includes(townshipSearch.toLowerCase()) ||
    t.state_region?.name?.toLowerCase().includes(townshipSearch.toLowerCase())
  );
  const totalTownships = filteredTownships.length;
  const totalTownshipPages = Math.ceil(totalTownships / townshipPerPage) || 1;
  const paginatedTownships = filteredTownships.slice((townshipPage - 1) * townshipPerPage, townshipPage * townshipPerPage);
  const townshipFrom = totalTownships === 0 ? 0 : (townshipPage - 1) * townshipPerPage + 1;
  const townshipTo = Math.min(townshipPage * townshipPerPage, totalTownships);

  return (
    <MainLayout title="Manage Locations">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Regions */}
        <Card className="shadow-sm border-slate-100 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              States / Regions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/5 flex flex-col gap-3">
              <form onSubmit={handleAddRegion} className="flex gap-2">
                <Input
                  placeholder="Add e.g. Yangon Region"
                  value={newRegionName}
                  onChange={(e) => setNewRegionName(e.target.value)}
                  className="h-9 text-sm"
                />
                <Button type="submit" size="sm" className="h-9">Add</Button>
              </form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filter state/regions..."
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/30 hover:bg-transparent">
                  <TableHead className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-16">No</TableHead>
                  <TableHead className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">Name</TableHead>
                  <TableHead className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRegions.map((r, index) => (
                  <TableRow key={r.id} className="border-b border-slate-100 hover:bg-slate-50/40 last:border-0">
                    <TableCell className="px-4 py-3 text-slate-500 text-sm">
                      {(regionPage - 1) * regionPerPage + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-slate-800 text-sm">{r.name}</TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md border-slate-200 hover:bg-slate-50 text-slate-600 shadow-none"
                          onClick={() => setEditRegion({ id: r.id, name: r.name })}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 shadow-none"
                          onClick={() => setDeleteRegionId(r.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {totalRegions === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-slate-500 text-sm">
                      No regions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalRegions > 0 && (
              <div className="border-t border-slate-100 py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/30 text-slate-500 text-xs">
                <div>
                  Showing {regionFrom} to {regionTo} of {totalRegions} Entries
                </div>
                <div className="flex items-center gap-3">
                  <Select value={regionPerPage.toString()} onValueChange={(val) => {
                    setRegionPerPage(Number(val));
                    setRegionPage(1);
                  }}>
                    <SelectTrigger className="w-[55px] h-7 text-xs">
                      <SelectValue placeholder={regionPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>

                  <span>Page {regionPage} of {totalRegionPages}</span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setRegionPage(1)}
                      disabled={regionPage === 1}
                    >
                      {"<<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setRegionPage(prev => Math.max(prev - 1, 1))}
                      disabled={regionPage === 1}
                    >
                      {"<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setRegionPage(prev => Math.min(prev + 1, totalRegionPages))}
                      disabled={regionPage === totalRegionPages}
                    >
                      {">"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setRegionPage(totalRegionPages)}
                      disabled={regionPage === totalRegionPages}
                    >
                      {">>"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Townships */}
        <Card className="shadow-sm border-slate-100 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/20 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              Townships
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/5 flex flex-col gap-3">
              <form onSubmit={handleAddTownship} className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedRegionId} onValueChange={(val) => setSelectedRegionId(val || "")}>
                  <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm">
                    <SelectValue placeholder="Select State/Region">
                      {(val: string | null) => val ? regions.find(r => r.id.toString() === val)?.name || val : "Select State/Region"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Add e.g. Hlaing"
                  value={newTownshipName}
                  onChange={(e) => setNewTownshipName(e.target.value)}
                  className="h-9 text-sm flex-1"
                />
                <Button type="submit" size="sm" className="h-9">Add</Button>
              </form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filter townships..."
                  value={townshipSearch}
                  onChange={(e) => setTownshipSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50/30 hover:bg-transparent">
                  <TableHead className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 py-2.5 w-16">No</TableHead>
                  <TableHead className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">Name</TableHead>
                  <TableHead className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4">State/Region</TableHead>
                  <TableHead className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTownships.map((t, index) => (
                  <TableRow key={t.id} className="border-b border-slate-100 hover:bg-slate-50/40 last:border-0">
                    <TableCell className="px-4 py-3 text-slate-500 text-sm">
                      {(townshipPage - 1) * townshipPerPage + index + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-slate-800 text-sm">{t.name}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200/50">
                        {t.state_region?.name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md border-slate-200 hover:bg-slate-50 text-slate-600 shadow-none"
                          onClick={() => setEditTownship({ id: t.id, name: t.name, state_region_id: t.state_region_id?.toString() || "" })}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 rounded-md border-red-100 hover:bg-red-50 text-red-500 hover:text-red-700 shadow-none"
                          onClick={() => setDeleteTownshipId(t.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {totalTownships === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-slate-500 text-sm">
                      No townships found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalTownships > 0 && (
              <div className="border-t border-slate-100 py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/30 text-slate-500 text-xs">
                <div>
                  Showing {townshipFrom} to {townshipTo} of {totalTownships} Entries
                </div>
                <div className="flex items-center gap-3">
                  <Select value={townshipPerPage.toString()} onValueChange={(val) => {
                    setTownshipPerPage(Number(val));
                    setTownshipPage(1);
                  }}>
                    <SelectTrigger className="w-[55px] h-7 text-xs">
                      <SelectValue placeholder={townshipPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>

                  <span>Page {townshipPage} of {totalTownshipPages}</span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setTownshipPage(1)}
                      disabled={townshipPage === 1}
                    >
                      {"<<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setTownshipPage(prev => Math.max(prev - 1, 1))}
                      disabled={townshipPage === 1}
                    >
                      {"<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setTownshipPage(prev => Math.min(prev + 1, totalTownshipPages))}
                      disabled={townshipPage === totalTownshipPages}
                    >
                      {">"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-md border-slate-200 shadow-none text-xs"
                      onClick={() => setTownshipPage(totalTownshipPages)}
                      disabled={townshipPage === totalTownshipPages}
                    >
                      {">>"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Delete Region Dialog */}
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

      {/* Delete Township Dialog */}
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

      {/* Edit Region Dialog */}
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
              <DialogDescription>
                Update the name of this state/region.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="State/Region name"
                value={editRegion?.name || ""}
                onChange={(e) => setEditRegion(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" onClick={() => setEditRegion(null)}>Cancel</Button>} />
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Township Dialog */}
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
              <DialogDescription>
                Update the name or state/region for this township.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State/Region</label>
                <Select
                  value={editTownship?.state_region_id || ""}
                  onValueChange={(val) => setEditTownship(prev => prev ? { ...prev, state_region_id: val || "" } : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select State/Region">
                      {(val: string | null) => val ? regions.find(r => r.id.toString() === val)?.name || val : "Select State/Region"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Township Name</label>
                <Input
                  placeholder="Township name"
                  value={editTownship?.name || ""}
                  onChange={(e) => setEditTownship(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" onClick={() => setEditTownship(null)}>Cancel</Button>} />
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}
