import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page';

// Mock the API
jest.mock('../lib/api', () => ({
  fetchItems: jest.fn(() => Promise.resolve([])),
  createItem: jest.fn(),
}));

describe('Item Creation Response Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('newly created item text should persist after server response', async () => {
    const { createItem } = require('../lib/api');
    
    // Mock createItem to return a properly formatted item after a delay
    createItem.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          id: 'server-123',
          title: 'Test Task',
          project: 'Test Project',
          status: 'pending',
          startDate: '2025-10-24',
          dueDate: '2025-10-24',
          notes: 'Test notes'
        }), 100)
      )
    );

    render(<Home />);

    // Wait for initial load and ensure the add button is visible
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Click the add button
    const addButton = await screen.findByText('Add new task...');
    fireEvent.click(addButton);

    // Fill out the form
    const titleInput = screen.getByPlaceholderText('Task');
    fireEvent.change(titleInput, { target: { value: 'Test Task' } });

    // Expand more settings to access project and notes fields
    const moreSettingsButton = screen.getByText('More settings');
    fireEvent.click(moreSettingsButton);

    const projectInput = screen.getByPlaceholderText('Project');
    const notesInput = screen.getByPlaceholderText('Notes');

    fireEvent.change(projectInput, { target: { value: 'Test Project' } });
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    // Submit the form
    const saveButton = screen.getByText('Add');
    fireEvent.click(saveButton);

    // Verify the item appears immediately (optimistic update)
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();

    // Wait for the server response to come back
    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith({
        title: 'Test Task',
        project: 'Test Project',
        status: 'pending',
        startDate: expect.any(String),
        dueDate: expect.any(String),
        notes: 'Test notes'
      });
    }, { timeout: 200 });

    // Verify the text is still visible after server response
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });
  });

  test('item creation handles GAS format response correctly', async () => {
    const { createItem } = require('../lib/api');
    
    // Mock createItem to return GAS format (with task instead of title)
    createItem.mockImplementation(() => 
      Promise.resolve({
        id: 'gas-123',
        task: 'GAS Task',  // Note: 'task' instead of 'title'
        project: 'GAS Project',
        status: 'pending',
        created_at: '2025-10-24T12:00:00Z',
        due_date: '2025-10-24',
        notes: 'GAS notes'
      })
    );

    render(<Home />);

    // Wait for initial load and ensure the add button is visible
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    // Click the add button
    const addButton = await screen.findByText('Add new task...');
    fireEvent.click(addButton);

    // Fill out the form
    const titleInput = screen.getByPlaceholderText('Task');
    fireEvent.change(titleInput, { target: { value: 'GAS Task' } });

    // Expand more settings to access project and notes fields
    const moreSettingsButton = screen.getByText('More settings');
    fireEvent.click(moreSettingsButton);

    const projectInput = screen.getByPlaceholderText('Project');
    const notesInput = screen.getByPlaceholderText('Notes');

    fireEvent.change(projectInput, { target: { value: 'GAS Project' } });
    fireEvent.change(notesInput, { target: { value: 'GAS notes' } });

    // Submit the form
    const saveButton = screen.getByText('Add');
    fireEvent.click(saveButton);

    // Wait for the server response and verify text persists
    await waitFor(() => {
      expect(screen.getByText('GAS Task')).toBeInTheDocument();
      expect(screen.getByText('GAS Project')).toBeInTheDocument();
      expect(screen.getByText('GAS notes')).toBeInTheDocument();
    });
  });
});
