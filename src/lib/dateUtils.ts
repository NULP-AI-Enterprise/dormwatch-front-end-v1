// Single user-facing date formatter. Uses the uk-UA locale so dates render
// consistently regardless of the browser's default locale.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("uk-UA");
}
