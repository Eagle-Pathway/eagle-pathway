/**
 * Strict validation and domain whitelisting for user-submitted cloud document links.
 * Protects against phishing, malicious downloads, and protocol exploits.
 */

export type CloudStorageProvider = 'google_drive' | 'onedrive' | 'dropbox' | 'icloud' | 'unknown';

export interface CloudUrlValidationResult {
  isValid: boolean;
  provider: CloudStorageProvider;
  error?: string;
  sanitizedUrl?: string;
}

const ALLOWED_EXACT_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
  '1drv.ms',
  'onedrive.live.com',
  'dropbox.com',
  'www.dropbox.com',
  'dl.dropboxusercontent.com',
  'icloud.com',
  'www.icloud.com',
]);

export function getCloudStorageProvider(hostname: string): CloudStorageProvider {
  const host = hostname.toLowerCase();
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    return 'google_drive';
  }
  if (host === '1drv.ms' || host === 'onedrive.live.com' || host === 'sharepoint.com' || host.endsWith('.sharepoint.com')) {
    return 'onedrive';
  }
  if (host === 'dropbox.com' || host === 'www.dropbox.com' || host === 'dl.dropboxusercontent.com') {
    return 'dropbox';
  }
  if (host === 'icloud.com' || host === 'www.icloud.com') {
    return 'icloud';
  }
  return 'unknown';
}

/**
 * Validates that a user-submitted cloud document link belongs to a verified, trusted cloud storage provider
 * and uses secure HTTPS protocol.
 */
export function validateCloudDocumentUrl(rawUrl: string | null | undefined): CloudUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      provider: 'unknown',
      error: 'Document link cannot be empty.',
    };
  }

  const trimmed = rawUrl.trim();

  // 1. Enforce HTTPS strictly - reject unencrypted HTTP and malicious protocols (javascript:, data:, file:, etc.)
  if (!trimmed.toLowerCase().startsWith('https://')) {
    return {
      isValid: false,
      provider: 'unknown',
      error: 'For your security, links must start with https://',
    };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'https:') {
      return {
        isValid: false,
        provider: 'unknown',
        error: 'Only secure https:// links are permitted.',
      };
    }

    const host = parsed.hostname.toLowerCase();
    const provider = getCloudStorageProvider(host);

    // 2. Validate against whitelisted domains
    const isAllowed = 
      ALLOWED_EXACT_HOSTS.has(host) || 
      host.endsWith('.sharepoint.com') || 
      host === 'sharepoint.com';

    if (!isAllowed || provider === 'unknown') {
      return {
        isValid: false,
        provider: 'unknown',
        error: 'Only links from Google Drive, Microsoft OneDrive, Dropbox, or iCloud are allowed.',
      };
    }

    return {
      isValid: true,
      provider,
      sanitizedUrl: parsed.toString(),
    };
  } catch {
    return {
      isValid: false,
      provider: 'unknown',
      error: 'Please enter a valid, complete URL (e.g., https://drive.google.com/...).',
    };
  }
}
