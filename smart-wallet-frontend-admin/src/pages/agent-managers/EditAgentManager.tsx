import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { User, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { NRCInput, validateNrc } from "@/components/NRCInput";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { getAgentManager, updateAgentManager } from "@/services/agentManager.service";
import { getStateRegions, getTownships } from "@/services/location.service";

export default function EditAgentManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // User fields
  const [userForm, setUserForm] = useState({
    full_name: "",
    nrc_number: "",
    phone_number: "",
  });

  // Profile fields
  const [profileForm, setProfileForm] = useState({
    manager_code: "",
    state_region_id: "",
    township_id: "",
    status: "pending",
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
  const [nrcFrontUrl, setNrcFrontUrl] = useState<string | null>(null);
  const [nrcBackUrl, setNrcBackUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const response = await getAgentManager(id!);
        const data = response.data.data;
        const user = data.user ?? {};

        setUserForm({
          full_name: user.full_name || "",
          nrc_number: user.nrc_number || "",
          phone_number: user.phone_number || "",
        });

        setProfileForm({
          manager_code: data.manager_code || "",
          state_region_id: data.state_region_id?.toString() || "",
          township_id: data.township_id?.toString() || "",
          status: data.status || "pending",
        });

        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') + '/storage/';
        const frontImg = user.images?.find((img: any) => img.image_type === "nrc_front_image");
        const backImg = user.images?.find((img: any) => img.image_type === "nrc_back_image");

        if (frontImg) setNrcFrontUrl(baseUrl + frontImg.image_path);
        if (backImg) setNrcBackUrl(baseUrl + backImg.image_path);
      } catch (err) {
        toast.error("Failed to load agent manager details");
        navigate("/agent-managers");
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchManager();
  }, [id, navigate]);

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
    const nrcError = validateNrc(userForm.nrc_number);
    if (nrcError) {
      toast.error(nrcError);
      return;
    }
    try {
      setLoading(true);

      const payload = new FormData();
      Object.entries(userForm).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });
      Object.entries(profileForm).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });

      if (nrcFront) payload.append("nrc_front_image", nrcFront);
      if (nrcBack) payload.append("nrc_back_image", nrcBack);

      await updateAgentManager(id!, payload);
      toast.success("Agent Manager updated successfully");
      navigate("/agent-managers");
    } catch (err) {
      const error = err as any;
      const errors = error?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors as Record<string, string[]>)[0]?.[0];
        toast.error(firstError || "Validation failed.");
      } else {
        toast.error(error?.response?.data?.message || "Failed to update agent manager");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Edit Agent Manager">
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
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        {fetching ? (
          <div className="py-20 text-center text-slate-500">Loading...</div>
        ) : (
          <>
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BDF40B] text-[#10110E]"><User className="h-6 w-6" /></div>
              <div><h2 className="text-xl font-bold tracking-tight text-foreground">Edit Agent Manager</h2><p className="mt-1 text-sm text-muted-foreground">Review identity, KYC information, and operating location.</p></div>
            </div>
            <span className="w-fit rounded-full border border-border px-3 py-1.5 text-xs font-bold capitalize text-foreground">{profileForm.status}</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* General Information */}
            <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
              <CardHeader className="border-b border-border py-5">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <User className="h-5 w-5 text-[#10110E]" />
                  General Information
                </CardTitle>
                <CardDescription className="text-xs">Update the agent manager personal details and profile settings.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="manager_code" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Manager Code</Label>
                    <Input
                      id="manager_code"
                      name="manager_code"
                      value={profileForm.manager_code}
                      disabled
                      className="h-11 cursor-not-allowed rounded border-border bg-white text-sm text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone_number" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone Number</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={userForm.phone_number}
                      disabled
                      className="h-11 cursor-not-allowed rounded border-border bg-white text-sm text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={userForm.full_name}
                      onChange={handleUserChange}
                      placeholder="e.g. Ko Aung"
                      className="h-11 rounded text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <NRCInput value={userForm.nrc_number} onChange={(nrc_number) => setUserForm((prev) => ({ ...prev, nrc_number }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</Label>
                    <Select
                      value={profileForm.status}
                      onValueChange={(val) => handleSelectChange(val as string, "status")}
                    >
                    <SelectTrigger className="h-11 rounded text-sm">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state_region_id" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">State/Region</Label>
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
                    <Label htmlFor="township_id" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Township</Label>
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
                <CardDescription className="text-xs">Upload to update the front and back of the NRC card.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <ImageUpload
                    label="NRC Front Image"
                    initialPreview={nrcFrontUrl}
                    onChange={(file) => handleFileChange(file, "front")}
                  />
                  <ImageUpload
                    label="NRC Back Image"
                    initialPreview={nrcBackUrl}
                    onChange={(file) => handleFileChange(file, "back")}
                  />
                </div>
              </CardContent>
            </Card>


            <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:justify-end">
              <Button variant="outline" type="button" onClick={() => navigate("/agent-managers")} className="h-11 rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="h-11 rounded-lg bg-[#BDF40B] px-6 font-semibold text-[#10110E] hover:bg-[#BDF40B]">
                {loading ? "Updating..." : "Update Agent Manager"}
              </Button>
            </div>
          </form>
          </>
        )}
      </div>
    </MainLayout>
  );
}
