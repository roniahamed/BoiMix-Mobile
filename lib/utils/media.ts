import { ENV } from "@/constants/env";

/**
 * Resolves a media URL returned from Django REST Framework.
 * If the path is relative (e.g. "/media/books/covers/..."), prefixes the backend host.
 * If already absolute (e.g. Cloudinary / CDN), returns as-is.
 * If null, undefined, or empty, returns empty string "" (does NOT return a fake image).
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = ENV.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}
