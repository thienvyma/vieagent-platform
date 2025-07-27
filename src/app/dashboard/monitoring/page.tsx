'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  responseTime: number;
  checks: {
    database: any;
    memory: any;
    disk: any;
    services: any;
  };
  system: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    memory: {
      used: number;
      total: number;
      external: number;
    };
  };
}

export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setHealthData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch health data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    fetchHealthData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      case 'not_configured': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading && !healthData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <span className="ml-4 text-xl">Đang tải dữ liệu monitoring...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-900/20 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <XCircle className="w-6 h-6 mr-2" />
                Lỗi Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300 mb-4">{error}</p>
              <Button onClick={fetchHealthData} className="bg-red-600 hover:bg-red-700">
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              System Monitoring
            </h1>
            <p className="text-gray-400 mt-2">
              Giám sát tình trạng hệ thống AI Agent Platform
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              Cập nhật lần cuối: {lastUpdate?.toLocaleTimeString('vi-VN')}
            </div>
            <Button
              onClick={fetchHealthData}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "primary" : "outline"}
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Activity className="w-4 h-4 mr-2" />
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </Button>
          </div>
        </div>

        {healthData && (
          <>
            {/* Overall Status */}
            <Card className="bg-gray-800/50 border-gray-700 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getStatusIcon(healthData.status)}
                  <span className="ml-2">Tình Trạng Tổng Quan</span>
                  <Badge 
                    className={`ml-4 ${
                      healthData.status === 'healthy' ? 'bg-green-600' :
                      healthData.status === 'degraded' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                  >
                    {healthData.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {healthData.responseTime}ms
                    </div>
                    <div className="text-sm text-gray-400">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {formatUptime(healthData.uptime)}
                    </div>
                    <div className="text-sm text-gray-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {healthData.version}
                    </div>
                    <div className="text-sm text-gray-400">Version</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {healthData.environment}
                    </div>
                    <div className="text-sm text-gray-400">Environment</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Database Check */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Database className="w-5 h-5 mr-2" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    {getStatusIcon(healthData.checks.database.status)}
                    <span className={`font-semibold ${getStatusColor(healthData.checks.database.status)}`}>
                      {healthData.checks.database.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Response: {healthData.checks.database.responseTime}ms
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {healthData.checks.database.message}
                  </div>
                </CardContent>
              </Card>

              {/* Memory Check */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Cpu className="w-5 h-5 mr-2" />
                    Memory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    {getStatusIcon(healthData.checks.memory.status)}
                    <span className={`font-semibold ${getStatusColor(healthData.checks.memory.status)}`}>
                      {healthData.checks.memory.percentage}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {healthData.checks.memory.used}MB / {healthData.checks.memory.total}MB
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {healthData.checks.memory.message}
                  </div>
                </CardContent>
              </Card>

              {/* Disk Check */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <HardDrive className="w-5 h-5 mr-2" />
                    Disk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    {getStatusIcon(healthData.checks.disk.status)}
                    <span className={`font-semibold ${getStatusColor(healthData.checks.disk.status)}`}>
                      {healthData.checks.disk.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Available: {healthData.checks.disk.available}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {healthData.checks.disk.message}
                  </div>
                </CardContent>
              </Card>

              {/* Services Check */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Server className="w-5 h-5 mr-2" />
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(healthData.checks.services).map(([service, data]: [string, any]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{service}</span>
                        <div className="flex items-center">
                          {getStatusIcon(data.status)}
                          <span className={`text-xs ml-1 ${getStatusColor(data.status)}`}>
                            {data.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Thông Tin Hệ Thống
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-gray-400">Node Version</div>
                    <div className="font-semibold">{healthData.system.nodeVersion}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Platform</div>
                    <div className="font-semibold">{healthData.system.platform}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Architecture</div>
                    <div className="font-semibold">{healthData.system.arch}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Process ID</div>
                    <div className="font-semibold">{healthData.system.pid}</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="text-sm text-gray-400 mb-2">Memory Usage Detail</div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 p-3 rounded">
                      <div className="text-xs text-gray-400">Heap Used</div>
                      <div className="font-semibold">{healthData.system.memory.used}MB</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                      <div className="text-xs text-gray-400">Heap Total</div>
                      <div className="font-semibold">{healthData.system.memory.total}MB</div>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                      <div className="text-xs text-gray-400">External</div>
                      <div className="font-semibold">{healthData.system.memory.external}MB</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
