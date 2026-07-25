// services/auth.ts
import * as SecureStore from 'expo-secure-store';
import apiFetch, { API_BASE, ROLE_ID } from '../lib/api';

// Constants
export const AUTH_TOKEN_KEY = 'authToken';
export const PENDING_AUTH_ROUTE_KEY = 'pendingAuthRoute';
export const PENDING_AUTH_STEP_KEY = 'pendingAuthStep';

// Types
export type AuthStep = 'verify-otp' | 'create-pin' | 'verify-pin';

export interface PendingAuthRoute {
  path: `/auth/${AuthStep}`;
  params?: {
    user_id?: number;
    phone?: string;
    expiresAt?: string | null;
    requires_profile?: string | null;
  };
  expiresAt?: string | null; // null = no expiry (persistent until login)
}

export interface PendingAuthStep {
  step: AuthStep;
  userId?: number;
  phone?: string;
  expiresAt?: string | null;
  requires_profile?: string | null;
}

// Pending Auth Route Management
export async function setPendingAuthRoute(route: PendingAuthRoute): Promise<void> {
  try {
    await SecureStore.setItemAsync(PENDING_AUTH_ROUTE_KEY, JSON.stringify(route));

    const step: AuthStep = route.path === '/auth/create-pin'
      ? 'create-pin'
      : route.path === '/auth/verify-pin'
        ? 'verify-pin'
        : 'verify-otp';

    const stepData: PendingAuthStep = {
      step,
      userId: route.params?.user_id,
      phone: route.params?.phone,
      // null means persistent (no expiry)
      expiresAt: route.expiresAt !== undefined ? route.expiresAt : (route.params?.expiresAt ?? null),
      requires_profile: route.params?.requires_profile,
    };

    await SecureStore.setItemAsync(PENDING_AUTH_STEP_KEY, JSON.stringify(stepData));
  } catch (error) {
    // Silent fail for storage errors
  }
}

export async function getPendingAuthRoute(): Promise<PendingAuthRoute | null> {
  try {
    // Try to get from route key first
    const rawRoute = await SecureStore.getItemAsync(PENDING_AUTH_ROUTE_KEY);
    if (rawRoute) {
      const parsed = JSON.parse(rawRoute);
      if (parsed?.path) {
        const expiresAt = parsed.expiresAt !== undefined ? parsed.expiresAt : (parsed?.params?.expiresAt ?? null);
        // Only check expiry if expiresAt is a non-null string
        if (expiresAt && new Date(expiresAt) <= new Date()) {
          await clearPendingAuthRoute();
          return null;
        }
        return parsed as PendingAuthRoute;
      }
    }

    // Fallback to step key
    const rawStep = await SecureStore.getItemAsync(PENDING_AUTH_STEP_KEY);
    if (!rawStep) return null;

    const parsedStep = JSON.parse(rawStep);
    const { step, userId, phone, expiresAt, requires_profile } = parsedStep;

    if (!step) return null;

    // Only check expiry if expiresAt is a non-null string
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      await clearPendingAuthRoute();
      return null;
    }

    const pathMap: Record<AuthStep, `/auth/${AuthStep}`> = {
      'verify-otp': '/auth/verify-otp',
      'create-pin': '/auth/create-pin',
      'verify-pin': '/auth/verify-pin',
    };

    return {
      path: pathMap[step as AuthStep],
      params: { user_id: userId, phone, expiresAt: expiresAt ?? null, requires_profile: requires_profile ?? null },
      expiresAt: expiresAt ?? null,
    };
  } catch (error) {
    return null;
  }
}

export async function clearPendingAuthRoute(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PENDING_AUTH_ROUTE_KEY);
    await SecureStore.deleteItemAsync(PENDING_AUTH_STEP_KEY);
  } catch (error) {
    // Silent fail for storage errors
  }
}

// Auth API Functions
export async function requestOtp(phone: string, roleId?: number, fullName?: string, nrcNumber?: string) {
  const payload: any = { phone_number: phone };
  const rid = typeof roleId === 'number' ? roleId : ROLE_ID;
  if (rid) payload.role_id = rid;
  if (fullName) payload.full_name = fullName;
  if (nrcNumber) payload.nrc_number = nrcNumber;

  return apiFetch('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(phone: string, otp: string) {
  return apiFetch('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phone, otp_code: otp }),
  });
}

export async function createPin(userId: number, pin: string, fullName?: string, nrcNumber?: string) {
  const payload: any = { user_id: userId, pin };
  if (fullName) payload.full_name = fullName;
  if (nrcNumber) payload.nrc_number = nrcNumber;

  return apiFetch('/auth/create-pin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyPin(userId: number, pin: string, deviceName?: string, deviceId?: string) {
  const res = await apiFetch('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, pin, device_name: deviceName, device_id: deviceId }),
  });

  if (res.status === 200 && res.body?.data?.access_token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, res.body.data.access_token);
  }

  return res;
}

export async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' });
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await clearPendingAuthRoute();
}

export async function forgotPin(phone: string) {
  return apiFetch('/auth/forgot-pin', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phone }),
  });
}

export async function resetPin(phone: string, otpCode: string, newPin: string) {
  return apiFetch('/auth/reset-pin', {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phone,
      otp_code: otpCode,
      new_pin: newPin,
    }),
  });
}

// Utility function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return !!token;
  } catch {
    return false;
  }
}