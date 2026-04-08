import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Affiliate referral link handler
 * domain.com/@alice  →  domain.com/play?ref=alice  (301)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const match = pathname.match(/^\/@([a-zA-Z0-9][a-zA-Z0-9_-]{2,29})$/)
  if (match) {
    const username = match[1].toLowerCase()
    const url = request.nextUrl.clone()
    url.pathname = '/play'
    url.searchParams.set('ref', username)
    return NextResponse.redirect(url, { status: 301 })
  }
}

export const config = {
  // Run on all non-asset paths
  matcher: ['/((?!_next/static|_next/image|favicon\.ico|api/).*)'],
}
