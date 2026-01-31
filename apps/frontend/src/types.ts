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
  scheduled_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  recurrence_rule: string | null;
  recurrence_parent_id: string | null;
  recurrence_strategy: "expires" | "carry_over" | null;
  is_recurring_template: boolean;
  is_recurring_instance: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  project?: Project | null;
}

export type ItemScope = "active" | "planned" | "all";

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface HeatmapEntry {
  date: string;
  completed_count: number;
}

export interface CategoryDistribution {
  project_id: string | null;
  project_name: string;
  project_color: string | null;
  completed_count: number;
}

export interface StatsResponse {
  heatmap: HeatmapEntry[];
  category_distribution: CategoryDistribution[];
}

export type RecurrencePreset =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly";

export const RECURRENCE_PRESET_RULES: Record<RecurrencePreset, string | null> =
  {
    none: null,
    daily: "FREQ=DAILY",
    weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    weekly: "FREQ=WEEKLY",
    monthly: "FREQ=MONTHLY",
  };
