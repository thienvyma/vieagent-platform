/**
 * 🐛 DEBUG API - Knowledge Data Check
 * Temporary endpoint to debug knowledge data issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all documents for this user
    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        filename: true,
        type: true,
        status: true,
        size: true,
        createdAt: true,
        userId: true,
      },
      take: 10,
    });

    // Get all data imports for this user
    const dataImports = await prisma.dataImport.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        fileName: true,
        status: true,
        fileSize: true,
        createdAt: true,
        userId: true,
      },
      take: 10,
    });

    // Get total counts
    const documentCount = await prisma.document.count({
      where: { userId: session.user.id },
    });

    const dataImportCount = await prisma.dataImport.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      debug: {
        userId: session.user.id,
        userEmail: session.user.email,
        documentCount,
        dataImportCount,
        totalItems: documentCount + dataImportCount,
        documents: documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          type: doc.type,
          status: doc.status,
          size: doc.size,
          createdAt: doc.createdAt,
          belongsToUser: doc.userId === session.user.id,
        })),
        dataImports: dataImports.map(imp => ({
          id: imp.id,
          name: imp.name,
          fileName: imp.fileName,
          status: imp.status,
          fileSize: imp.fileSize,
          createdAt: imp.createdAt,
          belongsToUser: imp.userId === session.user.id,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Debug API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 