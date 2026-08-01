import { Alert } from 'react-native';

export interface AppError {
  userMessage: string;
  shouldLogout?: boolean;
}

export function parseError(error: unknown): AppError {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as any).message)
      : JSON.stringify(error);

  const msg = (message || '').toLowerCase();

  // Auth errors
  if (msg.includes('invalid login credentials') || msg.includes('invalid password') || msg.includes('invalid credentials'))
    return { userMessage: 'Incorrect email or password. Please try again.' };

  if (msg.includes('email not confirmed'))
    return { userMessage: 'Please verify your email address first.' };

  if (msg.includes('user already registered') || msg.includes('already been registered'))
    return { userMessage: 'An account with this email already exists. Try signing in.' };

  if (msg.includes('duplicate key') && msg.includes('phone'))
    return { userMessage: 'This phone number is already linked to another account.' };

  if (msg.includes('duplicate key') && msg.includes('email'))
    return { userMessage: 'This email is already registered. Try signing in.' };

  if (msg.includes('duplicate key'))
    return { userMessage: 'This account already exists. Please sign in instead.' };

  if (msg.includes('jwt expired') || msg.includes('token expired'))
    return { userMessage: 'Your session has expired. Please sign in again.', shouldLogout: true };

  if (msg.includes('invalid otp') || msg.includes('token has expired') || msg.includes('otp') || msg.includes('verification code'))
    return { userMessage: 'Invalid or expired code. Please request a new one.' };

  // Network errors
  if (msg.includes('network request failed') || msg.includes('fetch') || msg.includes('enotfound') || msg.includes('econnrefused'))
    return { userMessage: 'No internet connection. Please check your network and try again.' };

  if (msg.includes('timeout') || msg.includes('timed out'))
    return { userMessage: 'Request timed out. Please try again.' };

  // Database / server / internal technical errors
  if (
    msg.includes('constraint') ||
    msg.includes('violates') ||
    msg.includes('syntax') ||
    msg.includes('relation') ||
    msg.includes('pgrst') ||
    msg.includes('uuid') ||
    msg.includes('undefined') ||
    msg.includes('null') ||
    msg.includes('typeerror')
  )
    return { userMessage: 'Something went wrong. Please try again.' };

  if (msg.includes('500') || msg.includes('503') || msg.includes('server'))
    return { userMessage: 'Server error. Please try again in a moment.' };

  // Permission errors
  if (msg.includes('row-level security') || msg.includes('permission denied'))
    return { userMessage: 'You do not have permission to do this.' };

  // Rate limiting
  if (msg.includes('rate limit') || msg.includes('too many requests'))
    return { userMessage: 'Too many attempts. Please wait a moment and try again.' };

  // Fallback — clean message if short and safe, else generic
  if (message && message.length < 100 && !/[{}\[\]<>]/.test(message) && !msg.includes('error:')) {
    return { userMessage: message };
  }

  return { userMessage: 'Something went wrong. Please try again.' };
}

// Convenience function for Alert
export function showError(error: unknown, title = 'Something went wrong') {
  const { userMessage } = parseError(error);
  Alert.alert(title, userMessage);
}

// For inline error text (no Alert)
export function getErrorMessage(error: unknown): string {
  return parseError(error).userMessage;
}
