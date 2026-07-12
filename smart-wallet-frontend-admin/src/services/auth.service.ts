import api from "../lib/axiox";

const ADMIN_ROLE_ID = 1;

interface ApiErrorPayload {
  message?: string;
  errors?: Record<string, string[]>;
}

interface ApiError {
  response?: {
    data?: ApiErrorPayload;
  };
  message?: string;
}

export const getErrorMessage = (error: ApiError | unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const responseData = (error as ApiError).response?.data;
    if (responseData?.message) {
      return responseData.message;
    }

    const firstError = Object.values(responseData?.errors ?? {})[0]?.[0];
    if (firstError) {
      return firstError;
    }
  }

  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return "Something went wrong. Please try again.";
};

export const requestOtp = (phoneNumber: string) =>
  api.post("auth/request-otp", { phone_number: phoneNumber, role_id: ADMIN_ROLE_ID });

export const verifyOtp = (phoneNumber: string, otpCode: string) =>
  api.post("auth/verify-otp", { phone_number: phoneNumber, otp_code: otpCode });

export const createPin = (userId: number, pin: string, confirmPin: string) =>
  api.post("auth/create-pin", {
    user_id: userId,
    pin,
    pin_confirmation: confirmPin,
    confirm_pin: confirmPin,
  });

export const verifyPin = (userId: number, pin: string) =>
  api.post("auth/verify-pin", {
    user_id: userId,
    pin,
    device_id: typeof window !== "undefined" ? window.navigator.userAgent : "browser",
    device_name: "Admin Web Portal",
  });

export const logout = () => api.post("auth/logout");
