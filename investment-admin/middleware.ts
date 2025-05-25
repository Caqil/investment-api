// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Add the X-Device-ID header to the request
  requestHeaders.set('X-Device-ID', 'web_admin_dashboard');
  
  // Return the response with the modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure the middleware to run only for API requests
export const config = {
  matcher: '/api/:path*',
};