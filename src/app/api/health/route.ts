import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 🏥 HEALTH CHECK ENDPOINT
 * Kiểm tra tình trạng sức khỏe của ứng dụng
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Kiểm tra database connection
    const dbCheck = await checkDatabase();
    
    // 2. Kiểm tra memory usage
    const memoryCheck = checkMemory();
    
    // 3. Kiểm tra response time
    const responseTime = Date.now() - startTime;
    
    // 4. Tính toán overall health
    const overallHealth = calculateOverallHealth(dbCheck, memoryCheck, responseTime);
    
    const healthData = {
      status: overallHealth.status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: responseTime,
      
      // Chi tiết kiểm tra
      checks: {
        database: dbCheck,
        memory: memoryCheck,
        disk: checkDisk(),
        services: await checkExternalServices()
      },
      
      // Thông tin hệ thống
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      }
    };
    
    // Trả về status code phù hợp
    const statusCode = overallHealth.status === 'healthy' ? 200 : 
                      overallHealth.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthData, { status: statusCode });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }, { status: 503 });
  }
}

/**
 * Kiểm tra kết nối database
 */
async function checkDatabase() {
  try {
    const startTime = Date.now();
    
    // Thực hiện query đơn giản
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime: responseTime,
      message: responseTime < 1000 ? 'Database connection OK' : 'Database slow response'
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: -1,
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Kiểm tra memory usage
 */
function checkMemory() {
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((heapUsedMB / heapTotalMB) * 100);
  
  let status = 'healthy';
  let message = 'Memory usage normal';
  
  if (usagePercent > 90) {
    status = 'unhealthy';
    message = 'Memory usage critical';
  } else if (usagePercent > 70) {
    status = 'degraded';
    message = 'Memory usage high';
  }
  
  return {
    status,
    used: heapUsedMB,
    total: heapTotalMB,
    percentage: usagePercent,
    message
  };
}

/**
 * Kiểm tra disk space (simplified)
 */
function checkDisk() {
  // Trong môi trường production, bạn có thể sử dụng thư viện như 'node-disk-info'
  // Hiện tại chỉ return mock data
  return {
    status: 'healthy',
    available: 'N/A',
    total: 'N/A',
    message: 'Disk check not implemented'
  };
}

/**
 * Kiểm tra external services
 */
async function checkExternalServices() {
  const services = {
    openai: await checkOpenAI(),
    supabase: await checkSupabase(),
    pinecone: await checkPinecone()
  };
  
  return services;
}

/**
 * Kiểm tra OpenAI API
 */
async function checkOpenAI() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { status: 'not_configured', message: 'OpenAI API key not configured' };
    }
    
    // Có thể thêm API call test ở đây
    return { status: 'healthy', message: 'OpenAI API key configured' };
    
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `OpenAI check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Kiểm tra Supabase
 */
async function checkSupabase() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return { status: 'not_configured', message: 'Supabase credentials not configured' };
    }
    
    return { status: 'healthy', message: 'Supabase credentials configured' };
    
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Supabase check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Kiểm tra Pinecone
 */
async function checkPinecone() {
  try {
    if (!process.env.PINECONE_API_KEY) {
      return { status: 'not_configured', message: 'Pinecone API key not configured' };
    }
    
    return { status: 'healthy', message: 'Pinecone API key configured' };
    
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Pinecone check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Tính toán overall health
 */
function calculateOverallHealth(dbCheck: any, memoryCheck: any, responseTime: number) {
  const checks = [dbCheck.status, memoryCheck.status];
  
  // Nếu có bất kỳ check nào unhealthy
  if (checks.includes('unhealthy') || responseTime > 5000) {
    return { status: 'unhealthy', message: 'System has critical issues' };
  }
  
  // Nếu có check nào degraded
  if (checks.includes('degraded') || responseTime > 2000) {
    return { status: 'degraded', message: 'System performance degraded' };
  }
  
  return { status: 'healthy', message: 'All systems operational' };
}
