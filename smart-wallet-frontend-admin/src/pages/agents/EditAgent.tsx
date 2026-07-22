import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { User, Image as ImageIcon, Store } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { NRCInput, validateNrc } from "@/components/NRCInput";
import RoleAwareLayout from "@/components/layouts/RoleAwareLayout";
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
import { getAgent, updateAgent } from "@/services/agent.service";
import { getStateRegions, getTownships } from "@/services/location.service";

export default function EditAgent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [userForm, setUserForm] = useState({
    full_name: "",
    nrc_number: "",
    phone_number: "",
  });

  const [profileForm, setProfileForm] = useState({
    agent_code: "",
    shop_name: "",
    shop_address: "",
    state_region_id: "",
    township_id: "",
    status: "pending",
  });

  const [regions, setRegions] = useState<any[]>([]);
  const [townships, setTownships] = useState<any[]>([]);
  const [nrcFront, setNrcFront] = useState<File | null>(null);
  const [nrcBack, setNrcBack] = useState<File | null>(null);

  useEffect(() => {
    getStateRegions().then((res) => setRegions(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (profileForm.state_region_id) {
      getTownships({ state_region_id: profileForm.state_region_id })
        .then((res) => setTownships(res.data.data))
        .catch(() => {});
    } else {
      setTownships([]);
    }
  }, [profileForm.state_region_id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setFetching(true);
        const response = await getAgent(id);
        const agent = response.data.data;
        setUserForm({
          full_name: agent.user?.full_name || "",
          nrc_number: agent.user?.nrc_number || "",
          phone_number: agent.user?.phone_number || "",
        });
        setProfileForm({
          agent_code: agent.agent_code || "",
          shop_name: agent.shop_name || "",
          shop_address: agent.shop_address || "",
          state_region_id: agent.state_region_id?.toString() || agent.state_region?.id?.toString() || "",
          township_id: agent.township_id?.toString() || agent.township?.id?.toString() || "",
          status: agent.status || "pending",
        });
      } catch {
        toast.error("Failed to load agent");
        navigate("/agents");
      } finally {
        setFetching(false);
      }
    };
    void load();
  }, [id, navigate]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const nrcError = validateNrc(userForm.nrc_number);
    if (nrcError) {
      toast.error(nrcError);
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      Object.entries(userForm).forEach(([key, value]) => {
        if (key !== "phone_number" && value) data.append(key, value);
      });

      Object.entries(profileForm).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      if (nrcFront) data.append("nrc_front_image", nrcFront);
      if (nrcBack) data.append("nrc_back_image", nrcBack);

      await updateAgent(id, data);
      toast.success("Agent updated successfully");
      navigate(`/agents/${id}`);
    } catch (err) {
      const error = err as any;
      const errors = error?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors as Record<string, string[]>)[0]?.[0];
        toast.error(firstError || "Validation failed.");
      } else {
        toast.error(error?.response?.data?.message || "Failed to update agent");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <RoleAwareLayout title="Edit Agent">
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      </RoleAwareLayout>
    );
  }

  return (
    <RoleAwareLayout title="Edit Agent">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/agents" />}>Agents</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726] text-[#10110E]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Edit Agent</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update identity, KYC information, and shop location.
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-border px-3 py-1.5 text-xs font-bold capitalize text-foreground">
            {profileForm.status}
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#D5E726] text-[#10110E]">
                  <User className="h-4 w-4" />
                </div>
                General Information
              </CardTitle>
              <CardDescription className="text-xs">Update agent personal details and account settings.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                  <Input value={userForm.phone_number} disabled className="h-11 rounded-lg border-border bg-slate-50 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={userForm.full_name}
                    onChange={handleUserChange}
                    className="h-11 rounded-lg border-border text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <NRCInput value={userForm.nrc_number} onChange={(nrc_number) => setUserForm((prev) => ({ ...prev, nrc_number }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agent_code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Agent Code
                  </Label>
                  <Input
                    id="agent_code"
                    name="agent_code"
                    value={profileForm.agent_code}
                    onChange={handleProfileChange}
                    className="h-11 rounded-lg border-border text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select
                    value={profileForm.status}
                    onValueChange={(val) => setProfileForm((prev) => ({ ...prev, status: val as string }))}
                  >
                    <SelectTrigger className="h-11 rounded-lg text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#D5E726] text-[#10110E]">
                  <Store className="h-4 w-4" />
                </div>
                Shop &amp; Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="shop_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Shop Name
                  </Label>
                  <Input
                    id="shop_name"
                    name="shop_name"
                    value={profileForm.shop_name}
                    onChange={handleProfileChange}
                    className="h-11 rounded-lg border-border text-sm"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="shop_address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Shop Address
                  </Label>
                  <Input
                    id="shop_address"
                    name="shop_address"
                    value={profileForm.shop_address}
                    onChange={handleProfileChange}
                    className="h-11 rounded-lg border-border text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State/Region</Label>
                  <Select
                    value={profileForm.state_region_id}
                    onValueChange={(val) => {
                      setProfileForm((prev) => ({ ...prev, state_region_id: val || "", township_id: "" }));
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-lg text-sm">
                      <SelectValue placeholder="Select state/region">
                        {(val: string | null) =>
                          val ? regions.find((r) => r.id.toString() === val)?.name || val : "Select state/region"
                        }
                      </SelectValue>
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Township</Label>
                  <Select
                    value={profileForm.township_id}
                    onValueChange={(val) => setProfileForm((prev) => ({ ...prev, township_id: val || "" }))}
                    disabled={!profileForm.state_region_id}
                  >
                    <SelectTrigger className="h-11 rounded-lg text-sm">
                      <SelectValue placeholder="Select township">
                        {(val: string | null) =>
                          val ? townships.find((t) => t.id.toString() === val)?.name || val : "Select township"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {townships.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#D5E726] text-[#10110E]">
                  <ImageIcon className="h-4 w-4" />
                </div>
                NRC Images
              </CardTitle>
              <CardDescription className="text-xs">Leave empty to keep existing images.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <ImageUpload label="NRC Front Image" onChange={(file) => setNrcFront(file)} />
                <ImageUpload label="NRC Back Image" onChange={(file) => setNrcBack(file)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => navigate(`/agents/${id}`)} className="h-11 rounded-lg">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-11 rounded-lg bg-[#D5E726] px-5 font-semibold text-[#10110E] hover:bg-[#D5E726]">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </RoleAwareLayout>
  );
}
