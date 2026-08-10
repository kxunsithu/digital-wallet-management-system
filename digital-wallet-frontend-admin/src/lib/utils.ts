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
  if (image.image_url) return image.image_url;
  if (image.image_path) {
    const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "");
    return base ? `${base}/storage/${image.image_path}` : null;
  }
  return null;
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

