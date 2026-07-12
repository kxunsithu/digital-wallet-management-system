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
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { getCookie, setCookie } from "@/lib/cookies";

const ADMIN_ROLE_ID = 1;
const FLOW_STORAGE_KEY = "admin_auth_flow";

type Step = "phone" | "otp" | "pin" | "verify-pin" | "dashboard";

type PersistedFlow = {
  step: Step;
  phoneNumber: string;
  userId: number | null;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(() => {
    if (typeof window === "undefined") return "phone";

    try {
      const storedFlow = window.localStorage.getItem(FLOW_STORAGE_KEY);
      const parsedFlow = storedFlow
        ? (JSON.parse(storedFlow) as PersistedFlow)
        : null;
      return parsedFlow?.step ?? "phone";
    } catch {
      return "phone";
    }
  });
  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (typeof window === "undefined") return "";

    try {
      const storedFlow = window.localStorage.getItem(FLOW_STORAGE_KEY);
      const parsedFlow = storedFlow
        ? (JSON.parse(storedFlow) as PersistedFlow)
        : null;
      return parsedFlow?.phoneNumber ?? "";
    } catch {
      return "";
    }
  });
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [userId, setUserId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const storedFlow = window.localStorage.getItem(FLOW_STORAGE_KEY);
      const parsedFlow = storedFlow
        ? (JSON.parse(storedFlow) as PersistedFlow)
        : null;
      return parsedFlow?.userId ?? null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getCookie("admin_access_token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const normalizePhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.replace(/^0+/, "");

    if (normalized.startsWith("959")) {
      return `+${normalized}`;
    }

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (step === "dashboard") {
      window.localStorage.removeItem(FLOW_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      FLOW_STORAGE_KEY,
      JSON.stringify({
        step,
        phoneNumber,
        userId,
      }),
    );
  }, [step, phoneNumber, userId]);

  const handleRequestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await requestOtp(normalizePhoneNumber(phoneNumber));
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

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await verifyOtp(normalizePhoneNumber(phoneNumber), otp);
      const nextStep = response.data?.data?.next_step;

      if (response.data?.success) {
        const verifiedUserId = response.data?.data?.user_id ?? null;
        setUserId(verifiedUserId);
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

  const handleCreatePin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (pin.length !== 4 || confirmPin.length !== 4 || pin !== confirmPin) {
      toast.error("PINs must match and be exactly 4 digits.");
      setLoading(false);
      return;
    }

    if (!userId) {
      toast.error("User information is missing.");
      setLoading(false);
      return;
    }

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

  const handleVerifyPin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!userId) {
      toast.error("User information is missing.");
      setLoading(false);
      return;
    }

    try {
      const response = await verifyPin(userId, pin);
      if (response.data?.success) {
        const token = response.data?.data?.access_token;
        if (token) {
          setCookie("admin_access_token", token);
          setCookie(
            "admin_user",
            JSON.stringify({
              userId: response.data?.data?.user_id,
              role: response.data?.data?.role,
            }),
          );
        }
        toast.success("Welcome back, admin.");
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

    setLoading(true);

    try {
      const response = await requestOtp(normalizePhoneNumber(phoneNumber));
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
      case "phone":
        return "Secure admin login";
      case "otp":
        return "Please fill your OTP code";
      case "pin":
        return "Create your PIN";
      case "verify-pin":
        return "Verify your PIN";
      case "dashboard":
        return "Welcome back";
      default:
        return "Secure admin login";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "phone":
        return "Enter your local Myanmar number without the leading zero. We will prefix +95 automatically.";
      case "otp":
        return "We sent a 6-digit code to your phone. Enter it below to continue.";
      case "pin":
        return "Create a new 4-digit PIN to complete your account setup.";
      case "verify-pin":
        return "Enter your existing PIN to continue to the admin dashboard.";
      case "dashboard":
        return "Your secure access is ready. Redirecting now...";
      default:
        return "Enter your phone number to start secure access.";
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


              <input type="hidden" value={ADMIN_ROLE_ID} readOnly />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : null}

          {step === "otp" ? (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
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
                <span className="text-slate-500">Enter the 6-digit code</span>
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
                Use another phone number
              </Button>
            </form>
          ) : null}

          {step === "pin" ? (
            <form className="space-y-5" onSubmit={handleCreatePin}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Choose a new 4-digit PIN to protect your admin access.</p>
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

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

          {step === "verify-pin" ? (
            <form className="space-y-5" onSubmit={handleVerifyPin}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Enter your 4-digit PIN to continue to the admin dashboard.</p>
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

          {step === "dashboard" ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <LockKeyhole className="h-4 w-4" />
                Authentication complete
              </div>
              <p className="mt-2">
                The dashboard view is ready. You can now continue into the admin
                area.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default LoginPage;
