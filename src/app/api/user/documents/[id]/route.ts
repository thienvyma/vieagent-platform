import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/user/documents/[id] - Xóa document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // Check if document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    // Delete the document
    await prisma.document.delete({
      where: { id: documentId },
    });

    // TODO: Delete physical file if needed
    // if (document.filePath) {
    //   await deleteFile(document.filePath);
    // }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
