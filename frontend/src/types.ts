export type Role = "admin" | "adjudicator";
export type UserStatus = "invited" | "active" | "deactivated";

export interface User {
  id: string;
  clerk_user_id: string | null;
  email: string;
  display_name: string;
  role: Role;
  status: UserStatus;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Assignment {
  id: string;
  status: string;
  assigned_at: string | null;
  category: { id: string; name: string; short_name: string; group_name: string };
}
