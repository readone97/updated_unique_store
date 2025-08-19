import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple token verification without importing server modules
type Decoded = { userId: string; role?: 'admin' | 'user'; exp: number }

function decodeToken(token: string): Decoded | null {
  try {
    // Basic JWT structure check
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    // Decode payload (basic check)
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.userId || payload.exp <= Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup']
  
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value
  const decoded = token ? decodeToken(token) : null

  if (!decoded) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin-only routes
  const adminRoutes = ['/analytics', '/settings']
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)',
  ],
}
