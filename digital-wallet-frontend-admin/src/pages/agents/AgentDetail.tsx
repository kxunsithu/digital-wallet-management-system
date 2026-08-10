import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  CreditCard,
  Edit2,
  Image as ImageIcon,
  MapPin,
  Phone,
  Store,
  User,
  Wallet as WalletIcon,
  ZoomIn,
  X,
} from "lucide-react";
import RoleAwareLayout from "@/components/layouts/RoleAwareLayout";
import { Button } from "@/components/ui/button";
import { getCookie } from "@/lib/cookies";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveImageUrl, handleImageError } from "@/lib/utils";
import { toast } from "sonner";
import { getAgent } from "@/services/agent.service";

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAgentManager = (getCookie("user_role") ?? "") === "agent_manager";
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);

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
      <RoleAwareLayout title="Agent Detail">
        <div className="py-20 text-center text-slate-500">Loading details...</div>
      </RoleAwareLayout>
    );
  }

  if (!agent) {
    return (
      <RoleAwareLayout title="Agent Detail">
        <div className="py-20 text-center text-red-500">Agent not found.</div>
      </RoleAwareLayout>
    );
  }

  const { user } = agent;
  const nrcFront = user?.images?.find((img: any) => img.image_type === "nrc_front_image");
  const nrcBack = user?.images?.find((img: any) => img.image_type === "nrc_back_image");
  const profileImage = user?.images?.find((img: any) => img.image_type === "profile_image");

  const statusClass =
    agent.status === "active"
      ? "border-[#52C41A] text-[#52C41A]"
      : agent.status === "pending"
        ? "border-[#BCF807] bg-[#BCF807] text-[#10110E]"
        : "border-[#FF4D4F] text-[#FF4D4F]";

  return (
    <RoleAwareLayout title="Agent Detail">
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
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BCF807] text-[#10110E]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {user?.full_name || "Agent"}
              </h2>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {agent.agent_code || "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${statusClass}`}>
              {agent.status || "inactive"}
            </span>
            {isAgentManager ? (
              <Button
                onClick={() => navigate(`/agents/${id}/edit`)}
                className="h-10 rounded-lg bg-[#BCF807] text-[#10110E] hover:bg-[#BCF807]"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <Card className="h-fit overflow-hidden rounded-2xl border border-border shadow-none xl:sticky xl:top-24">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-4 border-b border-border pb-5">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-white text-muted-foreground">
                {profileImage ? (
                  <img
                    src={resolveImageUrl(profileImage) ?? ""}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => handleImageError(e, 150, 150, "Profile")}
                  />
                ) : (
                  <User className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agent profile
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">{user?.full_name || "—"}</p>
                <p className="text-sm text-muted-foreground">{user?.phone_number || "—"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <User className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{user?.full_name || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Phone Number
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{user?.phone_number || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    NRC Number
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{user?.nrc_number || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <Activity className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Agent Code
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{agent.agent_code || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <Activity className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
              {agent.parent && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                  <User className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Parent Agent
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {agent.parent?.agent_code || "-"}
                      {agent.parent?.shop_name ? ` (${agent.parent.shop_name})` : ""}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    State / Township
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {agent.user?.state_region
                      ? `${agent.user.state_region} / ${agent.user.township ?? "-"}`
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <Store className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Shop Name
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{agent.shop_name || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Shop Address
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{agent.shop_address || "-"}</p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
          <CardHeader className="border-b border-border py-5">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <ImageIcon className="h-5 w-5 text-[#10110E]" />
              NRC Images
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Front Image</p>
              {nrcFront ? (
                <button
                  type="button"
                  onClick={() => setPreviewImage({ src: resolveImageUrl(nrcFront) ?? "", label: "NRC Front" })}
                  className="group relative mt-2 flex w-full max-w-lg cursor-zoom-in items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2 transition-all hover:border-[#BCF807] hover:shadow-md"
                >
                  <img
                    src={resolveImageUrl(nrcFront) ?? ""}
                    alt="NRC Front"
                    className="max-h-[250px] w-auto rounded object-contain"
                    onError={(e) => handleImageError(e, 300, 200, "Image Not Found")}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-all group-hover:bg-black/20">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition-all group-hover:opacity-100">
                      <ZoomIn className="h-3.5 w-3.5" />
                      Preview
                    </div>
                  </div>
                </button>
              ) : (
                <p className="text-sm italic text-slate-400">No front image uploaded.</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Back Image</p>
              {nrcBack ? (
                <button
                  type="button"
                  onClick={() => setPreviewImage({ src: resolveImageUrl(nrcBack) ?? "", label: "NRC Back" })}
                  className="group relative mt-2 flex w-full max-w-lg cursor-zoom-in items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2 transition-all hover:border-[#BCF807] hover:shadow-md"
                >
                  <img
                    src={resolveImageUrl(nrcBack) ?? ""}
                    alt="NRC Back"
                    className="max-h-[250px] w-auto rounded object-contain"
                    onError={(e) => handleImageError(e, 300, 200, "Image Not Found")}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-all group-hover:bg-black/20">
                    <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition-all group-hover:opacity-100">
                      <ZoomIn className="h-3.5 w-3.5" />
                      Preview
                    </div>
                  </div>
                </button>
              ) : (
                <p className="text-sm italic text-slate-400">No back image uploaded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {user?.wallet && (
        <div className="mt-8">
          <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
            <CardHeader className="border-b border-border py-5">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <WalletIcon className="h-5 w-5 text-[#10110E]" />
                Wallet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Wallet Number
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold tracking-wide text-foreground">
                    {user.wallet.wallet_number ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-[#BCF807] bg-[#BCF807] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#10110E]">
                    Balance
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#10110E]">
                    {new Intl.NumberFormat("en-MM").format(Number(user.wallet.balance ?? 0))}
                    <span className="ml-1 text-xs font-medium text-slate-500">MMK</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Wallet Status
                  </p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.wallet.status === "active"
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {user.wallet.status ?? "inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NRC Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex w-full items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                {previewImage.label}
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="ml-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={previewImage.src}
              alt={previewImage.label}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
              onError={(e) => handleImageError(e, 600, 400, "Image Not Found")}
            />
            <p className="mt-3 text-xs text-white/50">Click outside to close</p>
          </div>
        </div>
      )}
    </RoleAwareLayout>
  );
}
