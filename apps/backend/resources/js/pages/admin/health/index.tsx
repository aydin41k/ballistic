import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Activity, AlertCircle, CheckCircle2, Users } from 'lucide-react';

interface Props {
    stats: {
        users: {
            total: number;
            admins: number;
            verified: number;
            recent: number;
            active_today: number;
        };
        items: {
            total: number;
            by_status: Record<string, number>;
            overdue: number;
            recurring_templates: number;
            recent: number;
            completed_today: number;
        };
        projects: {
            total: number;
            archived: number;
            active: number;
        };
        tags: {
            total: number;
        };
        notifications: {
            total: number;
            unread: number;
            pending: number;
        };
        activity: {
            items_completed_today: number;
            items_completed_this_week: number;
            items_created_today: number;
            items_created_this_week: number;
        };
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'System Health', href: '/admin/health' },
];

export default function HealthIndex({ stats }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="System Health" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">System Health Pulse</h1>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.users.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.users.admins} admins, {stats.users.verified} verified
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.items.total}</div>
                            <p className="text-xs text-muted-foreground">{stats.items.completed_today} completed today</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{stats.items.overdue}</div>
                            <p className="text-xs text-muted-foreground">Require attention</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.projects.active}</div>
                            <p className="text-xs text-muted-foreground">{stats.projects.total} total</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items by Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {Object.entries(stats.items.by_status).map(([status, count]) => (
                                <div key={status} className="flex justify-between">
                                    <span className="capitalize">{status}</span>
                                    <span className="font-bold">{count}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>24h Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span>Items Created</span>
                                <span className="font-bold">{stats.activity.items_created_today}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Items Completed</span>
                                <span className="font-bold">{stats.activity.items_completed_today}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Active Users</span>
                                <span className="font-bold">{stats.users.active_today}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pending Notifications</span>
                                <span className="font-bold">{stats.notifications.pending}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>7-Day Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>New Users</span>
                            <span className="font-bold">{stats.users.recent}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>New Items</span>
                            <span className="font-bold">{stats.items.recent}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Items Completed</span>
                            <span className="font-bold">{stats.activity.items_completed_this_week}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
