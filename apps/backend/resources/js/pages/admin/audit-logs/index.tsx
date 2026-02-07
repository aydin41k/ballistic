import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface AuditLog {
    id: number;
    user: { id: string; name: string; email: string } | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    status: string;
    ip_address: string | null;
    created_at: string;
}

interface Props {
    logs: {
        data: AuditLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        action?: string;
        status?: string;
    };
    actions: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Audit Logs', href: '/admin/audit-logs' },
];

export default function AuditLogsIndex({ logs, filters, actions }: Props) {
    const [action, setAction] = useState(filters.action ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const handleFilter = (newAction: string, newStatus: string) => {
        router.get(
            '/admin/audit-logs',
            {
                action: newAction === 'all' ? undefined : newAction,
                status: newStatus === 'all' ? undefined : newStatus,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Audit Logs</h1>

                <div className="flex gap-4">
                    <div className="w-[250px]">
                        <Label htmlFor="action">Filter by Action</Label>
                        <Select
                            value={action}
                            onValueChange={(value) => {
                                setAction(value);
                                handleFilter(value, status);
                            }}
                        >
                            <SelectTrigger id="action">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {actions.map((a) => (
                                    <SelectItem key={a} value={a}>
                                        {a.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-[200px]">
                        <Label htmlFor="status">Filter by Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) => {
                                setStatus(value);
                                handleFilter(action, value);
                            }}
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Resource</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No audit logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.user ? log.user.name : 'Unauthenticated'}</TableCell>
                                        <TableCell className="font-mono text-sm">{log.action.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>
                                            {log.resource_type ? (
                                                <>
                                                    {log.resource_type}
                                                    {log.resource_id && ` #${log.resource_id.slice(0, 8)}`}
                                                </>
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{log.ip_address ?? '—'}</TableCell>
                                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {(logs.current_page - 1) * logs.per_page + 1} to {Math.min(logs.current_page * logs.per_page, logs.total)} of{' '}
                            {logs.total} logs
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={logs.current_page === 1}
                                onClick={() =>
                                    router.get(
                                        '/admin/audit-logs',
                                        { ...filters, page: logs.current_page - 1 },
                                        { preserveState: true, preserveScroll: true },
                                    )
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={logs.current_page === logs.last_page}
                                onClick={() =>
                                    router.get(
                                        '/admin/audit-logs',
                                        { ...filters, page: logs.current_page + 1 },
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
