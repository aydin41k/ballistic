export type Status = "pending" | "done" | "cancelled" | "in_progress";

export interface Item {
  id: string;
  title: string;
  project: string;
  startDate: string; // ISO date YYYY-MM-DD
  dueDate: string; // ISO date YYYY-MM-DD
  status: Status;
  notes?: string;
}


