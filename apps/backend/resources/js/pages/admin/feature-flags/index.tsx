import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface Flag {
    key: string;
    enabled: boolean;
    label: string;
    description: string | null;
    updated_at: string | null;
}

interface Props {
    flags: { data: Flag[] };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Feature Flags', href: '/admin/feature-flags' },
];

export default function FeatureFlagsIndex({ flags }: Props) {
    // Track the key currently in-flight so rapid toggles can't double-fire and
    // the checkbox visually disables until the server round-trip completes.
    const [pendingKey, setPendingKey] = useState<string | null>(null);

    const toggle = (flag: Flag, next: boolean) => {
        if (pendingKey !== null) return;
        setPendingKey(flag.key);
        router.patch(
            `/admin/feature-flags/${flag.key}`,
            { enabled: next },
            {
                preserveScroll: true,
                // The server redirects back to this page with fresh props,
                // so Inertia re-renders with the authoritative state — no
                // optimistic mirror to drift.
                onFinish: () => setPendingKey(null),
            },
        );
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Feature Flags" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Feature Flags</CardTitle>
                        <CardDescription>
                            Toggle site-wide features on or off. Changes take effect immediately and are served from
                            cache, so the production DB is not hit on normal traffic.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Enabled</TableHead>
                                        <TableHead>Flag</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-48">Last Updated</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {flags.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No feature flags registered. Seed the database or create one via the
                                                API.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        flags.data.map((flag) => (
                                            <TableRow key={flag.key}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={flag.enabled}
                                                        disabled={pendingKey === flag.key}
                                                        onCheckedChange={(v) => toggle(flag, v === true)}
                                                        aria-label={`Toggle ${flag.label}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium">{flag.label}</span>
                                                        <Badge variant="outline" className="w-fit font-mono text-xs">
                                                            {flag.key}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {flag.description ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {flag.updated_at ? new Date(flag.updated_at).toLocaleString() : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
