import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900" />
            
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Trajectory line */}
                <svg className="absolute w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path
                        d="M0 100 Q30 70, 50 50 T100 0"
                        fill="none"
                        stroke="white"
                        strokeWidth="0.3"
                        strokeDasharray="2 1"
                    />
                </svg>
                
                {/* Glowing dots */}
                <div className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-white rounded-full blur-sm opacity-60 animate-pulse" />
                <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-white rounded-full blur-sm opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full blur-sm opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white rounded-full blur-sm opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }} />
                
                {/* Star sparkles */}
                <div className="absolute top-1/4 right-1/4 text-white opacity-30">✦</div>
                <div className="absolute top-2/3 left-1/5 text-white opacity-20 text-xs">✦</div>
                <div className="absolute bottom-1/4 right-1/3 text-white opacity-25 text-sm">✦</div>
            </div>
            
            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <Link href={home()} className="flex items-center gap-3 self-center font-medium">
                    <AppLogoIcon className="h-10 w-10" />
                    <span className="text-xl font-semibold text-white tracking-tight">Ballistic</span>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl border-0">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">{children}</CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
