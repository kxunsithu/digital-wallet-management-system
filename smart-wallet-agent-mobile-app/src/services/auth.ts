// services/auth.ts
import apiFetch, { API_BASE, ROLE_ID } from '../lib/api';
import * as SecureStore from 'expo-secure-store';

export async function requestOtp(phone: string, roleId?: number) {
  const payload: any = { phone_number: phone };
  const rid = typeof roleId === 'number' ? roleId : ROLE_ID;
  if (rid) payload.role_id = rid;

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

export async function createPin(userId: number, pin: string) {
  return apiFetch('/auth/create-pin', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, pin }),
  });
}

export async function verifyPin(userId: number, pin: string, deviceName?: string, deviceId?: string) {
  const res = await apiFetch('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, pin, device_name: deviceName, device_id: deviceId }),
  });

  if (res.status === 200 && res.body?.data?.access_token) {
    await SecureStore.setItemAsync('authToken', res.body.data.access_token);
  }

  return res;
}

export async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' });
  await SecureStore.deleteItemAsync('authToken');
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

export default { requestOtp, verifyOtp, createPin, verifyPin, logout, forgotPin, resetPin };