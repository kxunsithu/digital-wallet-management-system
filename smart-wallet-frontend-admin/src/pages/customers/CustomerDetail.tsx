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
  Gift,
  ShieldCheck,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getCustomer,
  verifyCustomerNrc,
  rejectCustomerNrc,
} from "@/services/customer.service";

const kycStatusClass = (status?: string) => {
  switch (status) {
    case "verified":
    case "approved":
      return "bg-green-50 text-green-700 border border-green-200";
    case "rejected":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  }
};

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleReject = async () => {
    if (!customer?.user?.nrc_verification?.id) {
      toast.error("No pending NRC verification available.");
      return;
    }

    const rejectionReason = window.prompt("Enter rejection reason (optional):");
    if (rejectionReason === null) {
      return;
    }

    setActionLoading(true);
    try {
      await rejectCustomerNrc(customer.user.nrc_verification.id, rejectionReason);
      toast.success("NRC verification rejected.");
      await fetchCustomer();
    } catch {
      toast.error("Failed to reject NRC verification.");
    } finally {
      setActionLoading(false);
    }
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
                  Account Status
                </p>
                <div className="mt-0.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      user?.status === "active"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {user?.status || "inactive"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  KYC Status
                </p>
                <div className="mt-0.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${kycStatusClass(customer.kyc_status)}`}
                  >
                    {customer.kyc_status || "pending"}
                  </span>
                </div>
              </div>
            </div>
            {customer.user?.nrc_verification && (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      NRC Verification
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
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      Approve NRC
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Reject NRC
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Level
                </p>
                <p className="text-sm font-semibold text-slate-700 capitalize">
                  {customer.level || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Gift className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Referral Code
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {customer.referral_code || "-"}
                </p>
              </div>
            </div>
            {customer.referrer && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Referred By
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {customer.referrer.full_name || customer.referrer.phone_number || "-"}
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
                  {customer.state_region?.name || "-"}
                  {customer.township?.name ? ` / ${customer.township.name}` : ""}
                </p>
              </div>
            </div>
            {customer.custom_limit_override != null && (
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Custom Limit Override
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {Number(customer.custom_limit_override).toLocaleString()}
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

      {user?.wallet && (
        <div className="mt-8">
          <Card className="shadow-sm border-slate-100 bg-white rounded overflow-hidden">
            <CardHeader className="border-b border-slate-50 py-5 bg-slate-50/10">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Wallet className="w-4.5 h-4.5 text-blue-500" />
                Wallet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Wallet Number
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800 font-mono tracking-wide">
                    {user.wallet.wallet_number ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Balance
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {new Intl.NumberFormat("en-MM").format(Number(user.wallet.balance ?? 0))}
                    <span className="ml-1 text-xs font-medium text-slate-500">
                      {user.wallet.currency ?? "MMK"}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Currency
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {user.wallet.currency ?? "MMK"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Wallet Status
                  </p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.wallet.status === "active"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
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
    </MainLayout>
  );
}
