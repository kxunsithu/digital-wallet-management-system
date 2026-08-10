import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { User, Phone, CreditCard, MapPin, Image as ImageIcon, Activity, Edit2, Wallet as WalletIcon, ZoomIn, X } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveImageUrl, handleImageError } from "@/lib/utils";
import { toast } from "sonner";
import { getAgentManager } from "@/services/agentManager.service";

export default function AgentManagerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const response = await getAgentManager(id!);
        setManager(response.data.data);
      } catch {
        toast.error("Failed to load agent manager details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchManager();
  }, [id]);

  if (loading) {
    return (
      <MainLayout title="Agent Manager Detail">
        <div className="py-20 text-center text-slate-500">Loading details...</div>
      </MainLayout>
    );
  }

  if (!manager) {
    return (
      <MainLayout title="Agent Manager Detail">
        <div className="py-20 text-center text-red-500">Agent Manager not found.</div>
      </MainLayout>
    );
  }

  const { user } = manager;
  const nrcFront = user?.images?.find((img: any) => img.image_type === "nrc_front_image");
  const nrcBack = user?.images?.find((img: any) => img.image_type === "nrc_back_image");
  const profileImage = user?.images?.find((img: any) => img.image_type === "profile_image");

  return (
    <MainLayout title="Agent Manager Detail">
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
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BCF807] text-[#10110E]"><User className="h-6 w-6" /></div>
            <div><h2 className="text-xl font-bold tracking-tight text-foreground">{user?.full_name || "Agent Manager"}</h2><p className="mt-1 font-mono text-sm text-muted-foreground">{manager.manager_code || "—"}</p></div>
          </div>
          <div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${manager.status === "active" ? "border-[#52C41A] text-[#52C41A]" : manager.status === "pending" ? "border-[#BCF807] bg-[#BCF807] text-[#10110E]" : "border-[#FF4D4F] text-[#FF4D4F]"}`}>{manager.status || "inactive"}</span><Button onClick={() => navigate(`/agent-managers/${manager.id}/edit`)} className="h-10 rounded-lg bg-[#BCF807] text-[#10110E] hover:bg-[#BCF807]"><Edit2 className="mr-2 h-4 w-4" />Edit</Button></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        {/* User Information */}
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
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manager profile</p><p className="mt-1 text-lg font-bold text-foreground">{user?.full_name || "—"}</p><p className="text-sm text-muted-foreground">{user?.phone_number || "—"}</p></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
              <User className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-semibold text-slate-700">{user?.full_name || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
              <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</p>
                <p className="text-sm font-semibold text-slate-700">{user?.phone_number || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
              <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">NRC Number</p>
                <p className="text-sm font-semibold text-slate-700">{user?.nrc_number || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
              <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Manager Code</p>
                <p className="text-sm font-semibold text-slate-700">{manager.manager_code || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
              <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</p>
                <div className="mt-0.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${manager.status === "active" ? "bg-green-50 text-green-700 border border-green-200"
                    : manager.status === "pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {manager.status?.toUpperCase() || "INACTIVE"}
                  </span>
                </div>
              </div>
            </div>
            {manager.parent && (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Parent Manager</p>
                  <p className="text-sm font-semibold text-slate-700">{manager.parent?.manager_code || "-"}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3 sm:col-span-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">State / Township</p>
                <p className="text-sm font-semibold text-slate-700">
                  {manager.user?.state_region
                    ? `${manager.user.state_region} / ${manager.user.township ?? "-"}`
                    : "-"}
                </p>
              </div>
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
          </CardHeader>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Front Image</p>
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
                <p className="text-sm text-slate-400 italic">No front image uploaded.</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Back Image</p>
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
                <p className="text-sm text-slate-400 italic">No back image uploaded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Information */}
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
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wallet Number</p>
                  <p className="mt-1 font-mono text-sm font-bold tracking-wide text-foreground">{user.wallet.wallet_number ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-[#BCF807] bg-[#BCF807] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#10110E]">Balance</p>
                  <p className="mt-1 text-sm font-bold text-[#10110E]">
                    {new Intl.NumberFormat("en-MM").format(Number(user.wallet.balance ?? 0))}
                    <span className="ml-1 text-xs font-medium text-slate-500">MMK</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Wallet Status</p>
                  <div className="mt-1">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      user.wallet.status === "active"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
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
    </MainLayout>
  );
}
