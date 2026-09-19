import { describe, it, expect } from 'vitest';
import { validateCloudDocumentUrl, getCloudStorageProvider } from '../src/utils/documentValidation';

describe('validateCloudDocumentUrl', () => {
  it('accepts valid Google Drive URLs', () => {
    const urls = [
      'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing',
      'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
      'https://docs.google.com/document/d/1X2Y3Z4A5B6C7D8E9F/edit',
    ];

    urls.forEach(url => {
      const result = validateCloudDocumentUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('google_drive');
      expect(result.error).toBeUndefined();
    });
  });

  it('accepts valid Microsoft OneDrive and SharePoint URLs', () => {
    const urls = [
      'https://1drv.ms/b/s!Am1234567890',
      'https://onedrive.live.com/?authkey=%21&id=123&cid=456',
      'https://myuniversity.sharepoint.com/:b:/s/students/abcdef123456',
    ];

    urls.forEach(url => {
      const result = validateCloudDocumentUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('onedrive');
    });
  });

  it('accepts valid Dropbox URLs', () => {
    const urls = [
      'https://www.dropbox.com/s/sample123/transcript.pdf?dl=0',
      'https://dropbox.com/scl/fi/abc123xyz/cv.pdf?rlkey=xyz',
      'https://dl.dropboxusercontent.com/s/sample123/transcript.pdf',
    ];

    urls.forEach(url => {
      const result = validateCloudDocumentUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('dropbox');
    });
  });

  it('accepts valid Apple iCloud URLs', () => {
    const urls = [
      'https://www.icloud.com/iclouddrive/0abc123xyz#document',
      'https://icloud.com/shared/0123456789',
    ];

    urls.forEach(url => {
      const result = validateCloudDocumentUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('icloud');
    });
  });

  it('rejects insecure unencrypted HTTP links', () => {
    const result = validateCloudDocumentUrl('http://drive.google.com/file/d/123/view');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('https://');
  });

  it('rejects protocol injection and script exploits', () => {
    const exploits = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'ftp://drive.google.com/test',
    ];

    exploits.forEach(payload => {
      const result = validateCloudDocumentUrl(payload);
      expect(result.isValid).toBe(false);
    });
  });

  it('rejects subdomain spoofing and phishing domains', () => {
    const phishingUrls = [
      'https://drive.google.com.malicious-site.com/login',
      'https://evildrive.google.com/steal',
      'https://onedrive.live.com.phishing.io/docs',
      'https://fake-dropbox.com/download',
      'https://untrusted-cloud-storage.org/file.pdf',
    ];

    phishingUrls.forEach(url => {
      const result = validateCloudDocumentUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  it('handles empty, null, or malformed inputs safely', () => {
    expect(validateCloudDocumentUrl('').isValid).toBe(false);
    expect(validateCloudDocumentUrl('   ').isValid).toBe(false);
    expect(validateCloudDocumentUrl(null).isValid).toBe(false);
    expect(validateCloudDocumentUrl(undefined).isValid).toBe(false);
    expect(validateCloudDocumentUrl('not a url').isValid).toBe(false);
  });
});
