import { ENV } from "@/constants/env";

const FALLBACK_BOOK_COVER =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400";

/**
 * Resolves a media URL returned from Django REST Framework.
 * If the path is relative (e.g. "/media/books/covers/..."), prefixes the backend host.
 * If already absolute (e.g. Cloudinary / Unsplash), returns as-is.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return FALLBACK_BOOK_COVER;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = ENV.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}
