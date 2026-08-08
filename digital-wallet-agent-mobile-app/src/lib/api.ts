import * as SecureStore from 'expo-secure-store';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
export const ROLE_ID = Number(process.env.EXPO_PUBLIC_ROLE_ID ?? 3);

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('agentAuthToken');
  } catch (e) {
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  if (!API_BASE) {
    throw new Error('API_BASE is not configured. Check your .env file.');
  }
  const token = await getAuthToken();
  const isFormData = options.body && (
    typeof options.body !== 'string' &&
    (
      options.body instanceof FormData ||
      '_parts' in (options.body as any) ||
      (options.body.constructor && typeof options.body.constructor.name === 'string' && options.body.constructor.name.includes('FormData'))
    )
  );
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
  });

  const text = await res.text();

  // Surface non-JSON server errors (e.g. 413 Request Entity Too Large from Nginx)
  if (!res.ok && !text.trim().startsWith('{') && !text.trim().startsWith('[')) {
    if (res.status === 413) {
      throw new Error('File too large. Please choose a smaller image.');
    }
    throw new Error(`Server error (${res.status})`);
  }

  try {
    return { status: res.status, body: text ? JSON.parse(text) : null };
  } catch (e) {
    return { status: res.status, body: text };
  }
}

export default apiFetch;
