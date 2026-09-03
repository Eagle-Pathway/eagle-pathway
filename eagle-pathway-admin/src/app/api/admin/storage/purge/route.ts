import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, getStrictAdminClient } from '@/lib/adminAuthGuard';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  const supabaseAdmin = getStrictAdminClient();

  try {
    const buckets = ['documents', 'tutor-documents'];
    let totalDeletedFiles = 0;

    for (const bucket of buckets) {
      async function listAllFiles(folder = ''): Promise<string[]> {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .list(folder, { limit: 1000 });

        if (error || !data) return [];

        let filePaths: string[] = [];
        for (const item of data) {
          const fullPath = folder ? `${folder}/${item.name}` : item.name;
          if (item.id === null) {
            const nested = await listAllFiles(fullPath);
            filePaths = filePaths.concat(nested);
          } else {
            filePaths.push(fullPath);
          }
        }
        return filePaths;
      }

      const allFiles = await listAllFiles();

      const chunkSize = 100;
      for (let i = 0; i < allFiles.length; i += chunkSize) {
        const chunk = allFiles.slice(i, i + chunkSize);
        const { error: removeError } = await supabaseAdmin.storage
          .from(bucket)
          .remove(chunk);

        if (!removeError) {
          totalDeletedFiles += chunk.length;
        }
      }
    }

    // Permanently delete all document rows from the database table
    const { count } = await supabaseAdmin
      .from('documents')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${count ?? 'all'} document records from the database and purged ${totalDeletedFiles} files from Supabase Storage.`,
      deletedFiles: totalDeletedFiles,
      deletedRows: count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete documents.' },
      { status: 500 }
    );
  }
}
