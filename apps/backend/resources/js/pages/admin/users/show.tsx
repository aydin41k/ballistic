import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_admin: boolean;
    email_verified_at: string | null;
    created_at: string;
}

interface Project {
    id: string;
    name: string;
}

interface Task {
    id: string;
    title: string;
}

interface Props {
    user: User;
    statistics: {
        items_count: number;
        projects_count: number;
        tags_count: number;
        assigned_items_count: number;
        connections_count: number;
    };
    sharedProjects: Project[];
    assignedTasks: Task[];
    delegatedTasks: Task[];
}

export default function UsersShow({ user, statistics, sharedProjects, assignedTasks, delegatedTasks }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Users', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
    ];

    const handleHardReset = () => {
        if (confirm(`Are you sure you want to hard reset ${user.name}? This will delete all their data. This action cannot be undone.`)) {
            router.post(`/admin/users/${user.id}/hard-reset`);
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={user.name} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/users">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        {user.is_admin && <Badge variant="default">Admin</Badge>}
                    </div>
                    <Button variant="destructive" onClick={handleHardReset}>
                        Hard Reset User Data
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.items_count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.projects_count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.assigned_items_count}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Connections</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.connections_count}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.email}</span>
                            {user.email_verified_at && <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{user.phone}</span>
                            </div>
                        )}
                        <div className="text-sm text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Collaboration History</CardTitle>
                        <CardDescription>Recent shared projects and task assignments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="mb-2 font-medium">Shared Projects ({sharedProjects.length})</h3>
                            {sharedProjects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No shared projects</p>
                            ) : (
                                <ul className="space-y-1">
                                    {sharedProjects.map((project) => (
                                        <li key={project.id} className="text-sm">
                                            {project.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <h3 className="mb-2 font-medium">Assigned Tasks ({assignedTasks.length})</h3>
                            {assignedTasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No assigned tasks</p>
                            ) : (
                                <ul className="space-y-1">
                                    {assignedTasks.slice(0, 5).map((task) => (
                                        <li key={task.id} className="text-sm">
                                            {task.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <h3 className="mb-2 font-medium">Delegated Tasks ({delegatedTasks.length})</h3>
                            {delegatedTasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No delegated tasks</p>
                            ) : (
                                <ul className="space-y-1">
                                    {delegatedTasks.slice(0, 5).map((task) => (
                                        <li key={task.id} className="text-sm">
                                            {task.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
