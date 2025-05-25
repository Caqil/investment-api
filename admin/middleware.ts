// admin/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Define public and protected paths
  const { pathname } = request.nextUrl;
  const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
  
  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value;
  
  // Redirect logic
  if (!isPublicPath && !token) {
    // Redirect to login if trying to access protected route without token
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (pathname === '/login' && token) {
    // Redirect to dashboard if trying to access login with token
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Apply middleware only to specific routes
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/users/:path*',
    '/withdrawals/:path*',
    '/kyc/:path*',
    '/plans/:path*',
    '/tasks/:path*',
    '/transactions/:path*',
    '/notifications/:path*',
    '/settings/:path*',
    '/login',
  ],
};