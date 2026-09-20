import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export const googleAuthService = {
  /**
   * Triggers native browser Google OAuth sign-in flow via Supabase Auth.
   */
  async signInWithGoogle(): Promise<{ session: any; user: any }> {
    const redirectTo = Linking.createURL('/(auth)/callback');

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

    if (res.type !== 'success' || !res.url) {
      throw new Error('Google sign-in was cancelled or closed.');
    }

    // Extract parameters from both query string and hash fragment
    const url = res.url;
    const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
    const hashPart = url.includes('#') ? url.split('#')[1] : '';
    const searchParams = new URLSearchParams(queryPart ? `${queryPart}&${hashPart}` : hashPart);

    const code = searchParams.get('code');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (code) {
      try {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError && exchangeData?.session) {
          return {
            session: exchangeData.session,
            user: exchangeData.user,
          };
        }
      } catch (codeErr) {
        console.log('[GoogleAuth] Code exchange error (may be handled by callback):', codeErr);
      }

      // Check if session was established concurrently
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session) {
        return {
          session: currentSession.session,
          user: currentSession.session.user,
        };
      }
    }

    if (accessToken && refreshToken) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!sessionError && sessionData?.session) {
          return {
            session: sessionData.session,
            user: sessionData.user,
          };
        }
      } catch (tokenErr) {
        console.log('[GoogleAuth] Token set error:', tokenErr);
      }

      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session) {
        return {
          session: currentSession.session,
          user: currentSession.session.user,
        };
      }
    }

    // Final check for active session before throwing
    const { data: fallbackSession } = await supabase.auth.getSession();
    if (fallbackSession?.session) {
      return {
        session: fallbackSession.session,
        user: fallbackSession.session.user,
      };
    }

    throw new Error('Could not retrieve authentication session from Google response.');
  },
};
