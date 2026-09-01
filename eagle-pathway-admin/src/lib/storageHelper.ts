import { supabase, getAuthHeaders } from '@/lib/supabase';

/**
 * Extracts the clean storage bucket path from a relative path or a full signed/public Supabase URL.
 */
export function extractStoragePath(rawPathOrUrl: string | null | undefined, bucket = 'documents'): string | null {
  if (!rawPathOrUrl) return null;

  // If it's a full URL containing /storage/v1/object/...
  if (rawPathOrUrl.includes('/storage/v1/object/')) {
    const afterObject = rawPathOrUrl.split('/storage/v1/object/')[1] || '';
    const withoutQuery = afterObject.split('?')[0]; // strip ?token=...
    
    // Pattern: (sign|public|authenticated)/<bucket>/<filepath>
    const regex = new RegExp(`(?:sign|public|authenticated)/${bucket}/(.+)`, 'i');
    const match = withoutQuery.match(regex);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }

    // Generic fallback for any bucket
    const genericMatch = withoutQuery.match(/(?:sign|public|authenticated)\/[^/]+\/(.+)/i);
    if (genericMatch && genericMatch[1]) {
      return decodeURIComponent(genericMatch[1]);
    }
  }

  // If it's already a relative path (does not start with http)
  if (!rawPathOrUrl.startsWith('http')) {
    // Strip leading bucket name if present (e.g. "documents/user_id/file.pdf")
    if (rawPathOrUrl.startsWith(`${bucket}/`)) {
      return rawPathOrUrl.substring(bucket.length + 1);
    }
    return rawPathOrUrl;
  }

  return null;
}

/**
 * Generates a fresh signed URL using the admin service-role signing endpoint.
 */
export async function getFreshSignedUrl(rawPathOrUrl: string | null | undefined, bucket = 'documents'): Promise<string> {
  if (!rawPathOrUrl) return '';

  const path = extractStoragePath(rawPathOrUrl, bucket);
  if (!path) return rawPathOrUrl;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/documents/sign', {
      method: 'POST',
      headers,
      body: JSON.stringify({ path, bucket }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.signedUrl) return json.signedUrl;
    }
  } catch (e) {
    console.warn('[StorageHelper] Server sign fallback:', e);
  }

  // Fallback: direct client createSignedUrl
  try {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (data?.signedUrl) return data.signedUrl;
  } catch {
    // fallback
  }

  return rawPathOrUrl;
}
