import { API_BASE } from "@/services/apiConfig";

export function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${API_BASE}${path}`;
}
