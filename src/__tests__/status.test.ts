import { cycleStatus, STATUS_CYCLE } from "@/lib/status";
import type { Status } from "@/types";

describe("status cycle", () => {
  test("cycles through pending -> done -> cancelled -> in_progress -> pending", () => {
    const order = STATUS_CYCLE;
    expect(order.length).toBe(4);
    let s: Status = order[0];
    s = cycleStatus(s);
    expect(s).toBe(order[1]);
    s = cycleStatus(s);
    expect(s).toBe(order[2]);
    s = cycleStatus(s);
    expect(s).toBe(order[3]);
    s = cycleStatus(s);
    expect(s).toBe(order[0]);
  });
});


