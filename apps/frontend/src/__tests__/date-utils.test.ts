import { localEndOfDayMs, toLocalDateString } from "@/lib/dateUtils";

describe("date utils", () => {
  test("formats date-only strings from local date fields instead of UTC", () => {
    expect(toLocalDateString(new Date(2026, 6, 19, 23, 30))).toBe("2026-07-19");
  });

  test("parses API date-only values as the local end of day", () => {
    const timestamp = localEndOfDayMs("2026-07-19");
    const parsed = new Date(timestamp);

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(19);
    expect(parsed.getHours()).toBe(23);
    expect(parsed.getMinutes()).toBe(59);
    expect(parsed.getSeconds()).toBe(59);
  });
});
