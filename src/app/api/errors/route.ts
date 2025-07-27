import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/errors - Critical missing API: /api/errors
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }



    // Parse request body if needed
    const body = await request.json();
    
    // Parse query parameters
    

    // Implementation logic
        // Error logging logic
    const {
      message,
      stack,
      url,
      lineNumber,
      columnNumber,
      userAgent,
      timestamp,
      severity = 'error'
    } = body;

    const errorLog = await prisma.errorLog.create({
      data: {
        message: message || 'Unknown error',
        stack: stack || '',
        url: url || '',
        lineNumber: lineNumber || 0,
        columnNumber: columnNumber || 0,
        userAgent: userAgent || '',
        userId: session.user.id,
        severity,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      }
    });

    const result = { errorId: errorLog.id };

    return NextResponse.json({ 
      success: true,
      data: result 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}