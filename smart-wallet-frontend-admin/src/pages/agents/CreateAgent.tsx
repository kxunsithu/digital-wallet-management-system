import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Image as ImageIcon, Store } from "lucide-react";
import RoleAwareLayout from "@/components/layouts/RoleAwareLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
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
import { createAgent } from "@/services/agent.service";
import { getStateRegions, getTownships } from "@/services/location.service";

export default function CreateAgent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [userForm, setUserForm] = useState({
    phone_number: "",
    full_name: "",
    email: "",
    nrc_number: "",
  });

  const [profileForm, setProfileForm] = useState({
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
    if (!nrcFront || !nrcBack) {
      toast.error("Both NRC front and back images are required.");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      Object.entries(userForm).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      Object.entries(profileForm).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      data.append("nrc_front_image", nrcFront);
      data.append("nrc_back_image", nrcBack);

      await createAgent(data);
      toast.success("Agent created successfully");
      navigate("/agents");
    } catch (err) {
      const error = err as any;
      const errors = error?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors as Record<string, string[]>)[0]?.[0];
        toast.error(firstError || "Validation failed.");
      } else {
        toast.error(error?.response?.data?.message || "Failed to create agent");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleAwareLayout title="Create Agent">
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
              <BreadcrumbPage>Create</BreadcrumbPage>
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
              <CardDescription className="text-xs">Agent personal details.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="phone_number" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={userForm.phone_number}
                    onChange={handleUserChange}
                    required
                    placeholder="e.g. 09xxxxxxxxx"
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={userForm.full_name}
                    onChange={handleUserChange}
                    required
                    placeholder="e.g. Ko Aung"
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={userForm.email}
                    onChange={handleUserChange}
                    required
                    placeholder="e.g. agent@example.com"
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nrc_number" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    NRC Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nrc_number"
                    name="nrc_number"
                    value={userForm.nrc_number}
                    onChange={handleUserChange}
                    required
                    placeholder="e.g. 12/ABCDE(N)123456"
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
              <CardDescription className="text-xs">Shop details and operating location.</CardDescription>
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
                    placeholder="Shop name"
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
                    placeholder="Shop address"
                    className="h-9 text-sm rounded"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    State/Region <span className="text-red-500">*</span>
                  </Label>
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
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Township <span className="text-red-500">*</span>
                  </Label>
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
              <CardDescription className="text-xs">Upload the front and back of the NRC card.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ImageUpload label="NRC Front Image" required onChange={(file) => setNrcFront(file)} />
                <ImageUpload label="NRC Back Image" required onChange={(file) => setNrcBack(file)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={() => navigate("/agents")} className="rounded">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </form>
      </div>
    </RoleAwareLayout>
  );
}
