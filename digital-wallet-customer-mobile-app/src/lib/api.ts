import * as SecureStore from 'expo-secure-store';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://smart-wallet-api-vm58.onrender.com/api';
export const ROLE_ID = Number(process.env.EXPO_PUBLIC_ROLE_ID ?? 4);

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('customerAuthToken');
  } catch (e) {
    return null;
  }
}

export async function uploadFormData(path: string, formData: FormData): Promise<{ status: number; body: any }> {
  const token = await getAuthToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_BASE + path);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      const text = xhr.responseText;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve({ status: xhr.status, body: text ? JSON.parse(text) : null });
        } catch (e) {
          resolve({ status: xhr.status, body: text });
        }
      } else {
        if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
          try {
            resolve({ status: xhr.status, body: JSON.parse(text) });
            return;
          } catch (e) {
            // fallback
          }
        }
        if (xhr.status === 413) {
          reject(new Error('File too large. Please choose a smaller image.'));
          return;
        }
        reject(new Error(text || `Server error (${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload request timed out'));
    };

    xhr.send(formData);
  });
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isFormData = options.body && (
    typeof options.body !== 'string' &&
    (
      options.body instanceof FormData ||
      '_parts' in (options.body as any) ||
      (options.body.constructor && typeof options.body.constructor.name === 'string' && options.body.constructor.name.includes('FormData'))
    )
  );

  if (isFormData) {
    return uploadFormData(path, options.body as FormData);
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
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
