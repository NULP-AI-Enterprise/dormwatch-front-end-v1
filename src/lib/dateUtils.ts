// Single user-facing date formatter. Uses the uk-UA locale so dates render
// consistently regardless of the browser's default locale.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("uk-UA");
}

// True when an ISO timestamp falls on the same local calendar day as `day`.
// Both sides use the local `en-CA` (YYYY-MM-DD) rendering, matching the
// DatePicker's own local-day semantics. Shared by the complaint/ticket date
// filters (was an inline predicate copy-pasted in three list pages).
export function isSameLocalDay(iso: string | null | undefined, day: Date): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return false;
  return date.toLocaleDateString("en-CA") === day.toLocaleDateString("en-CA");
}
