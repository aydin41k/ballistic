import { getActivityTimestamp } from "@/components/ActivityLogModal";
import type { ActivityLogEntry } from "@/types";

describe("getActivityTimestamp", () => {
  test("uses updated_at for wontdo items", () => {
    const entry: ActivityLogEntry = {
      id: "1",
      title: "Skipped task",
      status: "wontdo",
      project_id: null,
      project: null,
      completed_at: "2026-03-10T08:00:00Z",
      updated_at: "2026-03-12T14:30:00Z",
    };

    expect(getActivityTimestamp(entry)).toBe("2026-03-12T14:30:00Z");
  });

  test("prefers completed_at for done items", () => {
    const entry: ActivityLogEntry = {
      id: "2",
      title: "Finished task",
      status: "done",
      project_id: null,
      project: null,
      completed_at: "2026-03-11T09:15:00Z",
      updated_at: "2026-03-12T14:30:00Z",
    };

    expect(getActivityTimestamp(entry)).toBe("2026-03-11T09:15:00Z");
  });
});
