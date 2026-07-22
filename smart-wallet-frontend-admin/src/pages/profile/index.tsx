import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IdCard, LockKeyhole, User, Camera } from "lucide-react";
import { toast } from "sonner";
import RoleAwareLayout from "@/components/layouts/RoleAwareLayout";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCookie, setCookie } from "@/lib/cookies";
import {
  changePin,
  getProfile,
  updateProfile,
  uploadProfilePicture,
} from "@/services/profile.service";

type ProfileImage = {
  image_type?: string;
  image_path?: string;
  image_url?: string;
};

type ProfileData = {
  id?: number;
  phone_number?: string;
  full_name?: string;
  nrc_number?: string;
  status?: string;
  role_id?: number;
  images?: ProfileImage[];
  nrc_images?: ProfileImage[];
};

const getStorageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ?? "";
  return `${base}/storage/${path}`;
};

const syncSessionCookie = (profile: ProfileData) => {
  try {
    const raw = getCookie("admin_user");
    const existing = raw ? JSON.parse(raw) : {};
    setCookie(
      "admin_user",
      JSON.stringify({
        ...existing,
        id: profile.id ?? existing.id,
        full_name: profile.full_name,
        name: profile.full_name,
        phone: profile.phone_number ?? existing.phone,
        phone_number: profile.phone_number,
        nrc_number: profile.nrc_number,
      }),
    );
  } catch {
    // ignore
  }
};

