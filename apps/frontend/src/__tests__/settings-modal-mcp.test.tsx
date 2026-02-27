import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsModal } from "@/components/SettingsModal";
import { createMcpToken, fetchMcpTokens, revokeMcpToken } from "@/lib/api";

jest.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    dates: false,
    delegation: false,
    aiAssistant: true,
    userFlags: { dates: false, delegation: false, ai_assistant: true },
    available: { dates: true, delegation: true, ai_assistant: true },
    setFlag: jest.fn(),
    loaded: true,
  }),
}));

jest.mock("@/components/PushNotificationToggle", () => ({
  PushNotificationToggle: () => <div>Push stub</div>,
}));

jest.mock("@/lib/api", () => ({
  fetchMcpTokens: jest.fn(),
  createMcpToken: jest.fn(),
  revokeMcpToken: jest.fn(),
}));

describe("SettingsModal MCP token management", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (fetchMcpTokens as jest.Mock).mockResolvedValue([
      {
        id: "tok-1",
        name: "Claude Desktop",
        created_at: "2026-01-01T00:00:00Z",
        last_used_at: null,
        is_legacy_wildcard: false,
      },
    ]);
    (createMcpToken as jest.Mock).mockResolvedValue({
      token: "plain-token-value",
      token_record: {
        id: "tok-2",
        name: "Cursor",
        created_at: "2026-01-02T00:00:00Z",
        last_used_at: null,
        is_legacy_wildcard: false,
      },
    });
    (revokeMcpToken as jest.Mock).mockResolvedValue(undefined);
  });

  test("loads existing MCP tokens and supports create/revoke", async () => {
    const user = userEvent.setup();

    render(<SettingsModal isOpen={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(fetchMcpTokens).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Token name (e.g. Claude Desktop)"),
      "Cursor",
    );
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createMcpToken).toHaveBeenCalledWith("Cursor");
    });
    expect(screen.getByText("plain-token-value")).toBeInTheDocument();

    // New token is prepended; click Revoke for the first one (tok-2 "Cursor")
    await user.click(screen.getAllByRole("button", { name: "Revoke" })[0]);
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() => {
      expect(revokeMcpToken).toHaveBeenCalledWith("tok-2");
    });
  });

  test("cancelling revoke confirmation does not call revokeMcpToken", async () => {
    const user = userEvent.setup();

    render(<SettingsModal isOpen={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(revokeMcpToken).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Yes" }),
    ).not.toBeInTheDocument();
  });

  test("shows retry button when token load fails", async () => {
    (fetchMcpTokens as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const user = userEvent.setup();
    render(<SettingsModal isOpen={true} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load tokens.")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();

    // Successful retry
    (fetchMcpTokens as jest.Mock).mockResolvedValueOnce([]);
    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Failed to load tokens."),
      ).not.toBeInTheDocument();
    });
  });
});
