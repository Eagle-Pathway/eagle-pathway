import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface AdminAuthResult {
  authorized: boolean;
  userId: string | null;
  errorResponse?: NextResponse;
}

/**
 * Validates incoming HTTP requests to Next.js API routes.
 * Ensures caller possesses a valid Supabase JWT token AND holds an active 'admin' role.
 */
export async function verifyAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
  if (!supabaseUrl) {
    return {
      authorized: false,
      userId: null,
      errorResponse: NextResponse.json(
        { error: 'Server Configuration Error: NEXT_PUBLIC_SUPABASE_URL is missing.' },
        { status: 500 }
      ),
    };
  }

  if (!serviceRoleKey) {
    return {
      authorized: false,
      userId: null,
      errorResponse: NextResponse.json(
        { error: 'Server Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing on server.' },
        { status: 500 }
      ),
    };
  }

  // 1. Extract Bearer Token from Authorization Header or Cookie
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    // Check cookies as fallback for Next.js browser requests
    const cookieToken = req.cookies.get('sb-access-token')?.value || 
                        req.cookies.get('supabase-auth-token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    return {
      authorized: false,
      userId: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Missing authentication token. Please log in.' },
        { status: 401 }
      ),
    };
  }

  // 2. Instantiate Service Role Client & Verify JWT Token
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authErr } = await adminClient.auth.getUser(token);

  if (authErr || !authData?.user) {
    return {
      authorized: false,
      userId: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid or expired session token.' },
        { status: 401 }
      ),
    };
  }

  const userId = authData.user.id;

  // 3. Verify Admin Role in Database (Check 'users' table role & user_roles table)
  const [{ data: userRow }] = await Promise.all([
    adminClient.from('users').select('role, active_role').eq('id', userId).maybeSingle(),
  ]);

  const hasAdminRole = 
    userRow?.role === 'admin' || 
    userRow?.active_role === 'admin' || 
    authData.user.app_metadata?.role === 'admin';

  if (!hasAdminRole) {
    return {
      authorized: false,
      userId,
      errorResponse: NextResponse.json(
        { error: 'Forbidden: You do not have administrative permissions to perform this action.' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId,
  };
}

/**
 * Returns an authenticated Supabase Admin client using SUPABASE_SERVICE_ROLE_KEY.
 * Throws an explicit error if credentials are missing.
 */
export function getStrictAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
