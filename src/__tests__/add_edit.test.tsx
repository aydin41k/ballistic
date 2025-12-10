import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { AuthProvider } from "@/contexts/AuthContext";

// Mock auth
jest.mock("@/lib/auth", () => ({
  getToken: jest.fn(() => "test-token"),
  getStoredUser: jest.fn(() => ({
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    email_verified_at: "2025-01-01T00:00:00Z",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  })),
  setToken: jest.fn(),
  clearToken: jest.fn(),
  setStoredUser: jest.fn(),
  isAuthenticated: jest.fn(() => true),
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getAuthHeaders: jest.fn(() => ({
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "Bearer test-token",
  })),
  AuthError: class AuthError extends Error {
    errors: Record<string, string[]>;
    constructor(message: string, errors: Record<string, string[]> = {}) {
      super(message);
      this.name = "AuthError";
      this.errors = errors;
    }
  },
}));

jest.mock("@/lib/api", () => ({
  fetchItems: jest.fn().mockResolvedValue([
    {
      id: "1",
      user_id: "user-1",
      project_id: null,
      title: "Sample",
      description: null,
      status: "todo",
      position: 0,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
      deleted_at: null,
    },
  ]),
  createItem: jest.fn().mockResolvedValue({
    id: "2",
    user_id: "user-1",
    project_id: null,
    title: "New task",
    description: null,
    status: "todo",
    position: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
  }),
  updateItem: jest.fn().mockResolvedValue({
    id: "1",
    user_id: "user-1",
    project_id: null,
    title: "Sample",
    description: null,
    status: "todo",
    position: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
  }),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe("add/edit", () => {
  test("open add form and submit", async () => {
    renderWithAuth(<Home />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add a new task/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /add a new task/i }));
    const field = screen.getByPlaceholderText(/^Task$/i);
    await userEvent.type(field, "New task");
    await userEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(await screen.findByText(/^New task$/i)).toBeInTheDocument();
  });
});
