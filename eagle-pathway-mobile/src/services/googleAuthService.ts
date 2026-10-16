import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Global mutex and cache to eliminate PKCE authorization code double-exchange collisions
let inFlightExchange: Promise<{ session: any; user: any }> | null = null;
let lastExchangedCode: string | null = null;
let lastExchangedResult: { session: any; user: any } | null = null;

/**
 * Extracts OAuth authorization parameters from any URL (query string and/or hash fragment).
 */
export function extractAuthParams(url: string) {
  if (!url) {
    return { code: null, accessToken: null, refreshToken: null, error: null, errorDescription: null };
  }

  const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const hashPart = url.includes('#') ? url.split('#')[1] : '';
  const searchParams = new URLSearchParams(queryPart ? `${queryPart}&${hashPart}` : hashPart);

  return {
    code: searchParams.get('code'),
    accessToken: searchParams.get('access_token'),
    refreshToken: searchParams.get('refresh_token'),
    error: searchParams.get('error'),
    errorDescription: searchParams.get('error_description'),
  };
}

/**
 * Thread-safe single-flight PKCE authorization code exchange.
 * Prevents "invalid_grant: code has already been consumed" errors caused by concurrent callers.
 */
export async function safeExchangeCodeForSession(code: string): Promise<{ session: any; user: any }> {
  if (!code) {
    throw new Error('No authorization code provided.');
  }

  // 1. If this exact authorization code was already exchanged in the active lifecycle, return the cached result
  if (lastExchangedCode === code && lastExchangedResult?.session) {
    return lastExchangedResult;
  }

  // 2. If an exchange for this code is already in flight, reuse the running promise
  if (inFlightExchange) {
    return inFlightExchange;
  }

  // 3. If an active session already exists in Supabase, return it directly
  const { data: existing } = await supabase.auth.getSession();
  if (existing?.session) {
    const res = { session: existing.session, user: existing.session.user };
    lastExchangedCode = code;
    lastExchangedResult = res;
    return res;
  }

  // 4. Perform single-use PKCE exchange
  inFlightExchange = (async () => {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // If Supabase returned an error (e.g. code consumed concurrently by another listener),
        // verify whether a session was successfully established
        const { data: fallback } = await supabase.auth.getSession();
        if (fallback?.session) {
          const res = { session: fallback.session, user: fallback.session.user };
          lastExchangedCode = code;
          lastExchangedResult = res;
          return res;
        }
        throw error;
      }

      if (!data?.session) {
        throw new Error('No session returned from code exchange.');
      }

      const res = { session: data.session, user: data.user || data.session.user };
      lastExchangedCode = code;
      lastExchangedResult = res;
      return res;
    } catch (err) {
      // Re-verify session in case an onAuthStateChange handler completed it
      const { data: fallback } = await supabase.auth.getSession();
      if (fallback?.session) {
        const res = { session: fallback.session, user: fallback.session.user };
        lastExchangedCode = code;
        lastExchangedResult = res;
        return res;
      }
      throw err;
    } finally {
      inFlightExchange = null;
    }
  })();

  return inFlightExchange;
}

/**
 * Thread-safe session establishment from direct access and refresh tokens.
 */
export async function safeSetSessionFromTokens(
  accessToken: string,
  refreshToken: string
): Promise<{ session: any; user: any }> {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error && data?.session) {
      return { session: data.session, user: data.user || data.session.user };
    }
  } catch (e) {
    console.log('[GoogleAuth] Token set error:', e);
  }

  const { data: existing } = await supabase.auth.getSession();
  if (existing?.session) {
    return { session: existing.session, user: existing.session.user };
  }

  throw new Error('Failed to establish session from tokens.');
}

export const googleAuthService = {
  /**
   * Triggers native browser Google OAuth sign-in flow via Supabase Auth.
   * Handles Android Chrome Custom Tab dismissals and concurrent deep-link intents gracefully.
   */
  async signInWithGoogle(): Promise<{ session: any; user: any }> {
    // Generate clean callback URL aligned with Expo Router route app/(auth)/callback.tsx
    const redirectTo = Linking.createURL('callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      throw error || new Error('Failed to obtain Google OAuth authentication URL.');
    }

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    // 1. If WebBrowser returned a URL (typical on iOS and some Android devices)
    if (res.type === 'success' && res.url) {
      const params = extractAuthParams(res.url);

      if (params.error || params.errorDescription) {
        throw new Error(params.errorDescription || params.error || 'Google sign-in was not completed.');
      }

      if (params.code) {
        return await safeExchangeCodeForSession(params.code);
      }

      if (params.accessToken && params.refreshToken) {
        return await safeSetSessionFromTokens(params.accessToken, params.refreshToken);
      }
    }

    // 2. On Android, Chrome Custom Tabs are often dismissed when the OS opens the redirect deep-link intent.
    // Rather than treating 'dismiss' or 'cancel' as an instant failure, grant a 2.5-second grace window
    // to check if the session was established concurrently via the deep link.
    const pollStart = Date.now();
    while (Date.now() - pollStart < 2500) {
      const { data: activeSession } = await supabase.auth.getSession();
      if (activeSession?.session) {
        return {
          session: activeSession.session,
          user: activeSession.session.user,
        };
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // 3. Final check for active session before concluding cancellation
    const { data: fallbackSession } = await supabase.auth.getSession();
    if (fallbackSession?.session) {
      return {
        session: fallbackSession.session,
        user: fallbackSession.session.user,
      };
    }

    throw new Error('Google sign-in was cancelled or closed.');
  },
};

