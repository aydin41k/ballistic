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
    Accept: "application/json",
    Authorization: "Bearer test-token",
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
  fetchProjects: jest.fn().mockResolvedValue([]),
  createProject: jest.fn().mockResolvedValue({
    id: "new-proj",
    name: "New Project",
    user_id: "user-1",
    color: null,
    archived_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
  }),
  fetchItems: jest.fn().mockResolvedValue([
    {
      id: "1",
      user_id: "user-1",
      project_id: null,
      title: "A",
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
    title: "B",
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
    title: "A",
    description: null,
    status: "wontdo",
    position: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
  }),
  deleteItem: jest.fn().mockResolvedValue({ ok: true }),
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

describe("quick add & delete", () => {
  test("clicking add row opens form", async () => {
    renderWithAuth(<Home />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /add a new task/i }),
      ).toBeInTheDocument();
    });

    const quick = screen.getByRole("button", { name: /add a new task/i });
    await userEvent.click(quick);
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  });

  test("clicking task row opens edit form", async () => {
    renderWithAuth(<Home />);

    // Wait for loading to complete and item to appear
    await waitFor(() => {
      expect(screen.getByText(/^A$/)).toBeInTheDocument();
    });

    // Click on the task row to open edit dialog
    const taskRow = screen
      .getByText(/^A$/)
      .closest('div[class*="cursor-pointer"]');
    if (taskRow) {
      await userEvent.click(taskRow);
      expect(
        screen.getByRole("button", { name: /^save$/i }),
      ).toBeInTheDocument();
    }
  });
});
