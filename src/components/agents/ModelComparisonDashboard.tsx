/**
 * 🎯 Model Comparison Dashboard - Day 21 Step 21.2
 * Advanced dashboard for comparing model provider performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Download,
  Filter,
  Settings,
} from 'lucide-react';

interface ProviderMetrics {
  provider: string;
  model: string;
  averageResponseTime: number;
  successRate: number;
  averageCost: number;
  totalRequests: number;
  score: number;
  status: 'active' | 'inactive' | 'error';
  lastUsed: string;
}

interface ComparisonData {
  provider: string;
  model: string;
  responseTime: number;
  cost: number;
  successRate: number;
  requests: number;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

interface TimeSeriesData {
  timestamp: string;
  openai: number;
  anthropic: number;
  google: number;
}

interface ModelComparisonDashboardProps {
  agentId: string;
  showRealTimeData?: boolean;
  onProviderSelect?: (provider: string) => void;
}

// Remove mock data - will be loaded from API

const costData = [
  { provider: 'OpenAI GPT-4', cost: 37.5, percentage: 60 },
  { provider: 'Anthropic Claude', cost: 12.0, percentage: 19 },
  { provider: 'OpenAI GPT-3.5', cost: 4.2, percentage: 7 },
  { provider: 'Google Gemini', cost: 0.95, percentage: 1 },
  { provider: 'Other', cost: 8.35, percentage: 13 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ModelComparisonDashboard({
  agentId,
  showRealTimeData = false,
  onProviderSelect,
}: ModelComparisonDashboardProps) {
  // Using React.useState for state management
  const [metrics, setMetrics] = useState<ProviderMetrics[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<
    'responseTime' | 'cost' | 'successRate' | 'score'
  >('score');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load provider metrics from API
  const loadProviderMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from API first
      const response = await fetch(`/api/agents/${agentId}/providers/metrics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
        setTimeSeriesData(data.timeSeriesData || []);
        setDataLoaded(true);
      } else {
        // Fallback to empty state if API not available
        setMetrics([]);
        setTimeSeriesData([]);
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading provider metrics:', error);
      setMetrics([]);
      setTimeSeriesData([]);
      setDataLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (agentId) {
      loadProviderMetrics();
    }
  }, [agentId, timeRange]);

  // Simulate real-time updates only if data is loaded and feature is enabled
  useEffect(() => {
    if (!showRealTimeData || !dataLoaded || metrics.length === 0) return;

    const interval = setInterval(() => {
      setMetrics(prev =>
        prev.map(metric => ({
          ...metric,
          averageResponseTime: Math.max(500, metric.averageResponseTime + (Math.random() - 0.5) * 200),
          successRate: Math.max(90, Math.min(100, metric.successRate + (Math.random() - 0.5) * 2)),
          totalRequests: metric.totalRequests + Math.floor(Math.random() * 5),
        }))
      );
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [showRealTimeData, dataLoaded, metrics.length]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadProviderMetrics();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const data = {
      metrics,
      timeRange,
      exportedAt: new Date().toISOString(),
      agentId,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-comparison-${agentId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />;
      case 'stable':
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const topPerformer = metrics.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  const totalRequests = metrics.reduce((sum, metric) => sum + metric.totalRequests, 0);
  const averageResponseTime =
    metrics.reduce((sum, metric) => sum + metric.averageResponseTime, 0) / metrics.length;
  const totalCost = metrics.reduce(
    (sum, metric) => sum + metric.averageCost * metric.totalRequests,
    0
  );

  return (
    <div className='w-full max-w-7xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Model Performance Comparison</h2>
          <p className='text-gray-600'>
            Compare AI model providers performance and costs
            {showRealTimeData && (
              <span className='ml-2 text-sm text-green-600'>
                • Live data (updated {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='1h'>Last Hour</SelectItem>
              <SelectItem value='24h'>Last 24h</SelectItem>
              <SelectItem value='7d'>Last 7 days</SelectItem>
              <SelectItem value='30d'>Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant='outline' onClick={handleExport}>
            <Download className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Top Performer</p>
                <p className='text-lg font-semibold'>{topPerformer.provider}</p>
                <p className='text-sm text-gray-500'>{topPerformer.model}</p>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(topPerformer.score)}`}>
                {topPerformer.score}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Requests</p>
                <p className='text-2xl font-bold'>{totalRequests.toLocaleString()}</p>
              </div>
              <Activity className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Avg Response Time</p>
                <p className='text-2xl font-bold'>{averageResponseTime.toFixed(0)}ms</p>
              </div>
              <Clock className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Cost</p>
                <p className='text-2xl font-bold'>${totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='costs'>Cost Analysis</TabsTrigger>
          <TabsTrigger value='trends'>Trends</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                Provider Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {metrics.map(metric => (
                  <div
                    key={`${metric.provider}-${metric.model}`}
                    className='p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors'
                    onClick={() => onProviderSelect?.(metric.provider)}
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <div>
                          <h3 className='font-semibold'>{metric.provider}</h3>
                          <p className='text-sm text-gray-600'>{metric.model}</p>
                        </div>
                        <Badge className={getStatusColor(metric.status)}>{metric.status}</Badge>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                        {metric.score}
                      </div>
                    </div>

                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                      <div>
                        <p className='text-gray-600'>Response Time</p>
                        <p className='font-medium'>{metric.averageResponseTime.toFixed(0)}ms</p>
                      </div>
                      <div>
                        <p className='text-gray-600'>Success Rate</p>
                        <p className='font-medium'>{metric.successRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className='text-gray-600'>Avg Cost</p>
                        <p className='font-medium'>${metric.averageCost.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className='text-gray-600'>Requests</p>
                        <p className='font-medium'>{metric.totalRequests.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className='mt-3'>
                      <div className='flex items-center justify-between text-sm mb-1'>
                        <span>Overall Score</span>
                        <span>{metric.score}/100</span>
                      </div>
                      <Progress value={metric.score} className='h-2' />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Response Time Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='provider' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='averageResponseTime' fill='#8884d8' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='provider' />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Bar dataKey='successRate' fill='#82ca9d' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Score Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left p-2'>Provider</th>
                      <th className='text-left p-2'>Model</th>
                      <th className='text-right p-2'>Response Time</th>
                      <th className='text-right p-2'>Success Rate</th>
                      <th className='text-right p-2'>Requests</th>
                      <th className='text-right p-2'>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, index) => (
                      <tr key={index} className='border-b hover:bg-gray-50'>
                        <td className='p-2 font-medium'>{metric.provider}</td>
                        <td className='p-2 text-gray-600'>{metric.model}</td>
                        <td className='p-2 text-right'>
                          {metric.averageResponseTime.toFixed(0)}ms
                        </td>
                        <td className='p-2 text-right'>{metric.successRate.toFixed(1)}%</td>
                        <td className='p-2 text-right'>{metric.totalRequests.toLocaleString()}</td>
                        <td className={`p-2 text-right font-bold ${getScoreColor(metric.score)}`}>
                          {metric.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='costs' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={costData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ provider, percentage }) => `${provider} (${percentage}%)`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='cost'
                    >
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost per Request</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='provider' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='averageCost' fill='#ffc658' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {metrics.map(metric => {
                  const totalCost = metric.averageCost * metric.totalRequests;
                  return (
                    <div
                      key={`${metric.provider}-${metric.model}`}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div>
                        <p className='font-medium'>
                          {metric.provider} - {metric.model}
                        </p>
                        <p className='text-sm text-gray-600'>
                          {metric.totalRequests.toLocaleString()} requests × $
                          {metric.averageCost.toFixed(4)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold'>${totalCost.toFixed(2)}</p>
                        <p className='text-sm text-gray-600'>
                          {((totalCost / totalCost) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='trends' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='timestamp' />
                  <YAxis />
                  <Tooltip />
                  <Line type='monotone' dataKey='openai' stroke='#8884d8' strokeWidth={2} />
                  <Line type='monotone' dataKey='anthropic' stroke='#82ca9d' strokeWidth={2} />
                  <Line type='monotone' dataKey='google' stroke='#ffc658' strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {metrics.slice(0, 3).map(metric => (
              <Card key={`${metric.provider}-${metric.model}`}>
                <CardHeader>
                  <CardTitle className='text-base'>{metric.provider}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Performance</span>
                      {getTrendIcon('up')}
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Cost Efficiency</span>
                      {getTrendIcon('stable')}
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Reliability</span>
                      {getTrendIcon('up')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Empty State */}
      {dataLoaded && metrics.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Provider Data Available</h3>
          <p className="text-gray-400 mb-4">
            {agentId 
              ? "No metrics available for this agent yet. Start using the agent to see performance data."
              : "Select an agent to view provider performance metrics."
            }
          </p>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      )}
    </div>
  );
}
