import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemRow } from "@/components/ItemRow";
import type { Item, Status } from "@/types";

jest.mock("@/lib/api", () => ({
  updateStatus: jest.fn().mockImplementation(async (_id: string, _status: Status) => ({
    id: _id,
    title: "Sample",
    project: "X",
    startDate: "2025-01-01",
    dueDate: "2025-01-01",
    status: _status,
  })),
  moveItem: jest.fn().mockResolvedValue([]),
}));

describe("ItemRow", () => {
  const base: Item = {
    id: "1",
    title: "Sample",
    project: "X",
    startDate: "2025-01-01",
    dueDate: "2025-01-01",
    status: "pending",
  };

  test("clicking status circle advances status", async () => {
    const onChange = jest.fn();
    const onReorder = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    
    render(
      <ItemRow 
        item={base} 
        onChange={onChange} 
        onReorder={onReorder} 
        index={0}
        onEdit={onEdit}
        onDelete={onDelete}
        isFirst={false}
        isLast={false}
      />
    );

    const button = screen.getByRole("button", { name: /toggle status/i });
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalled();
  });
});


