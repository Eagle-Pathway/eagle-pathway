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

    // Extract access_token and refresh_token from redirect hash/query parameters
    const url = res.url;
    const params = new URLSearchParams(
      url.includes('#') ? url.split('#')[1] : url.split('?')[1] || ''
    );

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      throw new Error('Could not retrieve session tokens from Google authentication response.');
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      throw sessionError;
    }

    return {
      session: sessionData.session,
      user: sessionData.user,
    };
  },
};
