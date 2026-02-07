import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Settings, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-6 p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Welcome, {auth.user.name}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Manage your account settings below.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/settings/profile"
                        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        <Settings className="size-4" />
                        Profile Settings
                    </Link>
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 rounded-lg bg-ballistic-indigo px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ballistic-indigo/90"
                    >
                        <Shield className="size-4" />
                        Admin Panel
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
