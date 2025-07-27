import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { RateLimiter } from './lib/rate-limiter';

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Apply rate limiting to API routes
    if (pathname.startsWith('/api/')) {
      const rateLimitResult = await RateLimiter.checkRateLimit(req);

      if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
      }
    }

    // Only protect dashboard and admin routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Admin routes
      if (pathname.startsWith('/admin')) {
        if (!['ADMIN', 'MANAGER', 'OWNER'].includes(token.role as string)) {
          return NextResponse.redirect(new URL('/login?error=unauthorized', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        const publicRoutes = ['/', '/login', '/pricing', '/blog', '/contact'];
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Allow auth and static routes
        if (
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname === '/favicon.ico'
        ) {
          return true;
        }

        // Protected routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
