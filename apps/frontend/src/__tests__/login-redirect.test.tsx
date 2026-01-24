import { render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

const replaceMock = jest.fn();
const pushMock = jest.fn();
const loginMock = jest.fn();
let isAuthed = false;

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
    isAuthenticated: isAuthed,
    isLoading: false,
  }),
  AuthError: class AuthError extends Error {},
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthed = false;
  });

  test("renders login form when unauthenticated", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test("redirects authenticated users after render", async () => {
    isAuthed = true;
    render(<LoginPage />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
  });
});