export default function ProfilePage() {
  const userRole = getCookie("user_role") ?? "";
  const roleLabel = userRole === "agent_manager" ? "Agent Manager" : "Admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ full_name: "", nrc_number: "" });
  const [pinForm, setPinForm] = useState({
    current_pin: "",
    new_pin: "",
    new_pin_confirmation: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; label: string } | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      const data = (response.data?.data ?? response.data) as ProfileData;
      setProfile(data);
      setForm({
        full_name: data.full_name ?? "",
        nrc_number: data.nrc_number ?? "",
      });
      const profileImage = data.images?.find((img) => img.image_type === "profile_image");
      setPreviewUrl(getStorageUrl(profileImage?.image_path) ?? profileImage?.image_url ?? null);
      syncSessionCookie(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await updateProfile({
        full_name: form.full_name || undefined,
        nrc_number: form.nrc_number || undefined,
      });
      const data = (response.data?.data ?? response.data) as ProfileData;
      setProfile((prev) => ({ ...prev, ...data }));
      syncSessionCookie({ ...profile, ...data, ...form });
      toast.success(response.data?.message || "Profile updated.");
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors as Record<string, string[]>)[0]?.[0];
        toast.error(firstError || "Validation failed.");
      } else {
        toast.error(err?.response?.data?.message || "Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePictureChange = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const response = await uploadProfilePicture(file);
      const imageUrl =
        getStorageUrl(response.data?.data?.image_path) ?? response.data?.data?.image_url ?? null;
      setPreviewUrl(imageUrl);
      toast.success(response.data?.message || "Profile picture uploaded.");
      await loadProfile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload picture");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pinForm.new_pin.length !== 4 || pinForm.current_pin.length !== 4) {
      toast.error("PIN must be 4 digits.");
      return;
    }
    if (pinForm.new_pin !== pinForm.new_pin_confirmation) {
      toast.error("New PIN confirmation does not match.");
      return;
    }
    try {
      setChangingPin(true);
      const response = await changePin(pinForm);
      toast.success(response.data?.message || "PIN changed successfully.");
      setPinForm({ current_pin: "", new_pin: "", new_pin_confirmation: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change PIN");
    } finally {
      setChangingPin(false);
    }
  };

  return (
    <RoleAwareLayout title="My Profile">
      {/* Breadcrumb */}
      <div className="mb-6 space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Banner */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#D5E726] text-[#10110E]">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">My Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your account details, photo, and security PIN.
              </p>
            </div>
          </div>
          {!loading && profile && (
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${
                  profile.status === "active"
                    ? "border-[#52C41A] text-[#52C41A]"
                    : "border-[#D5E726] bg-[#D5E726] text-[#10110E]"
                }`}
              >
                {profile.status || "active"}
              </span>
              <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                {roleLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading profile...</p>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[260px_1fr]">
          {/* ── Left Column: Photo + Meta ── */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#D5E726] text-[#10110E]">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Profile Photo</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG or WebP up to 2MB</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <ImageUpload
                  label="Upload photo"
                  initialPreview={previewUrl}
                  onChange={(file) => void handlePictureChange(file)}
                />
                {uploading && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">Uploading...</p>
                )}
              </div>
            </div>

            {/* Role & Status mini card */}
            <div className="rounded-2xl border border-border bg-white px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account Info
              </p>
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="mt-1 font-semibold text-foreground">{roleLabel}</p>
                </div>
                <div className="rounded-xl border border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Account Status</p>
                  <p className="mt-1 font-semibold capitalize text-foreground">
                    {profile?.status || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-white p-3">
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="mt-1 font-mono font-semibold text-foreground">
                    {profile?.phone_number || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Forms ── */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
              <CardHeader className="border-b border-border py-5">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-[#D5E726] text-[#10110E]">
                    <User className="h-4 w-4" />
                  </div>
                  Personal Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-5" onSubmit={handleSaveProfile}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profile?.phone_number || ""}
                        disabled
                        className="bg-slate-50 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={form.full_name}
                        onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Your full name"
                        className="focus-visible:ring-[#D5E726]/30"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="nrc_number">NRC Number</Label>
                      <Input
                        id="nrc_number"
                        value={form.nrc_number}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, nrc_number: e.target.value }))
                        }
                        placeholder="12/ABCDE(N)123456"
                        className="focus-visible:ring-[#D5E726]/30"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="h-10 rounded-lg bg-[#D5E726] font-semibold text-[#10110E] hover:bg-[#D5E726]/90"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* NRC Images — agent managers only */}
            {userRole !== "admin" && (
              <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
                <CardHeader className="border-b border-border py-5">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <div className="grid h-7 w-7 place-items-center rounded-md bg-slate-100 text-slate-600">
                      <IdCard className="h-4 w-4" />
                    </div>
                    NRC Images
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your uploaded NRC front and back images
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {(() => {
                    const nrcImages =
                      profile?.nrc_images ??
                      profile?.images?.filter(
                        (img) =>
                          img.image_type === "nrc_front_image" ||
                          img.image_type === "nrc_back_image",
                      ) ??
                      [];

                    if (nrcImages.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-slate-50/50 py-10">
                          <IdCard className="mb-3 h-10 w-10 text-slate-300" />
                          <p className="text-sm font-medium text-muted-foreground">
                            No NRC images uploaded
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/60">
                            NRC images will appear here once uploaded
                          </p>
                        </div>
                      );
                    }

                    const frontImage = nrcImages.find(
                      (img) => img.image_type === "nrc_front_image",
                    );
                    const backImage = nrcImages.find((img) => img.image_type === "nrc_back_image");

                    const renderNrcImage = (image: ProfileImage | undefined, label: string) => {
                      const imageUrl = getStorageUrl(image?.image_path) || image?.image_url;
                      if (!image || !imageUrl) {
                        return (
                          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-slate-50/50 py-8">
                            <IdCard className="mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-xs font-medium text-muted-foreground">
                              {label} not uploaded
                            </p>
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-slate-50 transition-all hover:border-[#D5E726] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#D5E726]/50 focus:ring-offset-2"
                          onClick={() => setLightboxImage({ url: imageUrl, label })}
                        >
                          <div className="aspect-[16/10] w-full">
                            <img
                              src={imageUrl}
                              alt={label}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              Click to enlarge
                            </span>
                          </div>
                          <div className="border-t border-border bg-white px-3 py-2">
                            <p className="text-xs font-medium text-foreground">{label}</p>
                          </div>
                        </button>
                      );
                    };

                    return (
                      <div className="grid gap-4 md:grid-cols-2">
                        {renderNrcImage(frontImage, "NRC Front")}
                        {renderNrcImage(backImage, "NRC Back")}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* NRC Lightbox */}
            {userRole !== "admin" && (
              <Dialog
                open={!!lightboxImage}
                onOpenChange={(open) => {
                  if (!open) setLightboxImage(null);
                }}
              >
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{lightboxImage?.label}</DialogTitle>
                  </DialogHeader>
                  {lightboxImage && (
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={lightboxImage.url}
                        alt={lightboxImage.label}
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {/* Change PIN */}
            <Card className="overflow-hidden rounded-2xl border border-border shadow-none">
              <CardHeader className="border-b border-border py-5">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-amber-50 text-amber-600">
                    <LockKeyhole className="h-4 w-4" />
                  </div>
                  Change PIN
                </CardTitle>
                <CardDescription className="text-xs">
                  Your 4-digit PIN is used for transfers and login
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-5" onSubmit={handleChangePin}>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="current_pin">Current PIN</Label>
                      <Input
                        id="current_pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinForm.current_pin}
                        onChange={(e) =>
                          setPinForm((prev) => ({
                            ...prev,
                            current_pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="••••"
                        className="text-center tracking-widest focus-visible:ring-[#D5E726]/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_pin">New PIN</Label>
                      <Input
                        id="new_pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinForm.new_pin}
                        onChange={(e) =>
                          setPinForm((prev) => ({
                            ...prev,
                            new_pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="••••"
                        className="text-center tracking-widest focus-visible:ring-[#D5E726]/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_pin_confirmation">Confirm PIN</Label>
                      <Input
                        id="new_pin_confirmation"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinForm.new_pin_confirmation}
                        onChange={(e) =>
                          setPinForm((prev) => ({
                            ...prev,
                            new_pin_confirmation: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="••••"
                        className="text-center tracking-widest focus-visible:ring-[#D5E726]/30"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={changingPin}
                      className="h-10 rounded-lg border-[#D5E726] font-semibold text-[#10110E] hover:bg-[#D5E726]/10"
                    >
                      {changingPin ? "Updating..." : "Update PIN"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </RoleAwareLayout>
  );
}
