// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/api/auth/login',
  '/api/auth/register',
];

// Check if the path is public
const isPublicPath = (path: string) => {
  return publicPaths.some(publicPath => path.startsWith(publicPath));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Don't redirect API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For public paths, redirect to dashboard if already logged in
  if (isPublicPath(pathname)) {
    if (token) {
      // Check if the token contains admin claim
      const isAdmin = false; // In a real app, you would decode the token and check
      
      // If token exists, redirect to appropriate dashboard
      const url = request.nextUrl.clone();
      url.pathname = isAdmin ? '/admin/dashboard' : '/user/dashboard';
      return NextResponse.redirect(url);
    }
    
    // Allow access to public paths if not logged in
    return NextResponse.next();
  }

  // For protected paths, redirect to login if not logged in
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    
    // Store the original URL to redirect back after login
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Handle admin routes - ensure only admins can access
  if (pathname.startsWith('/admin/')) {
    // In a real implementation, you would decode the JWT to check if user is admin
    // This is just a placeholder example
    const isAdmin = false; // Should be determined from the token
    
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/user/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Allow access to protected routes if logged in
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /static (static files)
     * 3. /favicon.ico, /robots.txt (common static files)
     * 4. /images, /fonts (static assets)
     */
    '/((?!_next|static|favicon.ico|robots.txt|images|fonts).*)',
  ],
};