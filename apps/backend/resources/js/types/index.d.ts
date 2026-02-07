import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Admin-specific types
export interface AdminUser extends User {
    phone: string | null;
    notes: string | null;
    is_admin: boolean;
    items_count: number;
    projects_count: number;
    tags_count: number;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    path: string;
}

export interface AdminStats {
    users: {
        total: number;
        admins: number;
        verified: number;
    };
    content: {
        active_todos: number;
        active_lists: number;
        total_items: number;
        items_by_status: {
            todo: number;
            doing: number;
            done: number;
            wontdo: number;
        };
    };
    growth: {
        new_users_24h: number;
        new_items_24h: number;
        completed_items_24h: number;
    };
    queue: {
        pending_jobs: number;
        failed_jobs: number;
        pending_notifications: number;
    };
}

export interface CollaborationItem {
    id: string;
    title: string;
    status: string;
    project_id: string | null;
    completed_at: string | null;
    created_at: string;
    project: { id: string; name: string; color: string } | null;
    user?: { id: string; name: string; email: string };
    assignee?: { id: string; name: string; email: string };
}
