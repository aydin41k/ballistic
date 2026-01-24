import { cycleStatus, STATUS_CYCLE } from "@/lib/status";
import type { Status } from "@/types";

describe("status cycle", () => {
  test("cycles through todo -> done -> wontdo -> doing -> todo", () => {
    const order = STATUS_CYCLE;
    expect(order.length).toBe(4);
    let s: Status = order[0];
    expect(s).toBe("todo");
    s = cycleStatus(s);
    expect(s).toBe("done");
    s = cycleStatus(s);
    expect(s).toBe("wontdo");
    s = cycleStatus(s);
    expect(s).toBe("doing");
    s = cycleStatus(s);
    expect(s).toBe("todo");
  });
});
