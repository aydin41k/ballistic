import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6 md:p-10">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900" />

            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Trajectory line */}
                <svg className="absolute h-full w-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 Q30 70, 50 50 T100 0" fill="none" stroke="white" strokeWidth="0.3" strokeDasharray="2 1" />
                </svg>

                {/* Glowing dots */}
                <div className="absolute bottom-1/4 left-1/4 h-4 w-4 animate-pulse rounded-full bg-white opacity-60 blur-sm" />
                <div
                    className="absolute bottom-1/3 left-1/3 h-3 w-3 animate-pulse rounded-full bg-white opacity-50 blur-sm"
                    style={{ animationDelay: '0.5s' }}
                />
                <div
                    className="absolute top-1/2 left-1/2 h-2 w-2 animate-pulse rounded-full bg-white opacity-40 blur-sm"
                    style={{ animationDelay: '1s' }}
                />
                <div
                    className="absolute top-1/3 right-1/3 h-2 w-2 animate-pulse rounded-full bg-white opacity-30 blur-sm"
                    style={{ animationDelay: '1.5s' }}
                />

                {/* Star sparkles */}
                <div className="absolute top-1/4 right-1/4 text-white opacity-30">✦</div>
                <div className="absolute top-2/3 left-1/5 text-xs text-white opacity-20">✦</div>
                <div className="absolute right-1/3 bottom-1/4 text-sm text-white opacity-25">✦</div>
            </div>

            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={home()} className="flex flex-col items-center gap-2 font-medium">
                            <AppLogoIcon className="mb-1 h-12 w-12" />
                            <span className="text-xl font-semibold tracking-tight text-white">Ballistic</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium text-white">{title}</h1>
                            <p className="text-center text-sm text-white/70">{description}</p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white/95 p-6 shadow-xl backdrop-blur-sm dark:bg-slate-900/95">{children}</div>
                </div>
            </div>
        </div>
    );
}
