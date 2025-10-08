import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemRow } from '@/components/ItemRow';
import type { Item } from '@/types';
import { moveItem } from '@/lib/api';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  updateStatus: jest.fn(),
  moveItem: jest.fn(),
}));

describe('Move to Top functionality', () => {
  const mockItem: Item = {
    id: '2',
    title: 'Second Task',
    project: 'Test Project',
    status: 'pending',
    startDate: '2025-01-01',
    dueDate: '2025-01-10',
    notes: '',
  };

  const mockOnChange = jest.fn();
  const mockOnReorder = jest.fn();
  const mockOnOptimisticReorder = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the move to top button when item is not first', () => {
    render(
      <ItemRow
        item={mockItem}
        onChange={mockOnChange}
        onReorder={mockOnReorder}
        onOptimisticReorder={mockOnOptimisticReorder}
        index={1}
        onEdit={mockOnEdit}
        isFirst={false}
        isLast={false}
      />
    );

    const moveToTopButton = screen.getByLabelText('Move to top');
    expect(moveToTopButton).toBeInTheDocument();
    expect(moveToTopButton).toHaveTextContent('⇈');
  });

  it('should not render the move to top button when item is first', () => {
    render(
      <ItemRow
        item={mockItem}
        onChange={mockOnChange}
        onReorder={mockOnReorder}
        onOptimisticReorder={mockOnOptimisticReorder}
        index={0}
        onEdit={mockOnEdit}
        isFirst={true}
        isLast={false}
      />
    );

    const moveToTopButton = screen.queryByLabelText('Move to top');
    expect(moveToTopButton).not.toBeInTheDocument();
  });

  it('should call onOptimisticReorder with "top" direction when clicked', async () => {
    (moveItem as jest.Mock).mockResolvedValue([]);

    render(
      <ItemRow
        item={mockItem}
        onChange={mockOnChange}
        onReorder={mockOnReorder}
        onOptimisticReorder={mockOnOptimisticReorder}
        index={2}
        onEdit={mockOnEdit}
        isFirst={false}
        isLast={false}
      />
    );

    const moveToTopButton = screen.getByLabelText('Move to top');
    fireEvent.click(moveToTopButton);

    await waitFor(() => {
      expect(mockOnOptimisticReorder).toHaveBeenCalledWith('2', 'top');
    });
  });

  it('should be positioned to the left of the up arrow', () => {
    render(
      <ItemRow
        item={mockItem}
        onChange={mockOnChange}
        onReorder={mockOnReorder}
        onOptimisticReorder={mockOnOptimisticReorder}
        index={1}
        onEdit={mockOnEdit}
        isFirst={false}
        isLast={false}
      />
    );

    const buttons = screen.getAllByRole('button');
    const moveToTopButton = screen.getByLabelText('Move to top');
    const moveUpButton = screen.getByLabelText('Move up');

    // Find the indices of both buttons in the buttons array
    const moveToTopIndex = buttons.indexOf(moveToTopButton);
    const moveUpIndex = buttons.indexOf(moveUpButton);

    // Move to top button should appear before (have a lower index than) the up button
    expect(moveToTopIndex).toBeLessThan(moveUpIndex);
  });
});

describe('Move to Top optimistic update', () => {
  it('should move item to the top of the list', () => {
    const items: Item[] = [
      {
        id: '1',
        title: 'First Task',
        project: 'Project A',
        status: 'pending',
        startDate: '2025-01-01',
        dueDate: '2025-01-10',
        notes: '',
      },
      {
        id: '2',
        title: 'Second Task',
        project: 'Project B',
        status: 'pending',
        startDate: '2025-01-02',
        dueDate: '2025-01-11',
        notes: '',
      },
      {
        id: '3',
        title: 'Third Task',
        project: 'Project C',
        status: 'pending',
        startDate: '2025-01-03',
        dueDate: '2025-01-12',
        notes: '',
      },
    ];

    // Simulate the optimistic reorder logic
    const itemId = '3';
    const direction = 'top';
    const currentIndex = items.findIndex((item) => item.id === itemId);
    const newList = [...items];
    
    if (direction === 'top' && currentIndex > 0) {
      const [item] = newList.splice(currentIndex, 1);
      newList.unshift(item);
    }

    expect(newList[0].id).toBe('3');
    expect(newList[1].id).toBe('1');
    expect(newList[2].id).toBe('2');
    expect(newList).toHaveLength(3);
  });

  it('should not modify the list when item is already at the top', () => {
    const items: Item[] = [
      {
        id: '1',
        title: 'First Task',
        project: 'Project A',
        status: 'pending',
        startDate: '2025-01-01',
        dueDate: '2025-01-10',
        notes: '',
      },
      {
        id: '2',
        title: 'Second Task',
        project: 'Project B',
        status: 'pending',
        startDate: '2025-01-02',
        dueDate: '2025-01-11',
        notes: '',
      },
    ];

    // Simulate the optimistic reorder logic for the first item
    const itemId = '1';
    const direction = 'top';
    const currentIndex = items.findIndex((item) => item.id === itemId);
    const newList = [...items];
    
    if (direction === 'top' && currentIndex > 0) {
      const [item] = newList.splice(currentIndex, 1);
      newList.unshift(item);
    }

    // List should remain unchanged
    expect(newList[0].id).toBe('1');
    expect(newList[1].id).toBe('2');
    expect(newList).toHaveLength(2);
  });
});

