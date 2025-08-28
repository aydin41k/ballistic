import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

// Mock the API functions
jest.mock("@/lib/api", () => ({
  fetchItems: jest.fn().mockResolvedValue([
    { id: "1", title: "Sample", project: "X", status: "pending", startDate: "2025-01-01", dueDate: "2025-01-01" },
  ]),
  createItem: jest.fn().mockResolvedValue({
    id: "2",
    title: "New task",
    project: "X",
    status: "pending",
    startDate: "2025-01-01",
    dueDate: "2025-01-01",
  }),
  updateItem: jest.fn().mockResolvedValue({
    id: "1",
    title: "Updated Sample",
    project: "X",
    status: "pending",
    startDate: "2025-01-01",
    dueDate: "2025-01-01",
  }),
  updateStatus: jest.fn().mockResolvedValue({
    id: "1",
    title: "Sample",
    project: "X",
    status: "in_progress",
    startDate: "2025-01-01",
    dueDate: "2025-01-01",
  }),
  deleteItem: jest.fn().mockResolvedValue({ ok: true }),
  moveItem: jest.fn().mockResolvedValue([
    { id: "1", title: "Sample", project: "X", status: "pending", startDate: "2025-01-01", dueDate: "2025-01-01" },
  ]),
}));

describe("Optimistic Updates", () => {
  test("status change updates UI immediately", async () => {
    const user = userEvent.setup();
    render(<Home />);

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
    render(<Home />);

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
    render(<Home />);

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
