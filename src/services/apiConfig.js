// Single source of truth for the API base URL.
// Imported by both problemsApi.js and imageUtils.js so the value is
// declared once rather than duplicated per service module.
export const API_BASE = import.meta.env.VITE_API_URL || "/api";
