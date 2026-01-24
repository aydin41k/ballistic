import { middleware } from "../middleware";

describe("Middleware", () => {
  test("middleware function exists and is exported", () => {
    expect(typeof middleware).toBe("function");
  });

  test("middleware is callable", () => {
    expect(middleware).toBeDefined();
  });
});
