import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '~/lib/supabase/proxy';

/**
 * Define which URL paths are public and which are for authentication.
 * Any URL not in these lists will be considered a protected route.
 * This logic directly maps to your new `(public)` and `(authenticated)` folders.
 */
const publicPages = ['/'];
const authRoutes = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/confirm-sign-up',
  '/auth/reset-password',
  '/auth/update-password',
];

export async function proxy(request: NextRequest) {
  // Just added as per documentation
  const user = await updateSession(request);

  const authenticated = !!user;

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = authRoutes.some(
    (route) => pathname.includes(route) || pathname.startsWith(route)
  );
  const isPublicPage = publicPages.includes(pathname.replace(`/`, '') || '/');

  const authHome = new URL(`/`, request.url);
  const signInUrl = new URL(`/auth/sign-in`, request.url);

  if (authenticated) {
    if (isAuthRoute) {
      return NextResponse.redirect(authHome);
    }
  } else {
    if (!isPublicPage && !isAuthRoute) {
      return NextResponse.redirect(signInUrl);
    }
  }

  // Allow access to all other routes - no fallback redirect needed
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
