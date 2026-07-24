import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  Image as ImageIcon,
  Activity,
  Gift,
  ShieldCheck,
  Wallet as WalletIcon,
  Power,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getCustomer,
  verifyCustomerNrc,
  toggleCustomerStatus,
  toggleCustomerKycStatus,
} from "@/services/customer.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [selectedKycStatus, setSelectedKycStatus] = useState<"verified" | "approved" | "pending" | "rejected" | "">("");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchCustomer = async () => {
    try {
      const response = await getCustomer(id!);
      setCustomer(response.data.data);
    } catch {
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
  }, [id]);

  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const response = await toggleCustomerStatus(id!);
      toast.success(response.data?.message || "Status updated successfully.");
      await fetchCustomer();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleKycStatus = () => {
    setSelectedKycStatus(customer?.kyc_status === "approved" ? "verified" : customer?.kyc_status || "pending");
    setRejectionReason(customer?.user?.nrc_verification?.rejection_reason || "");
    setKycModalOpen(true);
  };

  const handleKycSubmit = async () => {
    if (!selectedKycStatus) {
      toast.error("Please select a status");
      return;
    }
    if (selectedKycStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Please specify a rejection reason");
      return;
    }

    setActionLoading(true);
    try {
      const response = await toggleCustomerKycStatus(id!, {
        status: selectedKycStatus,
        rejection_reason: selectedKycStatus === "rejected" ? rejectionReason : "",
      });
      toast.success(response.data?.message || "KYC status updated successfully.");
      setKycModalOpen(false);
      await fetchCustomer();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update KYC status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!customer?.user?.nrc_verification?.id) {
      toast.error("No pending NRC verification available.");
      return;
    }

    setActionLoading(true);
    try {
      await verifyCustomerNrc(customer.user.nrc_verification.id);
      toast.success("NRC verification approved.");
      await fetchCustomer();
    } catch {
      toast.error("Failed to approve NRC verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    setSelectedKycStatus("rejected");
    setRejectionReason(customer?.user?.nrc_verification?.rejection_reason || "");
    setKycModalOpen(true);
  };

  if (loading) {
    return (
      <MainLayout title="Customer Detail">
        <div className="py-20 text-center text-slate-500">Loading details...</div>
      </MainLayout>
    );
  }

  if (!customer) {
    return (
      <MainLayout title="Customer Detail">
        <div className="py-20 text-center text-red-500">Customer not found.</div>
      </MainLayout>
    );
  }

  const { user } = customer;
  const nrcFront = user?.images?.find((img: any) => img.image_type === "nrc_front_image");
  const nrcBack = user?.images?.find((img: any) => img.image_type === "nrc_back_image");
  const profileImage = user?.images?.find((img: any) => img.image_type === "profile_image");
  const storageBase = `${import.meta.env.VITE_API_URL?.replace("/api", "")}/storage/`;
  const hasNrcImages = !!(nrcFront || nrcBack);

  return (
    <MainLayout title="Customer Detail">
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/customers" />}>Customers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detail</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#BDF40B] text-[#10110E]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {user?.full_name || "Customer"}
              </h2>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {customer.referral_code ? `Referral: ${customer.referral_code}` : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${
                customer.kyc_status === "verified" || customer.kyc_status === "approved"
                  ? "border-[#52C41A] text-[#52C41A]"
                  : customer.kyc_status === "pending"
                    ? "border-[#BDF40B] bg-[#BDF40B] text-[#10110E]"
                    : "border-[#FF4D4F] text-[#FF4D4F]"
              }`}
            >
              KYC: {customer.kyc_status || "pending"}
            </span>
            {hasNrcImages && (
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={handleToggleKycStatus}
                className="h-9 rounded-lg border-border text-foreground hover:bg-[#BDF40B] flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Toggle KYC
              </Button>
            )}
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={handleToggleStatus}
              className="h-9 rounded-lg border-border text-foreground hover:bg-[#BDF40B] flex items-center gap-2"
            >
              <Power className="h-4 w-4" />
              Toggle Status ({user?.status || "inactive"})
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        {/* Customer Information */}
        <Card className="h-fit overflow-hidden rounded-2xl border border-border shadow-none xl:sticky xl:top-24">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-4 border-b border-border pb-5">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-white text-muted-foreground">
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
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer profile
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">{user?.full_name || "—"}</p>
                <p className="text-sm text-muted-foreground">{user?.phone_number || "—"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{user?.full_name || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Phone Number
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{user?.phone_number || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    NRC Number
                  </p>
                  <p className="text-sm font-semibold text-slate-700">{user?.nrc_number || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Status
                  </p>
                  <div className="mt-0.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        user?.status === "active"
                          ? "border border-[#52C41A] bg-white text-[#52C41A]"
                          : "border border-[#FF4D4F] bg-white text-[#FF4D4F]"
                      }`}
                    >
                      {user?.status || "inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    KYC Status
                  </p>
                  <div className="mt-0.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        customer.kyc_status === "verified" || customer.kyc_status === "approved"
                          ? "border border-[#52C41A] bg-white text-[#52C41A]"
                          : customer.kyc_status === "pending"
                            ? "border border-[#BDF40B] bg-[#BDF40B] text-[#10110E]"
                            : "border border-[#FF4D4F] bg-white text-[#FF4D4F]"
                      }`}
                    >
                      {customer.kyc_status || "pending"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                <Gift className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Referral Code
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {customer.referral_code || "-"}
                  </p>
                </div>
              </div>
              {customer.referrer && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Referred By
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {customer.referrer.full_name || customer.referrer.phone_number || "-"}
                    </p>
                  </div>
                </div>
              )}
              {customer.custom_limit_override != null && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3">
                  <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Custom Limit Override
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {Number(customer.custom_limit_override).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-3 sm:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    State/Region &amp; Township
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {customer.state_region?.name || "-"}
                    {customer.township?.name ? ` / ${customer.township.name}` : ""}
                  </p>
                </div>
              </div>

              {customer.user?.nrc_verification && (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-slate-50 p-4 sm:col-span-2">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        NRC Verification Record
                      </p>
                      <p className="text-sm font-semibold text-slate-700 capitalize">
                        {customer.user.nrc_verification.status}
                      </p>
                      {customer.user.nrc_verification.rejection_reason && (
                        <p className="text-xs text-slate-500 mt-1">
                          Reason: {customer.user.nrc_verification.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {customer.user.nrc_verification.status === "pending" && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        onClick={handleVerify}
                        disabled={actionLoading}
                        className="h-10 rounded-lg bg-[#BDF40B] font-semibold text-[#10110E] hover:bg-[#BDF40B]"
                      >
                        Approve NRC
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={actionLoading}
                        variant="outline"
                        className="h-10 rounded-lg border-[#FF4D4F] text-[#FF4D4F] hover:bg-white"
                      >
                        Reject NRC
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Front Image
              </p>
              {nrcFront ? (
                <div className="relative mt-2 flex max-w-lg items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
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
            <div className="flex flex-col items-center justify-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Back Image
              </p>
              {nrcBack ? (
                <div className="relative mt-2 flex max-w-lg items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
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
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Wallet Number
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold tracking-wide text-foreground">
                    {user.wallet.wallet_number ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-[#BDF40B] bg-[#BDF40B] p-4">
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
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.wallet.status === "active"
                          ? "border border-[#52C41A] bg-white text-[#52C41A]"
                          : "border border-[#FF4D4F] bg-white text-[#FF4D4F]"
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

      {/* KYC Status Modal */}
      <Dialog open={kycModalOpen} onOpenChange={setKycModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Update KYC Status
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Update {user?.full_name || "customer"}'s identity verification status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "verified", label: "Verified", activeColor: "border-[#52C41A] bg-[#52C41A]/10 text-[#52C41A]" },
                { value: "pending", label: "Pending", activeColor: "border-[#BDF40B] bg-[#BDF40B]/10 text-[#10110E]" },
                { value: "rejected", label: "Rejected", activeColor: "border-[#FF4D4F] bg-[#FF4D4F]/10 text-[#FF4D4F]" }
              ].map((opt) => {
                const isActive = selectedKycStatus === opt.value || (opt.value === "verified" && selectedKycStatus === "approved");
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedKycStatus(opt.value as any)}
                    className={`py-3.5 px-2.5 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                      isActive ? opt.activeColor : "border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Rejection reason box */}
            {selectedKycStatus === "rejected" && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Rejection Reason
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify why the verification was rejected..."
                  className="w-full min-h-[100px] rounded-xl border border-border bg-white px-3 py-2 text-sm focus-visible:ring-[#BDF40B]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setKycModalOpen(false)}
              disabled={actionLoading}
              className="w-full rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleKycSubmit}
              disabled={actionLoading}
              className="w-full rounded-xl bg-[#BDF40B] hover:bg-[#BDF40B]/90 font-semibold text-[#10110E]"
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
