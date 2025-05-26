// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/faq',
];

// Function to check if current path is a public route
function isPublicPath(path: string): boolean {
  return publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like images, css, etc.
  ) {
    return NextResponse.next();
  }
  
  // Allow access to public routes without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Get auth token from cookies or authorization header
  // First check for the token in cookies
  const tokenFromCookie = request.cookies.get('auth_token')?.value;
  // Then check the authorization header (for API calls)
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  // Use cookie token or header token
  const token = tokenFromCookie || tokenFromHeader;
  
  // If no token is found, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Decode the JWT token to get user information
    interface JwtPayload {
      user_id?: number;
      is_admin?: boolean;
      exp?: number;
      [key: string]: any;
    }
    
    const decoded = jwtDecode<JwtPayload>(token);
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('Token expired, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      
      // Clear expired cookies in the response
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      response.cookies.delete('user_info');
      
      return response;
    }
    
    const isAdmin = !!decoded.is_admin;
    
    // Handle role-based access control
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      // Admin-only routes
      if (!isAdmin) {
        console.log('Non-admin trying to access admin route, redirecting to user dashboard');
        // Redirect non-admin users to user dashboard
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    } else if (pathname.startsWith('/user')) {
      // User-only routes
      if (isAdmin) {
        console.log('Admin trying to access user route, redirecting to admin dashboard');
        // Redirect admin users to admin dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // Allow the request to proceed
    return NextResponse.next();
    
  } catch (error) {
    console.error('Error processing authentication:', error);
    
    // If token is invalid, clear cookies and redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    
    // Clear authentication cookies
    response.cookies.delete('auth_token');
    response.cookies.delete('user_info');
    
    return response;
  }
}

// Configure the middleware to run on all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /_next (Next.js internals)
     * 2. /api (API routes)
     * 3. /static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. All files in the public folder
     */
    '/((?!_next|api|static|_vercel|.*\\..*).*)',
  ],
};