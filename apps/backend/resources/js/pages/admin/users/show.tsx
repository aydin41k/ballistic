import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { type AdminUser, type BreadcrumbItem, type CollaborationItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, FolderOpen, User as UserIcon } from 'lucide-react';

interface SharedProject {
    id: string;
    name: string;
    color: string;
    items_count: number;
}

interface Props {
    user: AdminUser & { notifications_count?: number };
    assigned_items: CollaborationItem[];
    delegated_items: CollaborationItem[];
    shared_projects: SharedProject[];
}

export default function AdminUserShow({ user, assigned_items, delegated_items, shared_projects }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin' },
        { title: 'Users', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
    ];

    const { processing, errors } = useForm({});

    function toggleAdmin() {
        router.patch(`/admin/users/${user.id}`, { is_admin: !user.is_admin }, { preserveScroll: true });
    }

    function hardReset() {
        if (!confirm(`Hard reset ${user.name}? This will permanently delete ALL their data. This cannot be undone.`)) return;
        router.post(`/admin/users/${user.id}/hard-reset`, {}, { preserveScroll: true });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} — Admin`} />
            <div className="flex flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                            <UserIcon className="size-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        {user.is_admin ? <Badge className="bg-ballistic-indigo text-white">Admin</Badge> : <Badge variant="secondary">User</Badge>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={toggleAdmin}
                            disabled={processing}
                            className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                        >
                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                            type="button"
                            onClick={hardReset}
                            disabled={processing}
                            className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                        >
                            Hard Reset
                        </button>
                    </div>
                </div>

                {errors.hard_reset && <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{errors.hard_reset}</div>}
                {errors.is_admin && <div className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{errors.is_admin}</div>}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="Items" value={user.items_count} />
                    <MiniStat label="Projects" value={user.projects_count} />
                    <MiniStat label="Tags" value={user.tags_count} />
                    <MiniStat label="Notifications" value={user.notifications_count ?? 0} />
                </div>

                {/* Profile details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                        <Row label="Email" value={user.email} />
                        <Row label="Phone" value={user.phone ?? '—'} />
                        <Row
                            label="Verified"
                            value={user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString() : 'Not verified'}
                        />
                        <Row label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
                        {user.notes && <Row label="Notes" value={user.notes} />}
                    </CardContent>
                </Card>

                {/* Collaboration History */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Items assigned to this user */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <CheckCircle2 className="size-4 text-muted-foreground" />
                            <CardTitle className="text-base">Assigned to Me ({assigned_items.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {assigned_items.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No items assigned.</p>
                            ) : (
                                <ul className="divide-y text-sm">
                                    {assigned_items.map((item) => (
                                        <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                                            <span className="truncate font-medium">{item.title}</span>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {item.project && (
                                                    <span
                                                        className="rounded px-1.5 py-0.5 text-xs text-white"
                                                        style={{ backgroundColor: item.project.color }}
                                                    >
                                                        {item.project.name}
                                                    </span>
                                                )}
                                                <StatusDot status={item.status} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items delegated by this user */}
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <AlertTriangle className="size-4 text-muted-foreground" />
                            <CardTitle className="text-base">Delegated by Me ({delegated_items.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {delegated_items.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No delegated items.</p>
                            ) : (
                                <ul className="divide-y text-sm">
                                    {delegated_items.map((item) => (
                                        <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                                            <span className="truncate font-medium">{item.title}</span>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {item.assignee && <span className="text-xs text-muted-foreground">→ {item.assignee.name}</span>}
                                                <StatusDot status={item.status} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Shared Lists */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <FolderOpen className="size-4 text-muted-foreground" />
                        <CardTitle className="text-base">Projects ({shared_projects.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {shared_projects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No projects.</p>
                        ) : (
                            <ul className="divide-y text-sm">
                                {shared_projects.map((project) => (
                                    <li key={project.id} className="flex items-center gap-3 py-2">
                                        <span className="size-3 rounded-full" style={{ backgroundColor: project.color }} />
                                        <span className="font-medium">{project.name}</span>
                                        <span className="ml-auto text-muted-foreground">{project.items_count} items</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-xl font-bold tabular-nums">{value.toLocaleString()}</div>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2">
            <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
            <span>{value}</span>
        </div>
    );
}

function StatusDot({ status }: { status: string }) {
    const colours: Record<string, string> = {
        todo: 'bg-muted-foreground',
        doing: 'bg-ballistic-sky',
        done: 'bg-green-500',
        wontdo: 'bg-destructive',
    };
    return <span className={`size-2 rounded-full ${colours[status] ?? 'bg-muted-foreground'}`} />;
}
