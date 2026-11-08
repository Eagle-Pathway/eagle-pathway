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

  // Suspended account
  if (msg.includes('banned') || msg.includes('user is banned') || msg.includes('account suspended') || msg.includes('is_suspended')) {
    return { userMessage: 'Your account has been suspended by an administrator. Please contact support.', shouldLogout: true };
  }

  // Auth & Session errors
  if (msg.includes('invalid login credentials') || msg.includes('invalid password') || msg.includes('invalid credentials')) {
    return { userMessage: 'Incorrect email or password. Please verify your credentials and try again.' };
  }

  if (msg.includes('jwt expired') || msg.includes('token expired') || msg.includes('session_not_found')) {
    return { userMessage: 'Your session has expired. Please sign in again.', shouldLogout: true };
  }

  // Phone & Email unique constraint errors
  if (msg.includes('duplicate key') && msg.includes('phone')) {
    return { userMessage: 'This phone number is already registered to another account.' };
  }

  if (msg.includes('duplicate key') && msg.includes('email')) {
    return { userMessage: 'This email is already registered. Please sign in instead.' };
  }

  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return { userMessage: 'An account or record with this information already exists.' };
  }

  // Network & Timeout
  if (msg.includes('network request failed') || msg.includes('fetch') || msg.includes('enotfound') || msg.includes('econnrefused')) {
    return { userMessage: 'Unable to reach the server. Please check your internet connection.' };
  }

  if (msg.includes('timeout') || msg.includes('timed out')) {
    return { userMessage: 'Request timed out. Please check your internet connection and try again.' };
  }

  // Technical database errors
  if (
    msg.includes('schema cache') ||
    msg.includes('column') ||
    msg.includes('constraint') ||
    msg.includes('syntax') ||
    msg.includes('pgrst') ||
    msg.includes('typeerror') ||
    msg.includes('authapierror')
  ) {
    return { userMessage: 'Something went wrong while saving your details. Please try again.' };
  }

  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return { userMessage: 'You do not have permission to update this account.' };
  }

  return { userMessage: message && message.length < 120 ? message : 'Failed to save changes. Please try again.' };
}

export function getErrorMessage(error: unknown, defaultMessage?: string): string {
  const parsed = parseError(error);
  if (defaultMessage && (parsed.userMessage === 'Failed to save changes. Please try again.' || !parsed.userMessage)) {
    return defaultMessage;
  }
  return parsed.userMessage || defaultMessage || 'An unexpected error occurred. Please try again.';
}

