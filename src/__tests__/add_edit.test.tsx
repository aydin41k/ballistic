import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

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
    title: "Sample",
    project: "X",
    status: "pending",
    startDate: "2025-01-01",
    dueDate: "2025-01-01",
  }),
}));

describe("add/edit", () => {
  test("open add form and submit", async () => {
    render(<Home />);
    
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


