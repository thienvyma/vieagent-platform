import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simulate Gmail API test
    const testResults = {
      status: 'success',
      message: 'Gmail API test endpoint working',
      timestamp: new Date().toISOString(),
      tests: {
        connection: 'ok',
        authentication: 'simulated',
        api_version: 'v1',
        permissions: ['read', 'send', 'modify'],
      },
      mock_data: {
        inbox_count: 42,
        unread_count: 7,
        last_sync: new Date().toISOString(),
      },
    };

    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Gmail test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Gmail test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
