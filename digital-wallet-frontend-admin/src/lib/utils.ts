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
