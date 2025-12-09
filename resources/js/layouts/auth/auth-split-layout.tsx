import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r overflow-hidden">
                {/* Gradient background matching brand */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900" />
                
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <svg className="absolute w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                            d="M0 100 Q30 70, 50 50 T100 0"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.3"
                            strokeDasharray="2 1"
                        />
                    </svg>
                    <div className="absolute bottom-1/4 left-1/4 w-6 h-6 bg-white rounded-full blur-md opacity-60 animate-pulse" />
                    <div className="absolute bottom-1/3 left-1/3 w-4 h-4 bg-white rounded-full blur-md opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full blur-sm opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white rounded-full blur-sm opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-1/4 right-1/4 text-2xl text-white opacity-30">✦</div>
                    <div className="absolute top-2/3 left-1/5 text-white opacity-20">✦</div>
                    <div className="absolute bottom-1/4 right-1/3 text-lg text-white opacity-25">✦</div>
                </div>
                
                <Link href={home()} className="relative z-20 flex items-center gap-3 text-lg font-medium">
                    <AppLogoIcon className="h-10 w-10" />
                    <span className="font-semibold tracking-tight">{name}</span>
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">&ldquo;{quote.message}&rdquo;</p>
                            <footer className="text-sm text-white/70">{quote.author}</footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link href={home()} className="relative z-20 flex items-center justify-center gap-2 lg:hidden">
                        <AppLogoIcon className="h-10 w-10" />
                        <span className="text-lg font-semibold tracking-tight">{name}</span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
