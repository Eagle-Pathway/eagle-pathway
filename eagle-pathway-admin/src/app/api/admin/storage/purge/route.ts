import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const supabaseAdmin = getStrictAdminClient();

  try {
    const bucket = 'documents';
    
    // 1. List all files recursively in the 'documents' bucket
    async function listAllFiles(folder = ''): Promise<string[]> {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(folder, { limit: 1000 });

      if (error || !data) return [];

      let filePaths: string[] = [];
      for (const item of data) {
        const fullPath = folder ? `${folder}/${item.name}` : item.name;
        if (item.id === null) {
          // It's a folder, recurse
          const nested = await listAllFiles(fullPath);
          filePaths = filePaths.concat(nested);
        } else {
          filePaths.push(fullPath);
        }
      }
      return filePaths;
    }

    const allFiles = await listAllFiles();

    if (allFiles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Storage is already clean. 0 files found in bucket.',
        deletedCount: 0 
      });
    }

    // 2. Delete all files in chunks of 100
    const chunkSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < allFiles.length; i += chunkSize) {
      const chunk = allFiles.slice(i, i + chunkSize);
      const { error: removeError } = await supabaseAdmin.storage
        .from(bucket)
        .remove(chunk);

      if (!removeError) {
        deletedCount += chunk.length;
      }
    }

    // 3. Mark existing document records as cloud/migrated
    await supabaseAdmin
      .from('documents')
      .update({ file_path: 'cloud_link', file_size: 0 })
      .not('file_path', 'eq', 'cloud_link');

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${deletedCount} files from Supabase Storage. Storage usage is now 0 MB.`,
      deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to purge storage files.' },
      { status: 500 }
    );
  }
}
