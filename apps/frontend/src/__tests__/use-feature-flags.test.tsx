import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { AuthContext } from "@/contexts/AuthContext";
import type { User } from "@/types";

function Harness() {
  const { setFlag } = useFeatureFlags();

  return (
    <>
      <button type="button" onClick={() => void setFlag("dates", true)}>
        Toggle dates
      </button>
      <button type="button" onClick={() => void setFlag("velocity", true)}>
        Toggle velocity
      </button>
    </>
  );
}

describe("useFeatureFlags", () => {
  test("sends only the changed flag key to avoid multi-tab race conditions", async () => {
    const updateUser = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    const mockUser: User = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      phone: null,
      notes: null,
      feature_flags: {
        dates: false,
        delegation: false,
        ai_assistant: true,
        velocity: false,
      },
      email_verified_at: "2025-01-01T00:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    render(
      <AuthContext.Provider
        value={{
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          refreshUser: jest.fn(),
          updateUser,
        }}
      >
        <Harness />
      </AuthContext.Provider>,
    );

    await user.click(screen.getByRole("button", { name: "Toggle dates" }));

    await waitFor(() => {
      // Only the changed key is sent; server-side merge handles the rest.
      expect(updateUser).toHaveBeenCalledWith({
        feature_flags: { dates: true },
      });
    });
  });

  test("sends velocity flag key when toggled", async () => {
    const updateUser = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    const mockUser: User = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      phone: null,
      notes: null,
      feature_flags: {
        dates: false,
        delegation: false,
        ai_assistant: false,
        velocity: false,
      },
      email_verified_at: "2025-01-01T00:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    render(
      <AuthContext.Provider
        value={{
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          refreshUser: jest.fn(),
          updateUser,
        }}
      >
        <Harness />
      </AuthContext.Provider>,
    );

    await user.click(screen.getByRole("button", { name: "Toggle velocity" }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({
        feature_flags: { velocity: true },
      });
    });
  });
});
