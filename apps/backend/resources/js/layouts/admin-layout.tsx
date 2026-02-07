import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

/**
 * Admin Layout - Reuses the existing AppLayout for consistency
 * with the Ballistic design system.
 */
export default ({ children, breadcrumbs, ...props }: AdminLayoutProps) => (
    <AppLayout breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayout>
);
