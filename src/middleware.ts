import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'di-session';
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'devrel-insights-secret-change-me'
);

const PUBLIC_PATHS = [
  '/login', 
  '/api/auth',
  '/api/events',    // Mobile app access
  '/api/insights',  // Mobile app access
  '/api/advocates', // Mobile app access
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    // Invalid/expired token
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next|favicon.ico|api/auth).*)',
  ],
};
