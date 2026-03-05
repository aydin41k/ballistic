export type Status = "todo" | "doing" | "done" | "wontdo";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  avatar_url?: string | null;
  feature_flags?: {
    dates: boolean;
    delegation: boolean;
    ai_assistant: boolean;
  } | null;
  /**
   * Project IDs the user has hidden from their main feed. Persisted server-side
   * via the project_user_exclusions pivot. Always present on GET /api/user;
   * may be absent on legacy cached payloads, hence optional.
   */
  excluded_project_ids?: string[];
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  favourites?: UserLookup[];
}

export interface UserLookup {
  id: string;
  name: string;
  email_masked: string;
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

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  assignee_id: string | null;
  project_id: string | null;
  title: string;
  description: string | null;
  assignee_notes: string | null;
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
  is_assigned: boolean;
  is_delegated: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  project?: Project | null;
  tags?: Tag[];
  assignee?: UserLookup | null;
  owner?: UserLookup | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  unread_count: number;
  /** Cursor for the next page. null when no more pages. */
  next_cursor?: string | null;
  /** True if more pages are available. */
  has_more?: boolean;
}

/**
 * Site-wide feature flags controlled by admins (distinct from per-user
 * User.feature_flags). Fetched once at app hydration via GET /api/feature-flags.
 * Keys are flag identifiers, values indicate whether the feature is enabled.
 */
export type GlobalFeatureFlags = Record<string, boolean>;

/** A single closed (done/wontdo) item in the activity log feed. */
export interface ActivityLogEntry {
  id: string;
  title: string;
  status: Extract<Status, "done" | "wontdo">;
  project_id: string | null;
  project?: Pick<Project, "id" | "name" | "color"> | null;
  completed_at: string | null;
  updated_at: string;
}

export interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface McpToken {
  id: string;
  name: string;
  created_at: string | null;
  last_used_at: string | null;
  is_legacy_wildcard: boolean;
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
