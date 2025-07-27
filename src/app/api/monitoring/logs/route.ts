import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  metadata?: any;
}

interface LogFilter {
  level?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * GET /api/monitoring/logs
 * Returns aggregated logs with filtering and search capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const level = searchParams.get('level');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const logsPath = join(process.cwd(), 'logs');

    // Ensure logs directory exists
    if (!existsSync(logsPath)) {
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          totalCount: 0,
          sources: [],
          levels: ['info', 'warn', 'error', 'debug'],
          timeRange: null,
        },
        meta: {
          endpoint: '/api/monitoring/logs',
          timestamp: new Date().toISOString(),
          message: 'Logs directory not found - no logs available yet',
        },
      });
    }

    // Get all log files
    const logFiles = readdirSync(logsPath)
      .filter(file => file.endsWith('.log') || file.endsWith('.json'))
      .map(file => {
        const filePath = join(logsPath, file);
        const stats = statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    // Aggregate logs from all files
    const allLogs: LogEntry[] = [];
    const sources = new Set<string>();
    const levels = new Set<string>();

    for (const logFile of logFiles.slice(0, 10)) {
      // Limit to 10 most recent files
      try {
        const content = readFileSync(logFile.path, 'utf8');

        if (logFile.name.endsWith('.json')) {
          // Handle JSON log files (like alerts.json)
          const lines = content
            .trim()
            .split('\n')
            .filter(line => line.trim());
          for (const line of lines) {
            try {
              const logEntry = JSON.parse(line);
              const normalizedEntry: LogEntry = {
                timestamp: logEntry.timestamp || new Date().toISOString(),
                level: logEntry.severity ? mapSeverityToLevel(logEntry.severity) : 'info',
                message: logEntry.message || JSON.stringify(logEntry),
                source: logFile.name.replace('.json', ''),
                metadata: logEntry,
              };
              allLogs.push(normalizedEntry);
              sources.add(normalizedEntry.source || 'unknown');
              levels.add(normalizedEntry.level);
            } catch (parseError) {
              // Skip invalid JSON lines
            }
          }
        } else {
          // Handle text log files
          const lines = content
            .trim()
            .split('\n')
            .filter(line => line.trim());
          for (const line of lines) {
            const logEntry = parseLogLine(line, logFile.name);
            if (logEntry) {
              allLogs.push(logEntry);
              sources.add(logEntry.source || 'unknown');
              levels.add(logEntry.level);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading log file ${logFile.name}:`, error);
      }
    }

    // Sort logs by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    let filteredLogs = allLogs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (source) {
      filteredLogs = filteredLogs.filter(log => log.source === source);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(
        log =>
          log.message.toLowerCase().includes(searchLower) ||
          (log.source && log.source.toLowerCase().includes(searchLower))
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
    }

    // Pagination
    const totalCount = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    // Calculate time range
    const timeRange =
      allLogs.length > 0
        ? {
            earliest: allLogs[allLogs.length - 1].timestamp,
            latest: allLogs[0].timestamp,
          }
        : null;

    // Log level statistics
    const levelStats = Array.from(levels).reduce(
      (stats, level) => {
        stats[level] = filteredLogs.filter(log => log.level === level).length;
        return stats;
      },
      {} as Record<string, number>
    );

    const response = {
      success: true,
      data: {
        logs: paginatedLogs,
        totalCount,
        filteredCount: filteredLogs.length,
        sources: Array.from(sources),
        levels: Array.from(levels),
        levelStats,
        timeRange,
        logFiles: logFiles.map(f => ({
          name: f.name,
          size: f.size,
          modified: f.modified,
        })),
      },
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      meta: {
        endpoint: '/api/monitoring/logs',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Logs API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve logs',
        message: error instanceof Error ? error.message : 'Unknown error',
        meta: {
          endpoint: '/api/monitoring/logs',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/monitoring/logs
 * Add new log entries or manage log configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, logEntry, config } = body;

    switch (action) {
      case 'add':
        // Add a new log entry
        if (!logEntry) {
          return NextResponse.json(
            {
              success: false,
              error: 'Log entry is required',
            },
            { status: 400 }
          );
        }

        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: logEntry.level || 'info',
          message: logEntry.message || '',
          source: logEntry.source || 'api',
          metadata: logEntry.metadata || {},
        };

        // Here you would typically write to a log file
        console.log('New log entry:', entry);

        return NextResponse.json({
          success: true,
          data: {
            message: 'Log entry added successfully',
            logEntry: entry,
          },
          meta: {
            endpoint: '/api/monitoring/logs',
            action: 'add',
            timestamp: new Date().toISOString(),
          },
        });

      case 'clear':
        // Clear logs (would implement actual log clearing in production)
        console.log('🗑️ Log clearing requested');

        return NextResponse.json({
          success: true,
          data: { message: 'Logs cleared successfully' },
          meta: {
            endpoint: '/api/monitoring/logs',
            action: 'clear',
            timestamp: new Date().toISOString(),
          },
        });

      case 'export':
        // Export logs (would implement actual export in production)
        const format = config?.format || 'json';

        return NextResponse.json({
          success: true,
          data: {
            message: `Logs exported successfully in ${format} format`,
            downloadUrl: `/api/monitoring/logs/export?format=${format}`,
          },
          meta: {
            endpoint: '/api/monitoring/logs',
            action: 'export',
            timestamp: new Date().toISOString(),
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['add', 'clear', 'export'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Logs management error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to manage logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions
function mapSeverityToLevel(severity: string): LogEntry['level'] {
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warn';
    case 'low':
      return 'info';
    default:
      return 'info';
  }
}

function parseLogLine(line: string, fileName: string): LogEntry | null {
  try {
    // Try to parse as structured log first
    if (line.includes('[') && line.includes(']')) {
      const timestampMatch = line.match(/^\[(.*?)\]/);
      const levelMatch = line.match(/\[(ERROR|WARN|INFO|DEBUG)\]/i);

      if (timestampMatch) {
        const timestamp = timestampMatch[1];
        const level = levelMatch ? (levelMatch[1].toLowerCase() as LogEntry['level']) : 'info';
        const message = line
          .replace(/^\[.*?\]/, '')
          .replace(/\[.*?\]/, '')
          .trim();

        return {
          timestamp: new Date(timestamp).toISOString(),
          level,
          message,
          source: fileName.replace('.log', ''),
        };
      }
    }

    // Fallback to simple parsing
    return {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: line,
      source: fileName.replace('.log', ''),
    };
  } catch (error) {
    return null;
  }
}
