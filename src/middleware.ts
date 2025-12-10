import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Check if this is a static asset or API route
  const isStaticOrApi = pathname.startsWith('/_next') || 
                        pathname.startsWith('/api') ||
                        pathname.includes('.');

  // Skip middleware for static assets and API routes
  if (isStaticOrApi) {
    return NextResponse.next();
  }

  // For public routes, just continue
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side handle auth
  // since the token is stored in localStorage (not accessible in middleware)
  // The page components will redirect to /login if not authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation files)
     * - favicon.ico (favicon file)
     * - public files (e.g. images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
