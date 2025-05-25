// admin/middleware.ts - Fixed version to prevent redirect loops
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets and API routes
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Define authentication routes that don't require auth
  const authRoutes = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/unauthorized'];
  const isAuthRoute = authRoutes.some(route => pathname === route);
  
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  const isAuthenticated = !!token;
  
  // Handle dashboard routes (admin-only)
  if (pathname.startsWith('/dashboard')) {
    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check admin status only if authenticated
    try {
      const userDataCookie = request.cookies.get('user_data')?.value;
      if (userDataCookie) {
        const userData = JSON.parse(decodeURIComponent(userDataCookie));
        if (!userData.is_admin) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    } catch (e) {
      // If we can't parse user data but have a token, let them through
      // The dashboard layout will do another check
      console.error("Error parsing user data:", e);
    }
    
    // User is authenticated and either admin or we couldn't verify
    return NextResponse.next();
  }
  
  // Handle auth routes
  if (isAuthRoute) {
    // If already authenticated and trying to access auth routes
    if (isAuthenticated && pathname !== '/unauthorized') {
      // Check if user is admin before redirecting to dashboard
      try {
        const userDataCookie = request.cookies.get('user_data')?.value;
        if (userDataCookie) {
          const userData = JSON.parse(decodeURIComponent(userDataCookie));
          if (userData.is_admin) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
      
      // If not admin or couldn't verify, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Not authenticated, allow access to auth routes
    return NextResponse.next();
  }
  
  // For all other routes, just check authentication
  if (!isAuthenticated && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Apply middleware to specific routes only
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
  ],
};