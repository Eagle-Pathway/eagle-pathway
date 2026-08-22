import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Protected Dashboard Routes
  const isProtectedPath = 
    pathname === '/' ||
    pathname.startsWith('/overview') ||
    pathname.startsWith('/finance') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/scholarships') ||
    pathname.startsWith('/applications') ||
    pathname.startsWith('/tutors') ||
    pathname.startsWith('/tutor-jobs') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/resources') ||
    pathname.startsWith('/services') ||
    pathname.startsWith('/settings');

  // 1. If user is unauthenticated and attempting to access a protected route, redirect to /login at the edge
  if (isProtectedPath && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If user is already authenticated and hitting /login, redirect to /overview
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  return response;
}

export const middleware = proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
