const ALLOWED_ORIGINS = new Set([
  'https://admin.eaglespathway.com',
  'https://eaglespathway.com',
  'http://localhost:3000',
  'http://localhost:8081',
]);

/**
 * Returns restrictive CORS headers based on the incoming request Origin.
 * Allows official web domains and mobile/native app clients (which omit origin).
 */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') || '';
  
  // If the origin is in our allowed whitelist, echo it back.
  // Otherwise, default to our primary production domain or allow empty (mobile apps).
  let allowedOrigin = 'https://admin.eaglespathway.com';
  if (ALLOWED_ORIGINS.has(origin)) {
    allowedOrigin = origin;
  } else if (!origin) {
    allowedOrigin = '*';
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
