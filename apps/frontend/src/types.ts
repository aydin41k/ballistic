export type Status = "todo" | "doing" | "done" | "wontdo";

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Item {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: Status;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  project?: Project | null;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}
