export interface Building {
  building_id: number;
  name: string;
}

export interface Place {
  place_id: number;
  place_name: string;
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
  votesCount: number;
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
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface TicketCreateFormValues {
  complaint: number;
  employee: number | null;
  deadline: string | null;
}
