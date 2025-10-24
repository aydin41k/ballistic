import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';
import * as api from '../lib/api';

// Mock the API
jest.mock('../lib/api', () => ({
  fetchItems: jest.fn(() => Promise.resolve([
    { id: '1', title: 'First Task', project: 'Project A', status: 'pending', startDate: '2025-10-24', dueDate: '2025-10-24', notes: '' },
    { id: '2', title: 'Second Task', project: 'Project B', status: 'pending', startDate: '2025-10-24', dueDate: '2025-10-24', notes: '' },
  ])),
  createItem: jest.fn(),
}));

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: mockScrollIntoView,
  writable: true,
});

describe('Item Addition Order and Scrolling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScrollIntoView.mockClear();
  });

  test('new items should be added to the bottom of the list', async () => {
    const { createItem } = api;
    
    // Mock createItem to return a properly formatted item
    createItem.mockImplementation(() => 
      Promise.resolve({
        id: 'new-123',
        title: 'New Task',
        project: 'New Project',
        status: 'pending',
        startDate: '2025-10-24',
        dueDate: '2025-10-24',
        notes: 'New notes'
      })
    );

    render(<Home />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Verify initial items are present
    expect(screen.getByText('First Task')).toBeInTheDocument();
    expect(screen.getByText('Second Task')).toBeInTheDocument();

    // Click the add button
    const addButton = await screen.findByText('Add new task...');
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Fill out the form
    const titleInput = screen.getByPlaceholderText('Task');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'New Task' } });
    });

    // Expand more settings to access project and notes fields
    const moreSettingsButton = screen.getByText('More settings');
    await act(async () => {
      fireEvent.click(moreSettingsButton);
    });

    const projectInput = screen.getByPlaceholderText('Project');
    const notesInput = screen.getByPlaceholderText('Notes');

    await act(async () => {
      fireEvent.change(projectInput, { target: { value: 'New Project' } });
      fireEvent.change(notesInput, { target: { value: 'New notes' } });
    });

    // Submit the form
    const saveButton = screen.getByText('Add');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify the new item appears immediately (optimistic update)
    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('New notes')).toBeInTheDocument();

    // Get all task elements and verify order
    const taskElements = screen.getAllByText(/Task$/).map(el => el.textContent);
    expect(taskElements).toEqual(['First Task', 'Second Task', 'New Task']);
  });

  test('should attempt to scroll to newly added item', async () => {
    const { createItem } = api;
    
    // Mock createItem to return a properly formatted item
    createItem.mockImplementation(() => 
      Promise.resolve({
        id: 'scroll-test-123',
        title: 'Scroll Test Task',
        project: 'Scroll Project',
        status: 'pending',
        startDate: '2025-10-24',
        dueDate: '2025-10-24',
        notes: ''
      })
    );

    // Mock querySelector to track what it's being called with
    const originalQuerySelector = document.querySelector;
    const mockQuerySelector = jest.fn().mockImplementation((selector) => {
      const element = originalQuerySelector.call(document, selector);
      if (element) {
        return element;
      }
      return null;
    });
    document.querySelector = mockQuerySelector;

    render(<Home />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Click the add button
    const addButton = await screen.findByText('Add new task...');
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Fill out the form
    const titleInput = screen.getByPlaceholderText('Task');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Scroll Test Task' } });
    });

    // Submit the form
    const saveButton = screen.getByText('Add');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Wait for the item to appear in the DOM first
    await waitFor(() => {
      expect(screen.getByText('Scroll Test Task')).toBeInTheDocument();
    });

    // Wait for querySelector to be called with the temporary item ID
    await waitFor(() => {
      expect(mockQuerySelector).toHaveBeenCalledWith(expect.stringMatching(/\[data-item-id="temp-\d+"\]/));
    }, { timeout: 300 });

    // Restore original querySelector
    document.querySelector = originalQuerySelector;
  });

  test('should handle scroll when element is not found gracefully', async () => {
    const { createItem } = api;
    
    // Mock querySelector to return null (element not found)
    const originalQuerySelector = document.querySelector;
    document.querySelector = jest.fn().mockReturnValue(null);
    
    // Mock createItem to return a properly formatted item
    createItem.mockImplementation(() => 
      Promise.resolve({
        id: 'not-found-123',
        title: 'Not Found Task',
        project: 'Not Found Project',
        status: 'pending',
        startDate: '2025-10-24',
        dueDate: '2025-10-24',
        notes: ''
      })
    );

    render(<Home />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Click the add button
    const addButton = await screen.findByText('Add new task...');
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Fill out the form
    const titleInput = screen.getByPlaceholderText('Task');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Not Found Task' } });
    });

    // Submit the form
    const saveButton = screen.getByText('Add');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify the item still appears (even though scroll fails)
    await waitFor(() => {
      expect(screen.getByText('Not Found Task')).toBeInTheDocument();
    });

    // Wait a bit to ensure setTimeout has executed
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Verify scrollIntoView was not called since element wasn't found
    expect(mockScrollIntoView).not.toHaveBeenCalled();

    // Restore original querySelector
    document.querySelector = originalQuerySelector;
  });
});
