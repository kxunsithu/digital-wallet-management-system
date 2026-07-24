import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Image as ImageIcon } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { NRCInput, validateNrc } from "@/components/NRCInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { createAgentManager } from "@/services/agentManager.service";
import { getStateRegions, getTownships } from "@/services/location.service";

export default function CreateAgentManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // User fields
  const [userForm, setUserForm] = useState({
    phone_number: "",
    full_name: "",
    nrc_number: "",
  });

  // Profile fields
  const [profileForm, setProfileForm] = useState({
    state_region_id: "",
    township_id: "",
  });

  const [regions, setRegions] = useState<any[]>([]);
  const [townships, setTownships] = useState<any[]>([]);

  useEffect(() => {
    getStateRegions().then((res) => setRegions(res.data.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (profileForm.state_region_id) {
      getTownships({ state_region_id: profileForm.state_region_id })
        .then((res) => setTownships(res.data.data))
        .catch(() => { });
    } else {
      setTownships([]);
    }
  }, [profileForm.state_region_id]);

  const [nrcFront, setNrcFront] = useState<File | null>(null);
  const [nrcBack, setNrcBack] = useState<File | null>(null);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (file: File | null, type: "front" | "back") => {
    if (type === "front") setNrcFront(file);
    if (type === "back") setNrcBack(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nrcFront || !nrcBack) {
      toast.error("Both NRC front and back images are required.");
      return;
    }
    const nrcError = validateNrc(userForm.nrc_number);
    if (nrcError) {
      toast.error(nrcError);
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      // Append user fields
      Object.entries(userForm).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      // Append profile fields
      Object.entries(profileForm).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });
      data.append("status", "pending");

      data.append("nrc_front_image", nrcFront);
      data.append("nrc_back_image", nrcBack);

      await createAgentManager(data);
      toast.success("Agent Manager created successfully");
      navigate("/agent-managers");
    } catch (err) {
      const error = err as any;
      const errors = error?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors as Record<string, string[]>)[0]?.[0];
        toast.error(firstError || "Validation failed.");
      } else {
        toast.error(error?.response?.data?.message || "Failed to create agent manager");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Create Agent Manager">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/agent-managers" />}>Agent Managers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#AEFF0B] text-[#10110E]"><User className="h-6 w-6" /></div>
            <div><h2 className="text-xl font-bold tracking-tight text-foreground">New Agent Manager</h2><p className="mt-1 text-sm text-muted-foreground">Set up manager identity, location, and KYC documents.</p></div>
          </div>
          <span className="w-fit rounded-full bg-[#AEFF0B] px-3 py-1.5 text-xs font-bold text-[#10110E]">Pending approval</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* General Information */}
          <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <User className="h-5 w-5 text-[#10110E]" />
                General Information
              </CardTitle>
              <CardDescription className="text-xs">Agent manager personal details and profile settings.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="phone_number" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number <span className="text-[#FF4D4F]">*</span></Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={userForm.phone_number}
                    onChange={handleUserChange}
                    required
                    placeholder="e.g. 09xxxxxxxxx"
                    className="h-11 rounded text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={userForm.full_name}
                    onChange={handleUserChange}
                    placeholder="e.g. Ko Aung"
                    className="h-11 rounded text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <NRCInput value={userForm.nrc_number} onChange={(nrc_number) => setUserForm((prev) => ({ ...prev, nrc_number }))} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state_region_id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State/Region</Label>
                  <Select
                    value={profileForm.state_region_id}
                    onValueChange={(val) => {
                      setProfileForm((prev) => ({ ...prev, state_region_id: val || "", township_id: "" }));
                    }}
                  >
                    <SelectTrigger className="h-11 rounded text-sm">
                      <SelectValue placeholder="Select state/region">
                        {(val: string | null) => val ? regions.find(r => r.id.toString() === val)?.name || val : "Select state/region"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="township_id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Township</Label>
                  <Select
                    value={profileForm.township_id}
                    onValueChange={(val) => handleSelectChange(val as string, "township_id")}
                    disabled={!profileForm.state_region_id}
                  >
                    <SelectTrigger className="h-11 rounded text-sm">
                      <SelectValue placeholder="Select township">
                        {(val: string | null) => val ? townships.find(t => t.id.toString() === val)?.name || val : "Select township"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {townships.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* NRC Images */}
          <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <ImageIcon className="h-5 w-5 text-[#10110E]" />
                NRC Images
              </CardTitle>
              <CardDescription className="text-xs">Upload the front and back of the NRC card.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <ImageUpload
                  label="NRC Front Image"
                  required
                  onChange={(file) => handleFileChange(file, "front")}
                />
                <ImageUpload
                  label="NRC Back Image"
                  required
                  onChange={(file) => handleFileChange(file, "back")}
                />
              </div>
            </CardContent>
          </Card>


          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => navigate("/agent-managers")} className="h-11 rounded-lg">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-lg bg-[#AEFF0B] px-6 font-semibold text-[#10110E] hover:bg-[#AEFF0B]" >
              {loading ? "Creating..." : "Create Agent Manager"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
