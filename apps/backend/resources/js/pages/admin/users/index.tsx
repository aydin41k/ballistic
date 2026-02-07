import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { MoreVertical, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_admin: boolean;
    email_verified_at: string | null;
    created_at: string;
    items_count: number;
    projects_count: number;
    tags_count: number;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        is_admin?: boolean;
        sort?: string;
        direction?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Users', href: '/admin/users' },
];

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [isAdmin, setIsAdmin] = useState<string>(filters.is_admin !== undefined ? String(filters.is_admin) : 'all');

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get('/admin/users', { search, is_admin: isAdmin === 'all' ? undefined : isAdmin }, { preserveState: true, preserveScroll: true });
        }, 500);

        return () => clearTimeout(timer);
    }, [search, isAdmin]);

    const handleSort = (column: string) => {
        const direction = filters.sort === column && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get('/admin/users', { ...filters, search, sort: column, direction }, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (user: User) => {
        if (confirm(`Are you sure you want to delete ${user.name}?`)) {
            router.delete(`/admin/users/${user.id}`);
        }
    };

    const handleHardReset = (user: User) => {
        if (
            confirm(
                `Are you sure you want to hard reset ${user.name}? This will delete all their items, projects, tags, and connections. This action cannot be undone.`,
            )
        ) {
            router.post(`/admin/users/${user.id}/hard-reset`);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">User Management</h1>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <Label htmlFor="search" className="sr-only">
                            Search
                        </Label>
                        <div className="relative">
                            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search by name, email, or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <div className="w-[200px]">
                        <Label htmlFor="is_admin" className="sr-only">
                            Filter by role
                        </Label>
                        <Select value={isAdmin} onValueChange={setIsAdmin}>
                            <SelectTrigger id="is_admin">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="true">Admins Only</SelectItem>
                                <SelectItem value="false">Regular Users</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
                                        Name
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" size="sm" onClick={() => handleSort('email')}>
                                        Email
                                    </Button>
                                </TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Items</TableHead>
                                <TableHead className="text-right">Projects</TableHead>
                                <TableHead className="text-right">Tags</TableHead>
                                <TableHead>
                                    <Button variant="ghost" size="sm" onClick={() => handleSort('created_at')}>
                                        Joined
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/admin/users/${user.id}`} className="hover:underline">
                                                {user.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {user.email}
                                                {user.email_verified_at && <ShieldCheck className="h-3 w-3 text-green-600 dark:text-green-400" />}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.phone ?? '—'}</TableCell>
                                        <TableCell>
                                            {user.is_admin ? <Badge variant="default">Admin</Badge> : <Badge variant="secondary">User</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">{user.items_count}</TableCell>
                                        <TableCell className="text-right">{user.projects_count}</TableCell>
                                        <TableCell className="text-right">{user.tags_count}</TableCell>
                                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/users/${user.id}`}>View Details</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleHardReset(user)}
                                                        className="text-orange-600 dark:text-orange-400"
                                                    >
                                                        Hard Reset
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(user)} className="text-destructive">
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {(users.current_page - 1) * users.per_page + 1} to {Math.min(users.current_page * users.per_page, users.total)} of{' '}
                            {users.total} users
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={users.current_page === 1}
                                onClick={() =>
                                    router.get(
                                        '/admin/users',
                                        { ...filters, search, page: users.current_page - 1 },
                                        { preserveState: true, preserveScroll: true },
                                    )
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={users.current_page === users.last_page}
                                onClick={() =>
                                    router.get(
                                        '/admin/users',
                                        { ...filters, search, page: users.current_page + 1 },
                                        { preserveState: true, preserveScroll: true },
                                    )
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
