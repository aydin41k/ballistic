import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/register/page";

const replaceMock = jest.fn();
const registerMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    register: registerMock,
    isAuthenticated: false,
  }),
  AuthError: class AuthError extends Error {},
}));

describe("RegisterPage verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("requests email confirmation and shows the pending state", async () => {
    registerMock.mockResolvedValue({
      message: "Confirmation sent",
      verification_channel: "email",
      destination: "j•••@example.com",
    });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Name"), "Jane Citizen");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith(
        "Jane Citizen",
        "jane@example.com",
        "password123",
        "password123",
        "email",
        "",
      ),
    );
    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText(/j•••@example.com/)).toBeInTheDocument();
  });

  test("collects an international mobile number for SMS confirmation", async () => {
    registerMock.mockResolvedValue({
      message: "Confirmation sent",
      verification_channel: "sms",
      destination: "••••••••5678",
    });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Name"), "Jane Citizen");
    await user.click(screen.getByRole("button", { name: "SMS" }));
    await user.type(screen.getByLabelText("Mobile number"), "+61412345678");
    await user.type(screen.getByLabelText("Email"), "jane@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith(
        "Jane Citizen",
        "jane@example.com",
        "password123",
        "password123",
        "sms",
        "+61412345678",
      ),
    );
  });
});
