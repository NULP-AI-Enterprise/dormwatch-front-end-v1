// Single user-facing date formatter. Uses the uk-UA locale so dates render
// consistently regardless of the browser's default locale.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("uk-UA");
}

// Date + time formatter for lifecycle stamps (started/finished) — the
// worker's history cites exact times as evidence, so a bare date is not enough.
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
