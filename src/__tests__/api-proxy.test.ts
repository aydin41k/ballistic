import { fetchItems, updateStatus, createItem, updateItem } from '../lib/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Proxy Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  test('should call local API endpoints', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rows: [] }),
    });

    await fetchItems();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/items'),
      expect.objectContaining({
        cache: 'no-store',
      })
    );
  });

  test('should include action parameter in URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rows: [] }),
    });

    await fetchItems();

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const url = callArgs[0];
    expect(url).toContain('action=list');
  });

  test('should handle POST requests correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', title: 'Test' }),
    });

    await createItem({
      title: 'Test Task',
      project: 'Test Project',
      status: 'pending',
      startDate: '2025-01-01',
      dueDate: '2025-01-01',
      notes: '',
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
  });

  test('should filter out done and cancelled tasks when fetching items', async () => {
    const mockResponse = {
      rows: [
        {
          id: '1',
          task: 'Active Task 1',
          project: 'Project A',
          status: 'pending',
          created_at: '2025-01-01T10:00:00Z',
          notes: 'Active task notes',
        },
        {
          id: '2',
          task: 'Completed Task',
          project: 'Project B',
          status: 'done',
          created_at: '2025-01-01T11:00:00Z',
          notes: 'Completed task notes',
        },
        {
          id: '3',
          task: 'Cancelled Task',
          project: 'Project C',
          status: 'cancelled',
          created_at: '2025-01-01T12:00:00Z',
          notes: 'Cancelled task notes',
        },
        {
          id: '4',
          task: 'Active Task 2',
          project: 'Project A',
          status: 'in_progress',
          created_at: '2025-01-01T13:00:00Z',
          notes: 'Another active task',
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await fetchItems();

    // Should only return active tasks (pending and in_progress)
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Active Task 1');
    expect(result[0].status).toBe('pending');
    expect(result[1].title).toBe('Active Task 2');
    expect(result[1].status).toBe('in_progress');

    // Should not include done or cancelled tasks
    expect(result.find(item => item.status === 'done')).toBeUndefined();
    expect(result.find(item => item.status === 'cancelled')).toBeUndefined();
  });
});
