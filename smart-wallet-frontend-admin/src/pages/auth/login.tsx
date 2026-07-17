import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  createPin,
  getErrorMessage,
  requestOtp,
  verifyOtp,
  verifyPin,
} from "@/services/auth.service";
import { LockKeyhole, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { getCookie, setCookie } from "@/lib/cookies";

// Role IDs — must match the backend `roles` table
const ROLE_ADMIN = 1;
const ROLE_AGENT_MANAGER = 2;

const FLOW_STORAGE_KEY = "admin_auth_flow";

type Step = "role" | "phone" | "otp" | "pin" | "verify-pin" | "dashboard";

type PersistedFlow = {
  step: Step;
  phoneNumber: string;
  userId: number | null;
  roleId: number | null;
  roleName: string;
};

const LoginPage = () => {
  const navigate = useNavigate();

  const loadFlow = (): PersistedFlow => {
    if (typeof window === "undefined") return { step: "role", phoneNumber: "", userId: null, roleId: null, roleName: "" };
    try {
      const stored = window.localStorage.getItem(FLOW_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PersistedFlow) : { step: "role", phoneNumber: "", userId: null, roleId: null, roleName: "" };
    } catch {
      return { step: "role", phoneNumber: "", userId: null, roleId: null, roleName: "" };
    }
  };

  const initial = loadFlow();

  const [step, setStep] = useState<Step>(initial.step);
  const [phoneNumber, setPhoneNumber] = useState(initial.phoneNumber);
  const [userId, setUserId] = useState<number | null>(initial.userId);
  const [roleId, setRoleId] = useState<number | null>(initial.roleId);
  const [roleName, setRoleName] = useState(initial.roleName);
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getCookie("admin_access_token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (step === "dashboard") {
      window.localStorage.removeItem(FLOW_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ step, phoneNumber, userId, roleId, roleName }));
  }, [step, phoneNumber, userId, roleId, roleName]);

  const normalizePhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.replace(/^0+/, "");
    if (normalized.startsWith("959")) return `+${normalized}`;
    return `+95${normalized}`;
  };

  const normalizePhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.replace(/^0+/, "");
    return normalized.startsWith("95") ? normalized.slice(2) : normalized;
  };

  const formattedPhoneNumber = () => {
    if (!phoneNumber) return "your phone number";
    return normalizePhoneNumber(phoneNumber);
  };

  // Step 1: Role selection
  const handleSelectRole = (id: number, name: string) => {
    setRoleId(id);
    setRoleName(name);
    setStep("phone");
  };

  // Step 2: Request OTP
  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!roleId) {
      toast.error("Please select a role first.");
      setStep("role");
      return;
    }
    setLoading(true);
    try {
      const response = await requestOtp(normalizePhoneNumber(phoneNumber), roleId);
      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message ?? "OTP has been sent to your phone.");
        setStep("otp");
      } else {
        toast.error(response.data?.message ?? "Unable to send OTP.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await verifyOtp(normalizePhoneNumber(phoneNumber), otp);
      const nextStep = response.data?.data?.next_step;
      if (response.data?.success) {
        setUserId(response.data?.data?.user_id ?? null);
        if (nextStep === "verify_pin") {
          setStep("verify-pin");
          toast.success("OTP verified. Please enter your PIN to continue.");
        } else {
          setStep("pin");
          toast.success("OTP verified. Please create your PIN.");
        }
      } else {
        toast.error(response.data?.message ?? "Invalid OTP.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 4a: Create PIN
  const handleCreatePin = async (event: FormEvent) => {
    event.preventDefault();
    if (pin.length !== 4 || confirmPin.length !== 4 || pin !== confirmPin) {
      toast.error("PINs must match and be exactly 4 digits.");
      return;
    }
    if (!userId) {
      toast.error("User information is missing.");
      return;
    }
    setLoading(true);
    try {
      const response = await createPin(userId, pin, confirmPin);
      if (response.data?.success || response.status === 201) {
        toast.success("PIN created successfully.");
        setStep("verify-pin");
      } else {
        toast.error(response.data?.message ?? "Unable to create PIN.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 4b: Verify PIN → Login
  const handleVerifyPin = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) {
      toast.error("User information is missing.");
      return;
    }
    setLoading(true);
    try {
      const response = await verifyPin(userId, pin);
      if (response.data?.success) {
        const userData = response.data?.data ?? {};
        const token = userData?.access_token;
        if (token) {
          setCookie("admin_access_token", token);
          setCookie("admin_user", JSON.stringify(userData));
          // Store the role so the app can do role-based access control
          setCookie("user_role", userData?.role ?? roleName ?? "");
          setCookie("user_role_id", String(userData?.role_id ?? roleId ?? ""));
        }
        const displayRole = roleName === "agent_manager" ? "Agent Manager" : "Admin";
        toast.success(`Welcome back, ${displayRole}.`);
        setStep("dashboard");
        navigate("/dashboard");
      } else {
        toast.error(response.data?.message ?? "Unable to verify PIN.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number first.");
      return;
    }
    if (!roleId) return;
    setLoading(true);
    try {
      const response = await requestOtp(normalizePhoneNumber(phoneNumber), roleId);
      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message ?? "OTP has been resent.");
      } else {
        toast.error(response.data?.message ?? "Unable to resend OTP.");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "role": return "Welcome back";
      case "phone": return roleName === "agent_manager" ? "Agent Manager Login" : "Admin Login";
      case "otp": return "Enter OTP Code";
      case "pin": return "Create your PIN";
      case "verify-pin": return "Verify your PIN";
      case "dashboard": return "Welcome back";
      default: return "Login";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "role": return "Select your role to continue.";
      case "phone": return "Enter your local Myanmar number without the leading zero. We will prefix +95 automatically.";
      case "otp": return "We sent a 6-digit code to your phone. Enter it below to continue.";
      case "pin": return "Create a new 4-digit PIN to complete your account setup.";
      case "verify-pin": return `Enter your 4-digit PIN to continue to the ${roleName === "agent_manager" ? "Agent Manager" : "Admin"} dashboard.`;
      case "dashboard": return "Redirecting...";
      default: return "";
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md rounded border border-slate-200/70 bg-white/95 p-6 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
        <CardHeader className="space-y-6">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-slate-950">
              {getStepTitle()}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {getStepDescription()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* Step 1: Role Selection */}
          {step === "role" ? (
            <div className="space-y-3">
              <button
                id="btn-role-admin"
                type="button"
                onClick={() => handleSelectRole(ROLE_ADMIN, "admin")}
                className="flex w-full items-center gap-4 rounded border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-900 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-slate-900 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">Admin</span>
                  <span className="text-sm text-slate-500">Full system access</span>
                </span>
              </button>

              <button
                id="btn-role-agent-manager"
                type="button"
                onClick={() => handleSelectRole(ROLE_AGENT_MANAGER, "agent_manager")}
                className="flex w-full items-center gap-4 rounded border border-slate-200 bg-white p-4 text-left transition-all hover:border-indigo-600 hover:bg-indigo-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-indigo-600 text-white">
                  <UserCog className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">Agent Manager</span>
                  <span className="text-sm text-slate-500">Manage agents & operations</span>
                </span>
              </button>
            </div>
          ) : null}

          {/* Step 2: Phone Number */}
          {step === "phone" ? (
            <form className="space-y-5" onSubmit={handleRequestOtp}>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    +95
                  </div>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(normalizePhoneInput(event.target.value))}
                    placeholder="9944074981"
                    required
                    className="pl-14"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => { setStep("role"); setPhoneNumber(""); }}
              >
                ← Back
              </Button>
            </form>
          ) : null}

          {/* Step 3: OTP */}
          {step === "otp" ? (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                <p>OTP sent to</p>
                <p className="font-medium text-slate-900">{formattedPhoneNumber()}</p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={(value) => setOtp(value.replace(/\D/g, ""))}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  containerClassName="justify-center gap-3"
                  render={({ slots }) => (
                    <InputOTPGroup className="gap-3">
                      {slots.map((slot, index) => (
                        <InputOTPSlot key={index} index={index} {...slot} />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Enter the 6-digit code</span>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Resend Code
                </button>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying OTP..." : "Verify OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep("phone")}
              >
                ← Back
              </Button>
            </form>
          ) : null}

          {/* Step 4a: Create PIN */}
          {step === "pin" ? (
            <form className="space-y-5" onSubmit={handleCreatePin}>
              <div className="overflow-hidden rounded border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Choose a new 4-digit PIN to protect your access.</p>
                <div className="mt-4 flex justify-center">
                  <InputOTP
                    value={pin}
                    onChange={(value) => setPin(value.replace(/\D/g, ""))}
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    containerClassName="justify-center gap-3"
                    render={({ slots }) => (
                      <InputOTPGroup className="gap-3">
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} index={index} {...slot} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Re-enter your PIN for confirmation.</p>
                <div className="mt-4 flex justify-center">
                  <InputOTP
                    value={confirmPin}
                    onChange={(value) => setConfirmPin(value.replace(/\D/g, ""))}
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    containerClassName="justify-center gap-3"
                    render={({ slots }) => (
                      <InputOTPGroup className="gap-3">
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} index={index} {...slot} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating PIN..." : "Create PIN"}
              </Button>
            </form>
          ) : null}

          {/* Step 4b: Verify PIN */}
          {step === "verify-pin" ? (
            <form className="space-y-5" onSubmit={handleVerifyPin}>
              <div className="overflow-hidden rounded border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Enter your 4-digit PIN to continue.</p>
                <div className="mt-4 flex justify-center">
                  <InputOTP
                    value={pin}
                    onChange={(value) => setPin(value.replace(/\D/g, ""))}
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    containerClassName="justify-center gap-3"
                    render={({ slots }) => (
                      <InputOTPGroup className="gap-3">
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} index={index} {...slot} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying PIN..." : "Verify PIN"}
              </Button>
            </form>
          ) : null}

          {/* Final: Dashboard redirect */}
          {step === "dashboard" ? (
            <div className="rounded border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <LockKeyhole className="h-4 w-4" />
                Authentication complete
              </div>
              <p className="mt-2">Redirecting to your dashboard...</p>
            </div>
          ) : null}

        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default LoginPage;
