import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { readPaymentProof } from '@/lib/upload';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileName } = await params;
  const buffer = await readPaymentProof(fileName);
  if (!buffer) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const ext = fileName.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
