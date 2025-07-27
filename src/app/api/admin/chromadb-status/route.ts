// src/app/api/admin/chromadb-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Simple ChromaDB status checker
class ChromaDBStatusChecker {
  private dataPath: string;

  constructor() {
    this.dataPath = join(process.cwd(), 'chromadb_data');
  }

  public getStorageInfo() {
    try {
      if (!existsSync(this.dataPath)) {
        return {
          exists: false,
          error: 'ChromaDB data directory not found',
        };
      }

      // Get SQLite database info
      const dbPath = join(this.dataPath, 'chroma.sqlite3');
      const dbExists = existsSync(dbPath);
      let dbSize = 0;

      if (dbExists) {
        const stats = statSync(dbPath);
        dbSize = stats.size;
      }

      // Count vector data files
      const fs = require('fs');
      const files = fs.readdirSync(this.dataPath);

      let vectorDirectories = 0;
      let totalVectorFiles = 0;
      let totalVectorSize = 0;

      files.forEach(file => {
        const filePath = join(this.dataPath, file);
        const stats = statSync(filePath);

        if (stats.isDirectory() && file.match(/^[a-f0-9-]{36}$/)) {
          vectorDirectories++;

          try {
            const vectorFiles = fs.readdirSync(filePath);
            totalVectorFiles += vectorFiles.length;

            vectorFiles.forEach(vFile => {
              const vFilePath = join(filePath, vFile);
              if (existsSync(vFilePath)) {
                const vStats = statSync(vFilePath);
                totalVectorSize += vStats.size;
              }
            });
          } catch (error) {
            // Skip inaccessible directories
          }
        }
      });

      return {
        exists: true,
        dataPath: this.dataPath,
        database: {
          exists: dbExists,
          size: dbSize,
          sizeFormatted: this.formatBytes(dbSize),
        },
        vectors: {
          collections: vectorDirectories,
          files: totalVectorFiles,
          size: totalVectorSize,
          sizeFormatted: this.formatBytes(totalVectorSize),
        },
        totalFiles: files.length,
        status: 'operational',
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async testConnection() {
    try {
      // Dynamic import ChromaDB to test connection
      const { execSync } = require('child_process');

      // Test Python ChromaDB import
      const testCommand = `python -c "import chromadb; client = chromadb.PersistentClient(path='./chromadb_data'); print('OK')"`;
      const result = execSync(testCommand, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 10000,
      });

      return {
        success: true,
        message: 'ChromaDB connection test passed',
        details: result.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public getRecommendations() {
    const storage = this.getStorageInfo();
    const recommendations = [];

    if (!storage.exists) {
      recommendations.push({
        type: 'critical',
        message: 'ChromaDB data directory missing - run setup script',
      });
      return recommendations;
    }

    if (storage.database && storage.database.size > 100 * 1024 * 1024) {
      // 100MB
      recommendations.push({
        type: 'warning',
        message: 'Database size is large - consider cleanup or archiving',
      });
    }

    if (storage.vectors && storage.vectors.size > 1024 * 1024 * 1024) {
      // 1GB
      recommendations.push({
        type: 'info',
        message: 'Vector storage is substantial - monitor disk usage',
      });
    }

    if (storage.vectors && storage.vectors.collections > 10) {
      recommendations.push({
        type: 'info',
        message: 'Many collections detected - consider consolidation',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'ChromaDB storage is healthy and optimized',
      });
    }

    return recommendations;
  }
}

const chromaStatus = new ChromaDBStatusChecker();

// GET: Get ChromaDB status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test-connection') {
      const connectionTest = await chromaStatus.testConnection();
      return NextResponse.json({
        success: true,
        connectionTest,
      });
    }

    // Default: return full status
    const storageInfo = chromaStatus.getStorageInfo();
    const recommendations = chromaStatus.getRecommendations();

    return NextResponse.json({
      success: true,
      status: 'production',
      mode: 'persistent',
      storage: storageInfo,
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST: Perform ChromaDB operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'test-persistence') {
      const connectionTest = await chromaStatus.testConnection();
      const storageInfo = chromaStatus.getStorageInfo();

      return NextResponse.json({
        success: true,
        message: 'Persistence test completed',
        connectionTest,
        storage: storageInfo,
        persistenceVerified: storageInfo.exists && storageInfo.database?.exists,
      });
    }

    if (action === 'cleanup-recommendations') {
      const recommendations = chromaStatus.getRecommendations();

      return NextResponse.json({
        success: true,
        recommendations,
        message: 'Cleanup recommendations generated',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unknown action',
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
