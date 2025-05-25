// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Get auth token
  const token = request.cookies.get('auth_token')?.value;
  const isAdmin = request.cookies.get('user_is_admin')?.value === 'true';
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password'
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Handle public routes
  if (isPublicRoute) {
    // If user is already logged in, redirect to dashboard
    if (token) {
      const destination = isAdmin ? '/admin/dashboard' : '/user/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }
  
  // Root path redirect
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const destination = isAdmin ? '/admin/dashboard' : '/user/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }
  
  // Require authentication for all other routes
  if (!token) {
    // Save the original URL to redirect back after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }
  
  // Role-based access control
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/user/dashboard', request.url));
  }
  
  if (pathname.startsWith('/user') && isAdmin) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};