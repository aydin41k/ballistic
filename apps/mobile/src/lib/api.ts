import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { authStorage } from '@/lib/auth-storage';
import type {
  ActivityLogItem,
  AuthResponse,
  CursorPaginatedResponse,
  Item,
  ItemScope,
  McpToken,
  MobilePushSubscription,
  NotificationsResponse,
  Project,
  Status,
  User,
  UserLookup,
  ValidationError,
} from '@/types';

type QueryValue = string | number | boolean | null | undefined;

let onUnauthorised: (() => void | Promise<void>) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setUnauthorisedHandler(handler: (() => void | Promise<void>) | null): void {
  onUnauthorised = handler;
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return Platform.OS === 'android' ? 'http://10.0.2.2' : 'http://localhost';
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const entries = Object.entries(query ?? {}).filter(
    ([, value]) => value !== undefined && value !== null,
  );
  const search = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `${getApiBaseUrl()}${path}${search ? `?${search}` : ''}`;
}

function unwrap<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: T }).data;
    if (data !== undefined && data !== null) return data;
  }
  return payload as T;
}

async function parseError(response: Response): Promise<ApiError> {
  const payload = (await response
    .json()
    .catch(() => ({ message: 'Request failed' }))) as Partial<ValidationError>;
  return new ApiError(payload.message || 'Request failed', response.status, payload.errors ?? {});
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  query?: Record<string, QueryValue>,
  authenticated = true,
): Promise<T> {
  const token = authenticated ? await authStorage.getToken() : null;
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('X-Ballistic-Client', `mobile/${Platform.OS}`);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { ...options, headers });
  } catch {
    throw new ApiError('Could not reach Ballistic. Check your connection and try again.', 0);
  }

  if (response.status === 401 && authenticated) {
    await authStorage.clearSession();
    await onUnauthorised?.();
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

function deviceName(): string {
  return Device.deviceName || Device.modelName || `Ballistic on ${Platform.OS}`;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(
    '/api/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, device_name: deviceName() }),
    },
    undefined,
    false,
  );
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>(
    '/api/register',
    {
      method: 'POST',
      body: JSON.stringify({ ...payload, device_name: deviceName() }),
    },
    undefined,
    false,
  );
}

export async function logout(): Promise<void> {
  await request('/api/logout', { method: 'POST' }).catch(() => undefined);
}

export async function fetchUser(): Promise<User> {
  return unwrap(await request<User | { data?: User }>('/api/user'));
}

export type UserUpdatePayload = Partial<
  Pick<User, 'name' | 'email' | 'phone' | 'notes' | 'bio' | 'avatar_url'> & {
    feature_flags: Partial<User['feature_flags']> | null;
  }
>;

