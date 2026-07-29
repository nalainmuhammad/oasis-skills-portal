import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get("next-auth.session-token")?.value || 
                       req.cookies.get("__Secure-next-auth.session-token")?.value ||
                       req.cookies.get("authjs.session-token")?.value;

  const isAuthenticated = !!sessionToken;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
  
  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) from += req.nextUrl.search;
    return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(from)}`, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/learn/:path*', '/certificates/:path*', '/login', '/register']
};
