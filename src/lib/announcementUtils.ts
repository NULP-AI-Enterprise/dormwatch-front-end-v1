import type { Announcement } from "@/lib/types";

// Single source of truth for announcement ordering: pinned first, then newest.
export const sortAnnouncements = (list: Announcement[]): Announcement[] =>
  [...list].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
