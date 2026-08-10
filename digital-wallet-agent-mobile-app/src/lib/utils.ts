import { API_BASE } from './api';

type ImageLike = {
  image_url?: string | null;
  image_path?: string | null;
};

/**
 * Derives the public storage base URL from the API_BASE env variable.
 * e.g. "https://api.example.com/api" → "https://api.example.com/storage"
 */
function getStorageBase(): string {
  const base = API_BASE ?? '';
  return base.replace(/\/api\/?$/, '/storage').replace(/\/$/, '');
}

/**
 * Returns a fully-qualified, HTTPS-normalised image URL.
 *
 * Priority:
 *  1. image_url (already absolute, returned by backend formatSystem / UserResource)
 *  2. image_path  → reconstructed against the storage base derived from EXPO_PUBLIC_API_BASE
 *  3. null if neither is present
 */
export function resolveImageUrl(image?: ImageLike | null): string | null {
  if (!image) return null;

  if (image.image_url) {
    return normaliseUrl(image.image_url);
  }

  if (image.image_path) {
    const base = getStorageBase();
    if (!base) return null;
    return `${base}/${image.image_path}`;
  }

  return null;
}

/**
 * Resolve a plain URL string (e.g. system_logo_url) and normalise it.
 * Returns null if the url is falsy.
 */
export function resolveUrl(url?: string | null): string | null {
  if (!url) return null;
  return normaliseUrl(url);
}

/**
 * Ensure the URL uses HTTPS when the API base is HTTPS.
 * This fixes the common issue where a backend behind a reverse proxy
 * returns HTTP URLs even though the public endpoint is HTTPS.
 */
function normaliseUrl(url: string): string {
  const apiBase = API_BASE ?? '';
  if (apiBase.startsWith('https://') && url.startsWith('http://')) {
    return url.replace(/^http:\/\//, 'https://');
  }
  return url;
}
