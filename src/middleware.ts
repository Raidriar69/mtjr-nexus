import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin routes: require role === 'admin'
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'unauthorized');
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
    }

    // Protected user routes: require any authenticated session
    if (pathname.startsWith('/orders')) {
      if (!token) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Let the middleware function above handle all authorization decisions
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/orders/:path*'],
};
