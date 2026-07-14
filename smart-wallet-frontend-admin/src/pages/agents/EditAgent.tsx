import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { User, Image as ImageIcon, Store } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
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
    email: "",
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
          email: agent.user?.email || "",
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
        <div className="py-20 text-center text-slate-500">Loading...</div>
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
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-sm border-slate-100 bg-white rounded overflow-hidden">
            <CardHeader className="border-b border-slate-50 py-5 bg-slate-50/10">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <User className="w-4.5 h-4.5 text-blue-600" />
                General Information
              </CardTitle>
              <CardDescription className="text-xs">Update agent personal details.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone Number</Label>
                  <Input value={userForm.phone_number} disabled className="h-9 text-sm rounded bg-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={userForm.full_name}
                    onChange={handleUserChange}
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userForm.email}
                    onChange={handleUserChange}
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nrc_number" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    NRC Number
                  </Label>
                  <Input
                    id="nrc_number"
                    name="nrc_number"
                    value={userForm.nrc_number}
                    onChange={handleUserChange}
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agent_code" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Agent Code
                  </Label>
                  <Input
                    id="agent_code"
                    name="agent_code"
                    value={profileForm.agent_code}
                    onChange={handleProfileChange}
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</Label>
                  <Select
                    value={profileForm.status}
                    onValueChange={(val) => setProfileForm((prev) => ({ ...prev, status: val as string }))}
                  >
                    <SelectTrigger className="h-9 text-sm rounded">
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

          <Card className="shadow-sm border-slate-100 bg-white rounded overflow-hidden">
            <CardHeader className="border-b border-slate-50 py-5 bg-slate-50/10">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Store className="w-4.5 h-4.5 text-emerald-600" />
                Shop &amp; Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="shop_name" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Shop Name
                  </Label>
                  <Input
                    id="shop_name"
                    name="shop_name"
                    value={profileForm.shop_name}
                    onChange={handleProfileChange}
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="shop_address" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Shop Address
                  </Label>
                  <Input
                    id="shop_address"
                    name="shop_address"
                    value={profileForm.shop_address}
                    onChange={handleProfileChange}
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">State/Region</Label>
                  <Select
                    value={profileForm.state_region_id}
                    onValueChange={(val) => {
                      setProfileForm((prev) => ({ ...prev, state_region_id: val || "", township_id: "" }));
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm rounded">
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
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Township</Label>
                  <Select
                    value={profileForm.township_id}
                    onValueChange={(val) => setProfileForm((prev) => ({ ...prev, township_id: val || "" }))}
                    disabled={!profileForm.state_region_id}
                  >
                    <SelectTrigger className="h-9 text-sm rounded">
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

          <Card className="shadow-sm border-slate-100 bg-white rounded overflow-hidden">
            <CardHeader className="border-b border-slate-50 py-5 bg-slate-50/10">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <ImageIcon className="w-4.5 h-4.5 text-indigo-600" />
                NRC Images
              </CardTitle>
              <CardDescription className="text-xs">Leave empty to keep existing images.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ImageUpload label="NRC Front Image" onChange={(file) => setNrcFront(file)} />
                <ImageUpload label="NRC Back Image" onChange={(file) => setNrcBack(file)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={() => navigate(`/agents/${id}`)} className="rounded">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </RoleAwareLayout>
  );
}
