import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes - chỉ admin, manager, owner có thể truy cập
    if (pathname.startsWith('/admin')) {
      if (!token || !['ADMIN', 'MANAGER', 'OWNER'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
      }
      
      // Một số routes chỉ admin và owner
      const ownerOnlyRoutes = ['/admin/plans', '/admin/settings']
      if (ownerOnlyRoutes.some(route => pathname.startsWith(route))) {
        if (!['ADMIN', 'OWNER'].includes(token.role as string)) {
          return NextResponse.redirect(new URL('/admin?error=insufficient_permissions', req.url))
        }
      }

      // Owner only routes
      const ownerExclusiveRoutes = ['/admin/settings/system']
      if (ownerExclusiveRoutes.some(route => pathname.startsWith(route))) {
        if (token.role !== 'OWNER') {
          return NextResponse.redirect(new URL('/admin?error=owner_only', req.url))
        }
      }
    }

    // Dashboard routes - tất cả authenticated users
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes
        const publicRoutes = ['/', '/pricing', '/blog', '/contact', '/login']
        if (publicRoutes.includes(pathname)) {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
} 