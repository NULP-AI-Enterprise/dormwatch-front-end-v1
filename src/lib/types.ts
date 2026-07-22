export interface Building {
  building_id: number;
  name: string;
  // Present in the buildings API payload; only surfaced/edited in admin settings.
  address?: string;
  // Per-dorm emergency contacts, shown in the profile modal. Optional/blank when unset.
  commandant_phone?: string;
}

// A selectable room/place within a building. Kept distinct from Building on
// purpose — the backend models places separately, and the two may diverge if
// the place data is populated independently of buildings.
export interface Place {
  place_id: number;
  place_name: string;
  // Residents the room holds; 0 = not a residence (kitchen/common area).
  capacity: number;
  // A shared room (kitchen/laundry/common) is a complaint location only, never
  // a resident's assigned residence. Maps from backend `is_shared`.
  isShared: boolean;
  // Live count of residents assigned here. Read-only; maps from backend `occupancy`.
  occupancy?: number;
}

export interface CategoryOption {
  category_id: number;
  name: string;
}

// A role assignable to a user (admin/student/worker/…). Roles are a backend
// table, not an enum — any role_name can exist. Used by the admin residents page.
export interface Role {
  role_id: number;
  role_name: string;
}

export interface Complaint {
  id: number;
  title: string;
  description: string;
  // null when the payload has no category/priority/timestamp — rendered as
  // "unknown" (no chip/badge/date) rather than a fabricated value.
  category: string | null;
  building: string;
  room: string;
  placeName: string;
  floor: string;
  photoUrl: string | null;
  thumbnail: string | null;
  status: string;
  priority: string | null;
  createdAt: string | null;
  user_id: number | null;
}

export interface Comment {
  id: number;
  text: string;
  author: string;
  author_id: number;
  authorIsAdmin: boolean;
  date: string;
}

export interface Worker {
  worker_id: number;
  full_name: string;
  company?: string;
  phone?: string;
}

export interface Ticket {
  ticket_id: number;
  complaint: number;
  worker?: Worker;
  deadline?: string;
}

// An admin-posted announcement. `building` null = global (all buildings);
// `building_name` is the read label. `is_expired` is server-derived (expiry
// only marks/hides — the row stays reachable — and clears `is_pinned`).
export interface Announcement {
  announcement_id: number;
  title: string;
  body: string;
  building: number | null;
  building_name: string | null;
  is_pinned: boolean;
  expires_at: string | null;
  is_expired: boolean;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface UserProfile {
  user: number;
  first_name: string;
  last_name: string;
  email: string;
  // Building set on the profile independently of room; a user may have a
  // building but no place yet. Room is still derived from `place`.
  building?: Building | null;
  room: string;
  role: {
    role_name: string;
  };
  photo_url?: string | null;
  place?: {
    place_id?: number;
    place_name: string;
    building?: Building;
  };
}