export async function updateUser(payload: UserUpdatePayload): Promise<User> {
  return unwrap(
    await request<User | { data?: User }>('/api/user', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  );
}

export async function fetchItems(params?: {
  project_id?: string;
  status?: Status | 'all';
  scope?: ItemScope;
  assigned_to_me?: boolean;
  delegated?: boolean;
  include_completed?: boolean;
}): Promise<Item[]> {
  const payload = await request<Item[] | { data?: Item[] }>(
    '/api/items',
    {},
    {
      project_id: params?.project_id,
      status: params?.status === 'all' ? undefined : params?.status,
      scope: params?.scope,
      assigned_to_me: params?.assigned_to_me || undefined,
      delegated: params?.delegated || undefined,
      include_completed: params?.include_completed || undefined,
    },
  );
  const items = unwrap(payload);
  return Array.isArray(items) ? items : [];
}

export async function fetchItem(id: string): Promise<Item> {
  return unwrap(await request<Item | { data?: Item }>(`/api/items/${id}`));
}

export interface ItemInput {
  title: string;
  description?: string | null;
  status?: Status;
  project_id?: string | null;
  position?: number;
  scheduled_date?: string | null;
  due_date?: string | null;
  recurrence_rule?: string | null;
  recurrence_strategy?: Item['recurrence_strategy'];
  assignee_id?: string | null;
  assignee_notes?: string | null;
}

export async function createItem(payload: ItemInput): Promise<Item> {
  return unwrap(
    await request<Item | { data?: Item }>('/api/items', {
      method: 'POST',
      body: JSON.stringify({ status: 'todo', ...payload }),
    }),
  );
}

export async function updateItem(id: string, payload: Partial<ItemInput>): Promise<Item> {
  return unwrap(
    await request<Item | { data?: Item }>(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteItem(id: string): Promise<void> {
  await request(`/api/items/${id}`, { method: 'DELETE' });
}

export async function reorderItems(items: { id: string; position: number }[]): Promise<void> {
  if (items.length === 0) return;
  await request('/api/items/reorder', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function fetchProjects(): Promise<Project[]> {
  const projects = unwrap(await request<Project[] | { data?: Project[] }>('/api/projects'));
  return Array.isArray(projects) ? projects : [];
}

export async function createProject(payload: {
  name: string;
  color?: string | null;
}): Promise<Project> {
  return unwrap(
    await request<Project | { data?: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  );
}

export async function lookupUsers(query: string): Promise<UserLookup[]> {
  if (query.trim().length < 3) return [];
  const users = unwrap(
    await request<UserLookup[] | { data?: UserLookup[] }>('/api/users/lookup', {}, { q: query }),
  );
  return Array.isArray(users) ? users : [];
}

export async function discoverUser(query: string): Promise<{ found: boolean; user?: UserLookup }> {
  return request('/api/users/discover', {
    method: 'POST',
    body: JSON.stringify(query.includes('@') ? { email: query } : { phone: query }),
  });
}

export async function toggleFavourite(
  userId: string,
): Promise<{ is_favourite: boolean; favourites: { data: UserLookup[] } }> {
  return request(`/api/favourites/${userId}`, { method: 'POST' });
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  return request('/api/notifications');
}

export async function markNotificationAsRead(
  id: string,
): Promise<{ message: string; unread_count: number }> {
  return request(`/api/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsAsRead(): Promise<{
  message: string;
  marked_count: number;
}> {
  return request('/api/notifications/read-all', { method: 'POST' });
}

export async function dismissNotification(
  id: string,
): Promise<{ message: string; unread_count: number }> {
  return request(`/api/notifications/${id}`, { method: 'DELETE' });
}

export async function fetchActivityLog(
  cursor?: string,
): Promise<CursorPaginatedResponse<ActivityLogItem>> {
  return request('/api/activity-log', {}, { per_page: 20, cursor });
}

export async function fetchMcpTokens(): Promise<McpToken[]> {
  const tokens = unwrap(await request<McpToken[] | { data?: McpToken[] }>('/api/mcp/tokens'));
  return Array.isArray(tokens) ? tokens : [];
}

export async function createMcpToken(
  name: string,
): Promise<{ token: string; token_record: McpToken }> {
  const payload = await request<{ data?: { token: string; token_record: McpToken } }>(
    '/api/mcp/tokens',
    { method: 'POST', body: JSON.stringify({ name }) },
  );
  const data = unwrap(payload);
  if (!data?.token || !data.token_record) throw new ApiError('Invalid MCP token response.', 500);
  return data;
}

export async function revokeMcpToken(id: string): Promise<void> {
  await request(`/api/mcp/tokens/${id}`, { method: 'DELETE' });
}

export async function subscribeMobilePush(payload: {
  expo_push_token: string;
  platform: 'ios' | 'android';
  device_name: string;
}): Promise<{ message: string; subscription_id: string }> {
  return request('/api/mobile/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unsubscribeMobilePush(expoPushToken: string): Promise<void> {
  await request('/api/mobile/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ expo_push_token: expoPushToken }),
  });
}

export async function listMobilePushSubscriptions(): Promise<{
  subscriptions: MobilePushSubscription[];
  count: number;
}> {
  return request('/api/mobile/push/subscriptions');
}
