/**
 * 🎯 Admin Model Management Component - Day 21 Step 21.3
 * System-wide model provider management for administrators
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Key,
  Shield,
  Activity,
  DollarSign,
  Clock,
  Users,
  Server,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ModelProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  status: 'active' | 'inactive' | 'error';
  apiKey: string;
  endpoint?: string;
  models: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usage: {
    totalRequests: number;
    totalCost: number;
    activeUsers: number;
    lastUsed: string;
  };
  config: {
    rateLimit?: number;
    maxConcurrentRequests?: number;
    timeout?: number;
    retryAttempts?: number;
    costPerRequest?: number;
  };
}

interface SystemSettings {
  defaultProvider: string;
  fallbackProviders: string[];
  globalRateLimit: number;
  maxCostPerUser: number;
  enableCostTracking: boolean;
  enableUsageAnalytics: boolean;
  maintenanceMode: boolean;
  allowedDomains: string[];
  securitySettings: {
    requireApiKeyRotation: boolean;
    apiKeyRotationDays: number;
    enableAuditLogging: boolean;
    enableRateLimiting: boolean;
  };
}

// Model providers will be loaded from API - no more mock data

export default function AdminModelManagement() {
  // Using React.useState for state management
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    defaultProvider: 'openai',
    fallbackProviders: ['anthropic', 'google'],
    globalRateLimit: 10000,
    maxCostPerUser: 100,
    enableCostTracking: true,
    enableUsageAnalytics: true,
    maintenanceMode: false,
    allowedDomains: ['*.company.com', 'localhost'],
    securitySettings: {
      requireApiKeyRotation: true,
      apiKeyRotationDays: 90,
      enableAuditLogging: true,
      enableRateLimiting: true,
    },
  });

  // Load providers from API
  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/model-providers');
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data || []);
      } else {
        console.error('Failed to load providers:', data.error);
        setProviders([]);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load providers on component mount
  useEffect(() => {
    loadProviders();
  }, []);

  const [newProvider, setNewProvider] = useState<Partial<ModelProvider>>({
    name: '',
    type: 'openai',
    apiKey: '',
    endpoint: '',
    models: [],
    isActive: true,
    config: {
      rateLimit: 1000,
      maxConcurrentRequests: 50,
      timeout: 30000,
      retryAttempts: 3,
      costPerRequest: 0.01,
    },
  });

  const handleAddProvider = () => {
    const provider: ModelProvider = {
      id: Date.now().toString(),
      name: newProvider.name || '',
      type: newProvider.type as any,
      status: 'inactive',
      apiKey: newProvider.apiKey || '',
      endpoint: newProvider.endpoint,
      models: newProvider.models || [],
      isActive: newProvider.isActive || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: {
        totalRequests: 0,
        totalCost: 0,
        activeUsers: 0,
        lastUsed: new Date().toISOString(),
      },
      config: newProvider.config || {
        rateLimit: 1000,
        maxConcurrentRequests: 50,
        timeout: 30000,
        retryAttempts: 3,
        costPerRequest: 0.01,
      },
    };

    setProviders([...providers, provider]);
    setNewProvider({
      name: '',
      type: 'openai',
      apiKey: '',
      endpoint: '',
      models: [],
      isActive: true,
      config: {
        rateLimit: 1000,
        maxConcurrentRequests: 50,
        timeout: 30000,
        retryAttempts: 3,
        costPerRequest: 0.01,
      },
    });
    setShowAddDialog(false);
  };

  const handleEditProvider = (provider: ModelProvider) => {
    setSelectedProvider(provider);
    setShowEditDialog(true);
  };

  const handleDeleteProvider = (providerId: string) => {
    setProviders(providers.filter(p => p.id !== providerId));
  };

  const handleToggleProvider = (providerId: string) => {
    setProviders(
      providers.map(p =>
        p.id === providerId
          ? { ...p, isActive: !p.isActive, status: p.isActive ? 'inactive' : 'active' }
          : p
      )
    );
  };

  const handleTestProvider = async (providerId: string) => {
    setIsLoading(true);

    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));

    setProviders(
      providers.map(p =>
        p.id === providerId ? { ...p, status: Math.random() > 0.2 ? 'active' : 'error' } : p
      )
    );

    setIsLoading(false);
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'inactive':
        return <XCircle className='h-4 w-4 text-gray-500' />;
      case 'error':
        return <AlertTriangle className='h-4 w-4 text-red-500' />;
      default:
        return <XCircle className='h-4 w-4 text-gray-500' />;
    }
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

  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'anthropic':
        return 'bg-blue-100 text-blue-800';
      case 'google':
        return 'bg-orange-100 text-orange-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalUsage = providers.reduce((sum, p) => sum + p.usage.totalCost, 0);
  const totalRequests = providers.reduce((sum, p) => sum + p.usage.totalRequests, 0);
  const activeProviders = providers.filter(p => p.status === 'active').length;

  return (
    <div className='w-full max-w-7xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Model Provider Management</h2>
          <p className='text-gray-600'>Manage AI model providers and system-wide settings</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => setIsLoading(true)}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Add New Provider</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label>Provider Name</Label>
                    <Input
                      value={newProvider.name}
                      onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
                      placeholder='OpenAI Production'
                    />
                  </div>
                  <div>
                    <Label>Provider Type</Label>
                    <Select
                      value={newProvider.type}
                      onValueChange={value =>
                        setNewProvider({ ...newProvider, type: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='openai'>OpenAI</SelectItem>
                        <SelectItem value='anthropic'>Anthropic</SelectItem>
                        <SelectItem value='google'>Google</SelectItem>
                        <SelectItem value='custom'>Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type='password'
                    value={newProvider.apiKey}
                    onChange={e => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                    placeholder='sk-...'
                  />
                </div>
                <div>
                  <Label>Custom Endpoint (Optional)</Label>
                  <Input
                    value={newProvider.endpoint}
                    onChange={e => setNewProvider({ ...newProvider, endpoint: e.target.value })}
                    placeholder='https://api.custom-provider.com/v1'
                  />
                </div>
                <div>
                  <Label>Supported Models (comma-separated)</Label>
                  <Input
                    value={newProvider.models?.join(', ')}
                    onChange={e =>
                      setNewProvider({
                        ...newProvider,
                        models: e.target.value
                          .split(',')
                          .map(m => m.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder='gpt-4, gpt-3.5-turbo'
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <Switch
                    checked={newProvider.isActive}
                    onCheckedChange={checked =>
                      setNewProvider({ ...newProvider, isActive: checked })
                    }
                  />
                  <Label>Enable provider</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProvider}>Add Provider</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Active Providers</p>
                <p className='text-2xl font-bold'>{activeProviders}</p>
              </div>
              <Server className='h-8 w-8 text-blue-500' />
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
              <Activity className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total Cost</p>
                <p className='text-2xl font-bold'>${totalUsage.toFixed(2)}</p>
              </div>
              <DollarSign className='h-8 w-8 text-yellow-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Active Users</p>
                <p className='text-2xl font-bold'>
                  {providers.reduce((sum, p) => sum + p.usage.activeUsers, 0)}
                </p>
              </div>
              <Users className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='providers' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='providers'>Providers</TabsTrigger>
          <TabsTrigger value='settings'>System Settings</TabsTrigger>
          <TabsTrigger value='monitoring'>Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value='providers' className='space-y-4'>
          <div className='space-y-4'>
            {providers.map(provider => (
              <Card key={provider.id}>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-semibold text-lg'>{provider.name}</h3>
                          <Badge className={getProviderTypeColor(provider.type)}>
                            {provider.type}
                          </Badge>
                          <Badge className={getStatusColor(provider.status)}>
                            {provider.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600'>
                          {provider.models.length} models • Last used{' '}
                          {new Date(provider.usage.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? <RefreshCw className='h-4 w-4 animate-spin' /> : 'Test'}
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditProvider(provider)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Switch
                        checked={provider.isActive}
                        onCheckedChange={() => handleToggleProvider(provider.id)}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant='outline' size='sm'>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {provider.name}? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProvider(provider.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                    <div className='p-3 bg-gray-50 rounded-lg'>
                      <p className='text-sm text-gray-600'>Total Requests</p>
                      <p className='font-semibold'>
                        {provider.usage.totalRequests.toLocaleString()}
                      </p>
                    </div>
                    <div className='p-3 bg-gray-50 rounded-lg'>
                      <p className='text-sm text-gray-600'>Total Cost</p>
                      <p className='font-semibold'>${provider.usage.totalCost.toFixed(2)}</p>
                    </div>
                    <div className='p-3 bg-gray-50 rounded-lg'>
                      <p className='text-sm text-gray-600'>Active Users</p>
                      <p className='font-semibold'>{provider.usage.activeUsers}</p>
                    </div>
                    <div className='p-3 bg-gray-50 rounded-lg'>
                      <p className='text-sm text-gray-600'>Usage Statistics</p>
                      <p className='font-semibold'>{provider.config.rateLimit}/min</p>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <Key className='h-4 w-4 text-gray-500' />
                      <span className='text-sm text-gray-600'>API Key:</span>
                      <code className='text-sm bg-gray-100 px-2 py-1 rounded'>
                        {showApiKey[provider.id] ? provider.apiKey : '••••••••••••••••'}
                      </code>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => toggleApiKeyVisibility(provider.id)}
                      >
                        {showApiKey[provider.id] ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </Button>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-gray-600'>Models:</span>
                      <div className='flex flex-wrap gap-1'>
                        {provider.models.map(model => (
                          <Badge key={model} variant='secondary' className='text-xs'>
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='settings' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <Label>Default Provider</Label>
                  <Select
                    value={systemSettings.defaultProvider}
                    onValueChange={value =>
                      setSystemSettings({ ...systemSettings, defaultProvider: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.type}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Global Rate Limit (requests/hour)</Label>
                  <Input
                    type='number'
                    value={systemSettings.globalRateLimit}
                    onChange={e =>
                      setSystemSettings({
                        ...systemSettings,
                        globalRateLimit: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base'>Cost Tracking</Label>
                    <p className='text-sm text-gray-600'>Track usage costs across all providers</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableCostTracking}
                    onCheckedChange={checked =>
                      setSystemSettings({ ...systemSettings, enableCostTracking: checked })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base'>Usage Analytics</Label>
                    <p className='text-sm text-gray-600'>
                      Collect usage analytics and performance metrics
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableUsageAnalytics}
                    onCheckedChange={checked =>
                      setSystemSettings({ ...systemSettings, enableUsageAnalytics: checked })
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <div>
                    <Label className='text-base'>Maintenance Mode</Label>
                    <p className='text-sm text-gray-600'>Temporarily disable all AI providers</p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={checked =>
                      setSystemSettings({ ...systemSettings, maintenanceMode: checked })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Max Cost Per User ($)</Label>
                <Input
                  type='number'
                  step='0.01'
                  value={systemSettings.maxCostPerUser}
                  onChange={e =>
                    setSystemSettings({
                      ...systemSettings,
                      maxCostPerUser: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label>Allowed Domains</Label>
                <Textarea
                  value={systemSettings.allowedDomains.join('\n')}
                  onChange={e =>
                    setSystemSettings({
                      ...systemSettings,
                      allowedDomains: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  placeholder='*.company.com&#10;localhost&#10;127.0.0.1'
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Require API Key Rotation</Label>
                  <p className='text-sm text-gray-600'>Force regular API key rotation</p>
                </div>
                <Switch
                  checked={systemSettings.securitySettings.requireApiKeyRotation}
                  onCheckedChange={checked =>
                    setSystemSettings({
                      ...systemSettings,
                      securitySettings: {
                        ...systemSettings.securitySettings,
                        requireApiKeyRotation: checked,
                      },
                    })
                  }
                />
              </div>

              <div>
                <Label>API Key Rotation Days</Label>
                <Input
                  type='number'
                  value={systemSettings.securitySettings.apiKeyRotationDays}
                  onChange={e =>
                    setSystemSettings({
                      ...systemSettings,
                      securitySettings: {
                        ...systemSettings.securitySettings,
                        apiKeyRotationDays: parseInt(e.target.value) || 90,
                      },
                    })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Enable Audit Logging</Label>
                  <p className='text-sm text-gray-600'>Log all provider configuration changes</p>
                </div>
                <Switch
                  checked={systemSettings.securitySettings.enableAuditLogging}
                  onCheckedChange={checked =>
                    setSystemSettings({
                      ...systemSettings,
                      securitySettings: {
                        ...systemSettings.securitySettings,
                        enableAuditLogging: checked,
                      },
                    })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Enable Rate Limiting</Label>
                  <p className='text-sm text-gray-600'>Apply rate limits to prevent abuse</p>
                </div>
                <Switch
                  checked={systemSettings.securitySettings.enableRateLimiting}
                  onCheckedChange={checked =>
                    setSystemSettings({
                      ...systemSettings,
                      securitySettings: {
                        ...systemSettings.securitySettings,
                        enableRateLimiting: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='monitoring' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Provider Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {providers.map(provider => (
                    <div
                      key={provider.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        {getStatusIcon(provider.status)}
                        <div>
                          <p className='font-medium'>{provider.name}</p>
                          <p className='text-sm text-gray-600'>{provider.type}</p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-medium'>{provider.status}</p>
                        <p className='text-xs text-gray-600'>{provider.config.rateLimit}/min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {providers.slice(0, 5).map(provider => (
                    <div
                      key={provider.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div>
                        <p className='font-medium'>{provider.name}</p>
                        <p className='text-sm text-gray-600'>
                          {provider.usage.totalRequests.toLocaleString()} requests
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-medium'>
                          ${provider.usage.totalCost.toFixed(2)}
                        </p>
                        <p className='text-xs text-gray-600'>
                          {new Date(provider.usage.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
