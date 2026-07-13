import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Image as ImageIcon,
  Activity,
  Store,
  Wallet,
} from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getAgent } from "@/services/agent.service";

export default function AgentDetail() {
  const { id } = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await getAgent(id!);
        setAgent(response.data.data);
      } catch {
        toast.error("Failed to load agent details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAgent();
  }, [id]);

  if (loading) {
    return (
      <MainLayout title="Agent Detail">
        <div className="py-20 text-center text-slate-500">Loading details...</div>
      </MainLayout>
    );
  }

  if (!agent) {
    return (
      <MainLayout title="Agent Detail">
        <div className="py-20 text-center text-red-500">Agent not found.</div>
      </MainLayout>
    );
  }

  const { user } = agent;
  const nrcFront = user?.images?.find((img: any) => img.image_type === "nrc_front_image");
  const nrcBack = user?.images?.find((img: any) => img.image_type === "nrc_back_image");
  const profileImage = user?.images?.find((img: any) => img.image_type === "profile_image");
  const storageBase = `${import.meta.env.VITE_API_URL?.replace("/api", "")}/storage/`;

  return (
    <MainLayout title="Agent Detail">
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
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-100 bg-white rounded overflow-hidden">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col items-center pb-5 border-b border-slate-100/70 mb-5">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                {profileImage ? (
                  <img
                    src={`${storageBase}${profileImage.image_path}`}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/150?text=Profile";
                    }}
                  />
                ) : (
                  <User className="h-8 w-8 text-slate-300" />
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Full Name
                </p>
                <p className="text-sm font-semibold text-slate-700">{user?.full_name || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Phone Number
                </p>
                <p className="text-sm font-semibold text-slate-700">{user?.phone_number || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm font-semibold text-slate-700">{user?.email || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  NRC Number
                </p>
                <p className="text-sm font-semibold text-slate-700">{user?.nrc_number || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Agent Code
                </p>
                <p className="text-sm font-semibold text-slate-700">{agent.agent_code || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </p>
                <div className="mt-0.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      agent.status === "active"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : agent.status === "pending"
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {agent.status?.toUpperCase() || "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Level
                </p>
                <p className="text-sm font-semibold text-slate-700">{agent.level || "-"}</p>
              </div>
            </div>
            {agent.parent && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Parent Agent
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {agent.parent?.agent_code || "-"}
                    {agent.parent?.shop_name ? ` (${agent.parent.shop_name})` : ""}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  State/Region &amp; Township
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {agent.state_region?.name || "-"}
                  {agent.township?.name ? ` / ${agent.township.name}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Store className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Shop Name
                </p>
                <p className="text-sm font-semibold text-slate-700">{agent.shop_name || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Shop Address
                </p>
                <p className="text-sm font-semibold text-slate-700">{agent.shop_address || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Float Balance
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {agent.float_balance ? Number(agent.float_balance).toLocaleString() : "0"}
                </p>
              </div>
            </div>
            {agent.custom_commission_override != null && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Commission Override
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {Number(agent.custom_commission_override).toLocaleString()}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-100 bg-white rounded overflow-hidden">
          <CardHeader className="border-b border-slate-50 py-5 bg-slate-50/10">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <ImageIcon className="w-4.5 h-4.5 text-slate-600" />
              NRC Images
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 flex justify-center flex-col items-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Front Image
              </p>
              {nrcFront ? (
                <div className="relative mt-2 rounded-lg border border-slate-100 bg-slate-50/40 p-2 overflow-hidden flex items-center justify-center max-w-lg shadow-sm hover:shadow transition-shadow">
                  <img
                    src={`${storageBase}${nrcFront.image_path}`}
                    alt="NRC Front"
                    className="max-h-[250px] w-auto rounded object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300x200?text=Image+Not+Found";
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No front image uploaded.</p>
              )}
            </div>
            <div className="space-y-2 mt-5 flex justify-center flex-col items-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Back Image
              </p>
              {nrcBack ? (
                <div className="relative mt-2 rounded-lg border border-slate-100 bg-slate-50/40 p-2 overflow-hidden flex items-center justify-center max-w-lg shadow-sm hover:shadow transition-shadow">
                  <img
                    src={`${storageBase}${nrcBack.image_path}`}
                    alt="NRC Back"
                    className="max-h-[250px] w-auto rounded object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300x200?text=Image+Not+Found";
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No back image uploaded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
