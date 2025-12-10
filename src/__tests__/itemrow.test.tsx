import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemRow } from "@/components/ItemRow";
import type { Item, Status } from "@/types";

jest.mock("@/lib/api", () => ({
  updateStatus: jest.fn().mockImplementation(async (_id: string, _status: Status) => ({
    id: _id,
    user_id: "user-1",
    project_id: null,
    title: "Sample",
    description: null,
    status: _status,
    position: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
  })),
  moveItem: jest.fn().mockResolvedValue([]),
}));

describe("ItemRow", () => {
  const base: Item = {
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
  };

  test("clicking status circle advances status", async () => {
    const onChange = jest.fn();
    const onReorder = jest.fn();
    const onOptimisticReorder = jest.fn();
    const onEdit = jest.fn();
    
    render(
      <ItemRow 
        item={base} 
        onChange={onChange} 
        onReorder={onReorder} 
        onOptimisticReorder={onOptimisticReorder}
        index={0}
        onEdit={onEdit}
        isFirst={false}
        isLast={false}
      />
    );

    const button = screen.getByRole("button", { name: /toggle status/i });
    await userEvent.click(button);
    expect(onChange).toHaveBeenCalled();
  });
});
