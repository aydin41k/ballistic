import type { Item } from "@/types";

// Shared in-memory store for dummy API. This resets on server restart.
export const store: { items: Item[] } = {
  items: [
    {
      id: "1",
      startDate: "2025-01-27",
      dueDate: "2025-01-30",
      title: "Review project proposal",
      project: "Work",
      status: "done",
      notes: "Client presentation deadline approaching",
    },
    {
      id: "2",
      startDate: "2025-01-27",
      dueDate: "2025-01-28",
      title: "Call client about updates",
      project: "Work",
      status: "in_progress",
      notes: "Discuss timeline changes",
    },
    {
      id: "3",
      startDate: "2025-01-27",
      dueDate: "2025-01-27",
      title: "Buy groceries",
      project: "Personal",
      status: "pending",
    },
    {
      id: "4",
      startDate: "2025-01-27",
      dueDate: "2025-01-27",
      title: "Gym workout",
      project: "Health",
      status: "cancelled",
    },
  ],
};


