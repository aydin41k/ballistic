import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

jest.mock("@/lib/api", () => ({
  fetchItems: jest.fn().mockResolvedValue([
    { id: "1", title: "A", project: "P", status: "pending", startDate: "2025-01-01", dueDate: "2025-01-01" },
  ]),
  createItem: jest.fn().mockResolvedValue({ id: "2", title: "B", project: "P", status: "pending", startDate: "2025-01-01", dueDate: "2025-01-01" }),
  updateItem: jest.fn().mockResolvedValue({ id: "1", title: "A", project: "P", status: "cancelled", startDate: "2025-01-01", dueDate: "2025-01-01" }),
  deleteItem: jest.fn().mockResolvedValue({ ok: true }),
}));

describe("quick add & delete", () => {
  test("clicking add row opens form", async () => {
    render(<Home />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add a new task/i })).toBeInTheDocument();
    });

    const quick = screen.getByRole("button", { name: /add a new task/i });
    await userEvent.click(quick);
    expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
  });

  test("clicking task row opens edit form", async () => {
    render(<Home />);
    
    // Wait for loading to complete and item to appear
    await waitFor(() => {
      expect(screen.getByText(/^A$/)).toBeInTheDocument();
    });

    // Click on the task row to open edit dialog
    const taskRow = screen.getByText(/^A$/).closest('div[class*="cursor-pointer"]');
    if (taskRow) {
      await userEvent.click(taskRow);
      expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
    }
  });
});


