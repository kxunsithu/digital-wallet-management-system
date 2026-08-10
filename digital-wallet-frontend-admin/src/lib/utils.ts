import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ImageLike = {
  image_url?: string | null;
  image_path?: string | null;
};

export function resolveImageUrl(image?: ImageLike | null): string | null {
  if (!image) return null;

  const rawUrl = image.image_url;
  const rawPath = image.image_path;

  let url: string | null = null;

  if (rawUrl) {
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      url = rawUrl;
    } else {
      const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "");
      url = base ? `${base}/storage/${rawUrl.replace(/^\//, "")}` : rawUrl;
    }
  } else if (rawPath) {
    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      url = rawPath;
    } else {
      const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "");
      url = base ? `${base}/storage/${rawPath.replace(/^\//, "")}` : rawPath;
    }
  }

  if (url && import.meta.env.VITE_API_URL?.startsWith("https://") && url.startsWith("http://")) {
    url = url.replace(/^http:\/\//, "https://");
  }

  return url;
}

export function getPlaceholderImage(width = 300, height = 200, text = "Image Not Found"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#f1f5f9"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#94a3b8">${text}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  width = 300,
  height = 200,
  text = "Image Not Found"
) {
  const target = e.currentTarget;
  target.onerror = null;
  target.src = getPlaceholderImage(width, height, text);
}

