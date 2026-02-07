import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { type AdminStats, type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, AlertTriangle, CheckCircle2, Settings, Shield, TrendingUp, Users } from 'lucide-react';

interface Props {
    stats: AdminStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Health Pulse', href: '/admin' },
];

export default function AdminDashboard({ stats }: Props) {
    const { auth } = usePage<SharedData>().props;
    const queueHealthy = stats.queue.failed_jobs === 0;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Health Pulse — Admin" />
            <div className="flex flex-col gap-6 p-4">
                {/* Welcome header */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {auth.user.name}</h1>
                            <Badge className="bg-ballistic-indigo text-white">
                                <Shield className="mr-1 size-3" />
                                Admin
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Here's the platform health at a glance.</p>
                    </div>
                    {/* Quick actions */}
                    <div className="flex gap-2">
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            <Users className="size-4" />
                            Manage Users
                        </Link>
                        <Link
                            href="/settings/profile"
                            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            <Settings className="size-4" />
                            Settings
                        </Link>
                    </div>
                </div>

                {/* Users & Growth */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Users</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Users" value={stats.users.total} icon={<Users className="size-4" />} />
                        <StatCard title="Admins" value={stats.users.admins} icon={<Users className="size-4" />} muted />
                        <StatCard title="Verified" value={stats.users.verified} icon={<CheckCircle2 className="size-4" />} muted />
                        <StatCard
                            title="New (24h)"
                            value={stats.growth.new_users_24h}
                            icon={<TrendingUp className="size-4" />}
                            highlight={stats.growth.new_users_24h > 0}
                        />
                    </div>
                </section>

                {/* Content */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Content</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Active Todos" value={stats.content.active_todos} icon={<Activity className="size-4" />} />
                        <StatCard title="Active Lists" value={stats.content.active_lists} icon={<Activity className="size-4" />} muted />
                        <StatCard title="New Items (24h)" value={stats.growth.new_items_24h} icon={<TrendingUp className="size-4" />} />
                        <StatCard
                            title="Completed (24h)"
                            value={stats.growth.completed_items_24h}
                            icon={<CheckCircle2 className="size-4" />}
                            highlight={stats.growth.completed_items_24h > 0}
                        />
                    </div>
                </section>

                {/* Item Status Breakdown */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Item Status Breakdown</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Todo" value={stats.content.items_by_status.todo} muted />
                        <StatCard title="Doing" value={stats.content.items_by_status.doing} muted />
                        <StatCard title="Done" value={stats.content.items_by_status.done} muted />
                        <StatCard title="Won't Do" value={stats.content.items_by_status.wontdo} muted />
                    </div>
                </section>

                {/* Queue Health */}
                <section>
                    <h2 className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">Notification Queue Health</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <StatCard title="Pending Jobs" value={stats.queue.pending_jobs} icon={<Activity className="size-4" />} />
                        <StatCard
                            title="Failed Jobs"
                            value={stats.queue.failed_jobs}
                            icon={queueHealthy ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                            danger={stats.queue.failed_jobs > 0}
                        />
                        <StatCard
                            title="Pending Notifications"
                            value={stats.queue.pending_notifications}
                            icon={<Activity className="size-4" />}
                            muted
                        />
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    icon?: React.ReactNode;
    muted?: boolean;
    highlight?: boolean;
    danger?: boolean;
}

function StatCard({ title, value, icon, muted, highlight, danger }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <span className={danger ? 'text-destructive' : highlight ? 'text-ballistic-sky' : 'text-muted-foreground'}>{icon}</span>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${danger ? 'text-destructive' : muted ? 'text-muted-foreground' : ''}`}>
                    {value.toLocaleString()}
                </div>
            </CardContent>
        </Card>
    );
}
