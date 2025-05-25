import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the path is for dashboard (any path that's not login)
  const isDashboardPath = pathname === '/' || 
                         pathname.startsWith('/dashboard') ||
                         pathname.startsWith('/users') || 
                         pathname.startsWith('/withdrawals') ||
                         pathname.startsWith('/kyc') || 
                         pathname.startsWith('/plans') ||
                         pathname.startsWith('/tasks') ||
                         pathname.startsWith('/transactions') ||
                         pathname.startsWith('/notifications') ||
                         pathname.startsWith('/settings');

  // Check if the path is for authentication
  const isAuthPath = pathname.startsWith('/login');
  
  // Get token from cookie
  const token = request.cookies.get(process.env.NEXT_PUBLIC_API_TOKEN_KEY || 'investment_admin_token')?.value;
  
  // Redirect logic
  if (isDashboardPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protected routes
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
    // Auth routes
    '/login'
  ],
};