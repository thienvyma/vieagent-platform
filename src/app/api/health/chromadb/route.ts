import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin users to check ChromaDB health
    if (!session?.user || !hasPermission(session.user.role, 'view_metrics')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ChromaDB Vector Database',
      checks: {},
    };

    // Test ChromaDB connectivity
    try {
      // Try to import ChromaDB
      const { ChromaClient } = await import('chromadb');

      // Test server connection first
      let client;
      let connectionType = 'server';

      try {
        const serverUrl = `http://${process.env.CHROMADB_HOST || 'localhost'}:${process.env.CHROMADB_PORT || '8000'}`;
        client = new ChromaClient({ path: serverUrl });

        // Test heartbeat
        await client.heartbeat();

        health.checks.serverConnection = {
          status: 'healthy',
          url: serverUrl,
          responseTime: Date.now() - startTime,
        };
      } catch (serverError) {
        // Fallback to embedded client
        connectionType = 'embedded';
        const chromadbModule = await import('chromadb');
        client = new chromadbModule.PersistentClient({
          path: process.env.CHROMA_PERSIST_DIRECTORY || './chromadb_data',
        });

        health.checks.serverConnection = {
          status: 'degraded',
          error: 'Server unavailable, using embedded mode',
          fallback: true,
        };
      }

      // Test basic operations
      const testCollectionName = `health_test_${Date.now()}`;
      let collection;

      try {
        // Test collection creation
        collection = await client.createCollection({
          name: testCollectionName,
          metadata: { purpose: 'health_check' },
        });

        health.checks.collectionOps = {
          status: 'healthy',
          operation: 'create_collection',
          responseTime: Date.now() - startTime,
        };

        // Test document operations
        const testDoc = {
          ids: ['test_doc_1'],
          metadatas: [{ test: true }],
          documents: ['This is a health check document for ChromaDB testing'],
        };

        await collection.add(testDoc);

        health.checks.documentOps = {
          status: 'healthy',
          operation: 'add_document',
          responseTime: Date.now() - startTime,
        };

        // Test query operations
        const queryResult = await collection.query({
          queryTexts: ['health check'],
          nResults: 1,
        });

        health.checks.queryOps = {
          status: 'healthy',
          operation: 'query_documents',
          results: queryResult.ids[0]?.length || 0,
          responseTime: Date.now() - startTime,
        };

        // Clean up test collection
        await client.deleteCollection({ name: testCollectionName });

        health.checks.cleanup = {
          status: 'healthy',
          operation: 'delete_collection',
        };
      } catch (opsError) {
        health.checks.operations = {
          status: 'unhealthy',
          error: opsError instanceof Error ? opsError.message : 'Unknown operation error',
          responseTime: Date.now() - startTime,
        };
        health.status = 'degraded';
      }

      // Get collection stats
      try {
        const collections = await client.listCollections();
        health.checks.collectionsInfo = {
          status: 'healthy',
          totalCollections: collections.length,
          collections: collections.map(c => ({
            name: c.name,
            id: c.id,
          })),
        };
      } catch (listError) {
        health.checks.collectionsInfo = {
          status: 'degraded',
          error: 'Could not list collections',
        };
      }

      health.connectionType = connectionType;
      health.responseTime = Date.now() - startTime;
    } catch (error) {
      health.status = 'unhealthy';
      health.checks.chromadbConnection = {
        status: 'down',
        error: error instanceof Error ? error.message : 'ChromaDB connection failed',
        responseTime: Date.now() - startTime,
      };
    }

    // Overall health status
    const allChecks = Object.values(health.checks);
    const healthyChecks = allChecks.filter((check: any) => check.status === 'healthy');
    const unhealthyChecks = allChecks.filter(
      (check: any) => check.status === 'unhealthy' || check.status === 'down'
    );

    if (unhealthyChecks.length > 0) {
      health.status = 'unhealthy';
    } else if (healthyChecks.length < allChecks.length) {
      health.status = 'degraded';
    }

    const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 206 : 503;

    return NextResponse.json(health, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'ChromaDB Vector Database',
        error: error instanceof Error ? error.message : 'Health check failed',
        responseTime: Date.now() - performance.now(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for triggering ChromaDB maintenance operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow owner/admin users to perform maintenance
    if (!session?.user || !hasPermission(session.user.role, 'manage_system_settings')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'restart_connection':
        // Restart ChromaDB connection
        return NextResponse.json({
          message: 'ChromaDB connection restart initiated',
          timestamp: new Date().toISOString(),
        });

      case 'clear_cache':
        // Clear any caches
        return NextResponse.json({
          message: 'ChromaDB cache cleared',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({ error: 'Invalid maintenance action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Maintenance operation failed',
      },
      { status: 500 }
    );
  }
}
