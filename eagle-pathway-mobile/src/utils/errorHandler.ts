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

  // Banned / Suspended account check (highest priority)
  if (msg.includes('banned') || msg.includes('user is banned') || msg.includes('account suspended') || msg.includes('is_suspended'))
    return { userMessage: 'Your account has been suspended by an administrator. Please contact support if you believe this is an error.', shouldLogout: true };

  // Auth errors
  if (msg.includes('invalid login credentials') || msg.includes('invalid password') || msg.includes('invalid credentials'))
    return { userMessage: 'Incorrect email or password. Please check your credentials and try again.' };

  if (msg.includes('password should be at least') || msg.includes('password is too short'))
    return { userMessage: 'Password must be at least 6 characters long.' };

  if (msg.includes('provide an email or phone number') || msg.includes('email or phone number required'))
    return { userMessage: 'Please provide both your email address and phone number.' };

  if (msg.includes('email not confirmed'))
    return { userMessage: 'Please verify your email address before signing in.' };

  if (msg.includes('user already registered') || msg.includes('already been registered'))
    return { userMessage: 'An account with this email already exists. Please sign in instead.' };

  if (msg.includes('duplicate key') && msg.includes('phone'))
    return { userMessage: 'This phone number is already linked to another account.' };

  if (msg.includes('duplicate key') && msg.includes('email'))
    return { userMessage: 'This email is already registered. Please sign in instead.' };

  if (msg.includes('duplicate key') || msg.includes('unique constraint'))
    return { userMessage: 'An account or record with this information already exists.' };

  if (msg.includes('jwt expired') || msg.includes('token expired') || msg.includes('session_not_found'))
    return { userMessage: 'Your session has expired. Please sign in again.', shouldLogout: true };

  if (msg.includes('invalid otp') || msg.includes('token has expired') || msg.includes('otp') || msg.includes('verification code'))
    return { userMessage: 'Invalid or expired 6-digit code. Please check your inbox or request a new code.' };

  // Storage / Upload errors
  if (msg.includes('object not found') || msg.includes('bucket not found') || msg.includes('not_found'))
    return { userMessage: 'The requested file could not be found or previewed.' };

  if (msg.includes('unauthorized') || msg.includes('access denied'))
    return { userMessage: 'You do not have permission to access or upload this file.' };

  // Booking & Payment errors
  if (msg.includes('uq_active_booking_slot') || msg.includes('already booked'))
    return { userMessage: 'That time slot is already booked with this tutor. Please choose another time.' };

  if (msg.includes('duplicate txn') || msg.includes('transaction_id'))
    return { userMessage: 'This transaction reference has already been submitted.' };

  // Network & Connectivity
  if (msg.includes('network request failed') || msg.includes('fetch') || msg.includes('enotfound') || msg.includes('econnrefused'))
    return { userMessage: 'No internet connection. Please check your network and try again.' };

  if (msg.includes('timeout') || msg.includes('timed out'))
    return { userMessage: 'Connection timed out. Please check your internet connection and try again.' };

  // Database / Postgres / Schema / Technical errors
  if (
    msg.includes('schema cache') ||
    msg.includes('column') ||
    msg.includes('could not find') ||
    msg.includes('constraint') ||
    msg.includes('violates') ||
    msg.includes('syntax') ||
    msg.includes('relation') ||
    msg.includes('pgrst') ||
    msg.includes('uuid') ||
    msg.includes('undefined') ||
    msg.includes('null') ||
    msg.includes('typeerror') ||
    msg.includes('authapierror')
  )
    return { userMessage: 'Something went wrong while saving your details. Please try again in a moment.' };

  if (msg.includes('500') || msg.includes('503') || msg.includes('server'))
    return { userMessage: 'Server busy. Please try again in a moment.' };

  // Permission errors
  if (msg.includes('row-level security') || msg.includes('permission denied'))
    return { userMessage: 'You do not have permission to complete this action.' };

  // Rate limiting
  if (msg.includes('rate limit') || msg.includes('too many requests'))
    return { userMessage: 'Too many attempts in a short time. Please wait a minute and try again.' };

  // Fallback — clean message ONLY if strictly human-readable text
  if (
    message &&
    message.length < 90 &&
    !/[{}\[\]<>]/.test(message) &&
    !msg.includes('error:') &&
    !msg.includes('authapierror') &&
    !msg.includes('column') &&
    !msg.includes('schema') &&
    !msg.includes('pgrst') &&
    !msg.includes('sql')
  ) {
    return { userMessage: message };
  }

  return { userMessage: 'Something went wrong. Please try again in a moment.' };
}

// Convenience function for Alert
export function showError(error: unknown, title = 'Notice') {
  const { userMessage } = parseError(error);
  Alert.alert(title, userMessage);
}

// For inline error text (no Alert)
export function getErrorMessage(error: unknown): string {
  return parseError(error).userMessage;
}

