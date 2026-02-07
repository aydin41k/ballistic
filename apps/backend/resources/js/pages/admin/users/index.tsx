import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { type AdminUser, type BreadcrumbItem, type PaginatedResponse } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';

interface Props {
    users: PaginatedResponse<AdminUser>;
    filters: {
        search: string;
        role: string | null;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Users', href: '/admin/users' },
];

export default function AdminUsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = useCallback(
        (value: string) => {
            setSearch(value);
            router.get('/admin/users', { search: value, role: filters.role ?? '' }, { preserveState: true, replace: true });
        },
        [filters.role],
    );

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Users — Admin" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                        <p className="text-sm text-muted-foreground">{users.total.toLocaleString()} total users</p>
                    </div>

                    {/* Role filter */}
                    <div className="flex gap-2">
                        {(['all', 'admin', 'user'] as const).map((role) => (
                            <Link
                                key={role}
                                href={`/admin/users?role=${role === 'all' ? '' : role}&search=${search}`}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                    (role === 'all' && !filters.role) || filters.role === role
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                            >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search by name, email or phone…"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Email</th>
                                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Phone</th>
                                <th className="px-4 py-3 text-right font-medium">Items</th>
                                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Projects</th>
                                <th className="px-4 py-3 text-left font-medium">Role</th>
                                <th className="px-4 py-3 text-left font-medium">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.data.map((user) => (
                                <tr key={user.id} className="transition-colors hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                                            {user.name}
                                        </Link>
                                    </td>
                                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{user.email}</td>
                                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{user.phone ?? '—'}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{user.items_count}</td>
                                    <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{user.projects_count}</td>
                                    <td className="px-4 py-3">
                                        {user.is_admin ? (
                                            <Badge className="bg-ballistic-indigo text-white">Admin</Badge>
                                        ) : (
                                            <Badge variant="secondary">User</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{new Date(user.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            Showing {users.from}–{users.to} of {users.total}
                        </span>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    className={`rounded px-3 py-1.5 text-sm ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                              ? 'text-foreground hover:bg-muted'
                                              : 'cursor-not-allowed text-muted-foreground opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
