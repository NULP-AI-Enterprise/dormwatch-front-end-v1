export interface Building {
  building_id: number;
  name: string;
  // Present in the buildings API payload; only surfaced/edited in admin settings.
  address?: string;
}

// A selectable room/place within a building. Kept distinct from Building on
// purpose — the backend models places separately, and the two may diverge if
// the place data is populated independently of buildings.
export interface Place {
  place_id: number;
  place_name: string;
}

export interface CategoryOption {
  category_id: number;
  name: string;
}

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  building: string;
  room: string;
  placeName: string;
  floor: string;
  photoUrl: string | null;
  thumbnail: string | null;
  status: string;
  priority: string;
  createdAt: string;
  user_id: number | null;
}

export interface Comment {
  id: number;
  text: string;
  author: string;
  author_id: number;
  date: string;
}

export interface Employee {
  user: number;
  first_name: string;
  last_name: string;
}

export interface Ticket {
  ticket_id: number;
  complaint: number;
  user?: {
    user: number;
    first_name: string;
    last_name: string;
  };
  deadline?: string;
}

export interface UserProfile {
  user: number;
  first_name: string;
  last_name: string;
  email: string;
  building: string;
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
