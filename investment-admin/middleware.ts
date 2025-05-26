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

// *** IMPORTANT: Set your admin user IDs here ***
// These are the user IDs that should be treated as admins
const ADMIN_USER_IDS = [1]; // User ID 1 is admin - update with your actual admin IDs

// Debug logging helper
function debugLog(message: string, data?: any) {
  console.log(`[Middleware] ${message}`, data || '');
}

// Function to check if current path is a public route
function isPublicPath(path: string): boolean {
  return publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  debugLog(`Processing request for path: ${pathname}`);
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like images, css, etc.
  ) {
    debugLog('Skipping middleware for static/API path');
    return NextResponse.next();
  }
  
  // Allow access to public routes without authentication
  if (isPublicPath(pathname)) {
    debugLog('Public path detected, proceeding without auth check');
    return NextResponse.next();
  }
  
  // Get auth token from cookies or authorization header
  const tokenFromCookie = request.cookies.get('auth_token')?.value;
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  // Use cookie token or header token
  const token = tokenFromCookie || tokenFromHeader;
  
  debugLog('Token found:', token ? 'Yes' : 'No');
  
  // If no token is found, redirect to login
  if (!token) {
    debugLog('No token found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Decode the JWT token to get user information
    interface JwtPayload {
      user_id?: number;
      exp?: number;
      iat?: number;
      [key: string]: any;
    }
    
    const decoded = jwtDecode<JwtPayload>(token);
    debugLog('Token decoded', decoded);
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      debugLog('Token expired, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      
      // Clear expired cookies in the response
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      response.cookies.delete('user_info');
      
      return response;
    }
    
    // DIRECT APPROACH: Check if the user_id is in our admin list
    const userId = decoded.user_id;
    const isAdmin = userId !== undefined && ADMIN_USER_IDS.includes(userId);
    
    debugLog('User ID:', userId);
    debugLog('Is admin based on ID check:', isAdmin);
    
    // Handle role-based access control
    if (pathname.startsWith('/admin')) {
      // Admin-only routes
      if (!isAdmin) {
        debugLog('Non-admin trying to access admin route, redirecting to user dashboard');
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
      debugLog('Admin accessing admin route - allowed');
    } else if (pathname.startsWith('/user')) {
      // User-only routes
      if (isAdmin) {
        debugLog('Admin trying to access user route, redirecting to admin dashboard');
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      debugLog('Regular user accessing user route - allowed');
    }
    
    // Allow the request to proceed
    return NextResponse.next();
    
  } catch (error) {
    debugLog('Error processing authentication:', error);
    
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
    '/((?!_next|api|static|_vercel|.*\\..*).*)',
  ],
};