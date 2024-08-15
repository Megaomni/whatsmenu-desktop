import { NextRequest } from 'next/server'

import { withAuth } from 'next-auth/middleware'

// This function can be marked `async` if using `await` inside
export default withAuth(function middleware(request: NextRequest) {
  // return NextResponse.redirect(new URL('/home', request.url))
})

export const config = { matcher: ['/dashboard/:path*', '/adm/:path*'] }
