// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware that only handles basic auth redirects
export function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl;
  
  // Define authentication routes that don't require auth
  const authRoutes = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => pathname === route);
  
  // Get token from cookies - safely
  const token = request.cookies.get('auth_token')?.value;
  
  // Only apply redirections for non-static content
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Handle redirects based on auth state
  if (!token && !isAuthRoute) {
    // Redirect to login if not authenticated and not on an auth route
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (token && pathname === '/login') {
    // Redirect to dashboard if authenticated and trying to access login
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Apply middleware to specific routes only
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
  ],
};