import { render, screen, waitFor } from "@testing-library/react";
import GoogleCallbackPage from "@/app/auth/google/callback/page";

const replaceMock = jest.fn();
const completeGoogleLoginMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ completeGoogleLogin: completeGoogleLoginMock }),
}));

describe("GoogleCallbackPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "/auth/google/callback");
  });

  test("exchanges the callback code and opens the app", async () => {
    completeGoogleLoginMock.mockResolvedValue(undefined);
    window.history.replaceState(
      {},
      "",
      "/auth/google/callback?code=one-time-code",
    );

    render(<GoogleCallbackPage />);

    await waitFor(() =>
      expect(completeGoogleLoginMock).toHaveBeenCalledWith("one-time-code"),
    );
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/app"));
  });

  test("shows a retry path when the callback has no code", async () => {
    render(<GoogleCallbackPage />);

    expect(await screen.findByText("Couldn’t sign you in")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to sign in" }),
    ).toHaveAttribute("href", "/login");
    expect(completeGoogleLoginMock).not.toHaveBeenCalled();
  });
});
