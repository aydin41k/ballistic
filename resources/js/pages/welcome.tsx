import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome to Ballistic">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>
            
            <div className="relative min-h-screen overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900" />
                
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Large trajectory line */}
                    <svg className="absolute w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                            d="M-10 110 Q30 70, 50 50 T110 -10"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.2"
                            strokeDasharray="2 1"
                        />
                        <path
                            d="M-20 120 Q40 80, 60 60 T120 -20"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.15"
                            strokeDasharray="1.5 1"
                        />
                    </svg>
                    
                    {/* Glowing waypoint dots */}
                    <div className="absolute bottom-1/5 left-1/6 w-8 h-8 bg-white rounded-full blur-lg opacity-40 animate-pulse" />
                    <div className="absolute bottom-1/4 left-1/4 w-6 h-6 bg-white rounded-full blur-md opacity-50 animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-white rounded-full blur-md opacity-45 animate-pulse" style={{ animationDelay: '0.6s' }} />
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full blur-sm opacity-40 animate-pulse" style={{ animationDelay: '0.9s' }} />
                    <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white rounded-full blur-sm opacity-35 animate-pulse" style={{ animationDelay: '1.2s' }} />
                    <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white rounded-full blur-sm opacity-30 animate-pulse" style={{ animationDelay: '1.5s' }} />
                    
                    {/* Sparkle stars */}
                    <div className="absolute top-1/6 right-1/5 text-3xl text-white opacity-25">✦</div>
                    <div className="absolute top-1/3 left-1/5 text-xl text-white opacity-20">✦</div>
                    <div className="absolute top-2/3 right-1/4 text-lg text-white opacity-15">✦</div>
                    <div className="absolute bottom-1/4 left-1/2 text-sm text-white opacity-20">✦</div>
                    <div className="absolute top-1/2 right-1/6 text-2xl text-white opacity-15">✦</div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 flex min-h-screen flex-col">
                    {/* Navigation */}
                    <header className="w-full px-6 py-6 lg:px-12">
                        <nav className="mx-auto flex max-w-7xl items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AppLogoIcon className="h-10 w-10" />
                                <span className="text-xl font-bold text-white tracking-tight">Ballistic</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={dashboard()}
                                        className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="rounded-lg px-5 py-2.5 text-sm font-medium text-white/90 transition-colors hover:text-white hover:bg-white/10"
                                        >
                                            Sign in
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </header>
                    
                    {/* Hero Section */}
                    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:py-24">
                        <div className="mx-auto max-w-4xl text-center">
                            {/* Logo Icon Large */}
                            <div className="mb-8 flex justify-center">
                                <AppLogoIcon className="h-24 w-24" />
                            </div>
                            
                            {/* Headline */}
                            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                <span className="block mt-2 pb-2 bg-gradient-to-r from-white via-sky-200 to-white bg-clip-text text-transparent">
                                    The simplest bullet journal
                                </span>
                            </h1>
                            
                            {/* Subheadline */}
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80 sm:text-xl">
                                Track your tasks with ease and precision.<br/>
                                Ballistic helps you organise your projects, schedule your items, and track your progress with a clean, focused interface.
                            </p>
                        </div>
                        
                        {/* Features Grid */}
                        <div className="mx-auto mt-20 grid max-w-5xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/15">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white">Smart Task Management</h3>
                                <p className="text-sm text-white/70">
                                    Create, organise, and track tasks with statuses, priorities, and due dates. Never miss a deadline again.
                                </p>
                            </div>
                            
                            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/15">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white">Project Organisation</h3>
                                <p className="text-sm text-white/70">
                                    Group related tasks into projects. Archive completed work and keep your workspace clean and focused.
                                </p>
                            </div>
                            
                            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/15 sm:col-span-2 lg:col-span-1">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-white">Tags & Categories</h3>
                                <p className="text-sm text-white/70">
                                    Label your tasks with custom tags. Filter and find exactly what you need in seconds.
                                </p>
                            </div>
                        </div>
                    </main>
                    
                    {/* Footer */}
                    <footer className="w-full px-6 py-8">
                        <div className="mx-auto max-w-7xl text-center">
                            <p className="text-sm text-white/50">
                                © {new Date().getFullYear()} Ballistic by <a href="https://psycode.com.au" target='_blank'>Psycode Pty. Ltd.</a>
                            </p>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
