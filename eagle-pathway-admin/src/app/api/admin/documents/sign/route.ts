import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.authorized) {
      return authResult.errorResponse!;
    }

    const { path, bucket = 'documents', urls } = await req.json();
    const supabaseAdmin = getStrictAdminClient();

    // 1. Batch signing multiple paths / URLs
    if (Array.isArray(urls) && urls.length > 0) {
      const signedUrls = await Promise.all(
        urls.map(async (item: { id?: string; path?: string; url?: string; bucket?: string }) => {
          const itemBucket = item.bucket || bucket;
          const raw = item.path || item.url || '';
          const cleanPath = extractPath(raw, itemBucket);
          if (!cleanPath) return { id: item.id, signedUrl: raw };

          try {
            const { data, error } = await supabaseAdmin.storage
              .from(itemBucket)
              .createSignedUrl(cleanPath, 3600); // 1 hour TTL
            return {
              id: item.id,
              signedUrl: (!error && data?.signedUrl) ? data.signedUrl : raw,
            };
          } catch {
            return { id: item.id, signedUrl: raw };
          }
        })
      );

      return NextResponse.json({ results: signedUrls });
    }

    // 2. Single path signing
    const cleanPath = extractPath(path, bucket);
    if (!cleanPath) {
      return NextResponse.json({ signedUrl: path || '' });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 3600);

    if (error || !data?.signedUrl) {
      console.warn('[AdminDocSign] Sign error:', error?.message);
      return NextResponse.json({ error: error?.message || 'Failed to sign URL', signedUrl: path }, { status: 200 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err: any) {
    console.error('Error in /api/admin/documents/sign:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

function extractPath(raw: string | null | undefined, bucket: string): string | null {
  if (!raw) return null;

  if (raw.includes('/storage/v1/object/')) {
    const afterObject = raw.split('/storage/v1/object/')[1] || '';
    const withoutQuery = afterObject.split('?')[0];
    const regex = new RegExp(`(?:sign|public|authenticated)/${bucket}/(.+)`, 'i');
    const match = withoutQuery.match(regex);
    if (match && match[1]) return decodeURIComponent(match[1]);

    const genericMatch = withoutQuery.match(/(?:sign|public|authenticated)\/[^/]+\/(.+)/i);
    if (genericMatch && genericMatch[1]) return decodeURIComponent(genericMatch[1]);
  }

  if (!raw.startsWith('http')) {
    if (raw.startsWith(`${bucket}/`)) {
      return raw.substring(bucket.length + 1);
    }
    return raw;
  }

  return null;
}
