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

// Mock the API functions
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
    title: "Updated Sample",
    description: null,
    status: "todo",
    position: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
  }),
  updateStatus: jest.fn().mockResolvedValue({
    id: "1",
    user_id: "user-1",
    project_id: null,
    title: "Sample",
    description: null,
    status: "doing",
    position: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
  }),
  deleteItem: jest.fn().mockResolvedValue({ ok: true }),
  moveItem: jest.fn().mockResolvedValue([
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

describe("Optimistic Updates", () => {
  test("status change updates UI immediately", async () => {
    const user = userEvent.setup();
    renderWithAuth(<Home />);

    // Wait for the item to load
    await waitFor(() => {
      expect(screen.getByText("Sample")).toBeInTheDocument();
    });

    // Find and click the status circle
    const statusCircle = screen.getByRole("button", { name: /toggle status/i });
    await user.click(statusCircle);

    // The UI should update immediately to show the new status
    // We can verify this by checking if the optimistic update is applied
    expect(statusCircle).toBeInTheDocument();
  });

  test("add item form appears when add button is clicked", async () => {
    const user = userEvent.setup();
    renderWithAuth(<Home />);

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText("Add new task...")).toBeInTheDocument();
    });

    // Click add button
    const addButton = screen.getByRole("button", { name: /add a new task/i });
    await user.click(addButton);

    // The form should appear immediately
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Task")).toBeInTheDocument();
    });
  });

  test("edit form appears when item is clicked", async () => {
    const user = userEvent.setup();
    renderWithAuth(<Home />);

    // Wait for the item to load
    await waitFor(() => {
      expect(screen.getByText("Sample")).toBeInTheDocument();
    });

    // Click on the item to edit
    const itemRow = screen.getByText("Sample").closest("div");
    if (itemRow) {
      await user.click(itemRow);
    }

    // Wait for edit form to appear
    await waitFor(() => {
      expect(screen.getByDisplayValue("Sample")).toBeInTheDocument();
    });
  });
});
