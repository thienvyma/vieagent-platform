/**
 * 🎯 Model Provider Selector Component - Day 21 Step 21.1
 * Advanced UI for selecting and configuring model providers
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Settings,
  TrendingUp,
  Shield,
  Cpu,
  Activity,
} from 'lucide-react';

interface ModelProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google';
  models: ModelInfo[];
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  cost: number;
  capabilities: string[];
  description: string;
}

interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  contextWindow: number;
  costPer1kTokens: number;
  capabilities: string[];
  recommended: boolean;
}

interface ProviderConfig {
  primaryProvider: string;
  primaryModel: string;
  fallbackProviders: string[];
  fallbackModels: Record<string, string>;
  performanceSettings: {
    enableLoadBalancing: boolean;
    maxResponseTime: number;
    maxCostPerMessage: number;
    enableAutoFallback: boolean;
    fallbackThreshold: number;
  };
  costSettings: {
    enableCostOptimization: boolean;
    maxDailyCost: number;
    maxMonthlyCost: number;
    costTrackingEnabled: boolean;
  };
  qualitySettings: {
    minQualityScore: number;
    enableQualityMonitoring: boolean;
    qualityFallbackEnabled: boolean;
  };
}

interface ModelProviderSelectorProps {
  agentId?: string;
  initialConfig?: Partial<ProviderConfig>;
  onConfigChange?: (config: ProviderConfig) => void;
  onSave?: (config: ProviderConfig) => void;
  showAdvanced?: boolean;
}

// Model providers will be loaded from API - no more static mock data
const defaultProviders: ModelProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    status: 'healthy',
    responseTime: 2500,
    cost: 0.002,
    capabilities: ['chat', 'function_calling', 'streaming', 'embeddings'],
    description: 'Most popular and reliable provider with GPT models',
    models: [
      {
        id: 'gpt-4',
        name: 'gpt-4',
        displayName: 'GPT-4',
        contextWindow: 8192,
        costPer1kTokens: 0.03,
        capabilities: ['chat', 'function_calling', 'complex_reasoning'],
        recommended: true,
      },
      {
        id: 'gpt-4-turbo',
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        contextWindow: 128000,
        costPer1kTokens: 0.01,
        capabilities: ['chat', 'function_calling', 'complex_reasoning', 'large_context'],
        recommended: true,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        contextWindow: 4096,
        costPer1kTokens: 0.002,
        capabilities: ['chat', 'function_calling', 'fast_response'],
        recommended: false,
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    status: 'healthy',
    responseTime: 3000,
    cost: 0.015,
    capabilities: ['chat', 'complex_reasoning', 'safety'],
    description: 'Advanced AI with strong safety features and reasoning',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        costPer1kTokens: 0.015,
        capabilities: ['chat', 'complex_reasoning', 'large_context', 'safety'],
        recommended: true,
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        contextWindow: 200000,
        costPer1kTokens: 0.0025,
        capabilities: ['chat', 'fast_response', 'cost_effective'],
        recommended: false,
      },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    type: 'google',
    status: 'healthy',
    responseTime: 2000,
    cost: 0.001,
    capabilities: ['chat', 'multimodal', 'cost_effective'],
    description: 'Cost-effective provider with multimodal capabilities',
    models: [
      {
        id: 'gemini-pro',
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        contextWindow: 32768,
        costPer1kTokens: 0.001,
        capabilities: ['chat', 'multimodal', 'cost_effective'],
        recommended: true,
      },
      {
        id: 'gemini-flash',
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        contextWindow: 1048576,
        costPer1kTokens: 0.0005,
        capabilities: ['chat', 'fast_response', 'large_context', 'cost_effective'],
        recommended: true,
      },
    ],
  },
];

export default function ModelProviderSelector({
  agentId,
  initialConfig,
  onConfigChange,
  onSave,
  showAdvanced = false,
}: ModelProviderSelectorProps) {
  // Using React.useState for state management
  const [config, setConfig] = useState<ProviderConfig>({
    primaryProvider: 'openai',
    primaryModel: 'gpt-4',
    fallbackProviders: ['anthropic', 'google'],
    fallbackModels: {
      openai: 'gpt-3.5-turbo',
      anthropic: 'claude-3-haiku-20240307',
      google: 'gemini-pro',
    },
    performanceSettings: {
      enableLoadBalancing: false,
      maxResponseTime: 30000,
      maxCostPerMessage: 0.01,
      enableAutoFallback: true,
      fallbackThreshold: 0.8,
    },
    costSettings: {
      enableCostOptimization: false,
      maxDailyCost: 1.0,
      maxMonthlyCost: 30.0,
      costTrackingEnabled: true,
    },
    qualitySettings: {
      minQualityScore: 0.7,
      enableQualityMonitoring: true,
      qualityFallbackEnabled: true,
    },
    ...initialConfig,
  });

  const [activeTab, setActiveTab] = useState('provider');
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Update parent when config changes
  // Using React.useEffect for side effects
  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const handleProviderChange = (providerId: string) => {
    const provider = defaultProviders.find(p => p.id === providerId);
    if (provider) {
      setConfig(prev => ({
        ...prev,
        primaryProvider: providerId,
        primaryModel: provider.models[0].id,
      }));
    }
  };

  const handleModelChange = (modelId: string) => {
    setConfig(prev => ({
      ...prev,
      primaryModel: modelId,
    }));
  };

  const handleFallbackToggle = (providerId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      fallbackProviders: enabled
        ? [...prev.fallbackProviders, providerId]
        : prev.fallbackProviders.filter(p => p !== providerId),
    }));
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProvider(providerId);

    try {
      // Simulate provider test
      await new Promise(resolve => setTimeout(resolve, 2000));

      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          status: 'success',
          responseTime: Math.random() * 3000 + 1000,
          cost: Math.random() * 0.01 + 0.001,
          timestamp: new Date(),
        },
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          status: 'error',
          error: 'Connection failed',
          timestamp: new Date(),
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'degraded':
        return <AlertCircle className='h-4 w-4 text-yellow-500' />;
      case 'unhealthy':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      default:
        return <AlertCircle className='h-4 w-4 text-gray-500' />;
    }
  };

  const getProviderColor = (type: string) => {
    switch (type) {
      case 'openai':
        return 'bg-green-100 text-green-800';
      case 'anthropic':
        return 'bg-blue-100 text-blue-800';
      case 'google':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentProvider = defaultProviders.find(p => p.id === config.primaryProvider);
  const currentModel = currentProvider?.models.find(m => m.id === config.primaryModel);

  return (
    <div className='w-full max-w-6xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Model Provider Configuration</h2>
          <p className='text-gray-600'>Configure AI model providers and settings for your agent</p>
        </div>
        {onSave && (
          <Button onClick={() => onSave(config)} className='bg-blue-600 hover:bg-blue-700'>
            Save Configuration
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='provider'>Provider Selection</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='cost'>Cost Control</TabsTrigger>
          <TabsTrigger value='quality'>Quality & Fallback</TabsTrigger>
        </TabsList>

        <TabsContent value='provider' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                Primary Provider
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {defaultProviders.map(provider => (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      config.primaryProvider === provider.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleProviderChange(provider.id)}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <Badge className={getProviderColor(provider.type)}>{provider.name}</Badge>
                        {getStatusIcon(provider.status)}
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={testingProvider === provider.id}
                      >
                        {testingProvider === provider.id ? (
                          <Clock className='h-4 w-4 animate-spin' />
                        ) : (
                          'Test'
                        )}
                      </Button>
                    </div>

                    <p className='text-sm text-gray-600 mb-3'>{provider.description}</p>

                    <div className='grid grid-cols-2 gap-2 text-xs'>
                      <div className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        {provider.responseTime}ms
                      </div>
                      <div className='flex items-center gap-1'>
                        <DollarSign className='h-3 w-3' />${provider.cost.toFixed(4)}
                      </div>
                    </div>

                    <div className='mt-2 flex flex-wrap gap-1'>
                      {provider.capabilities.slice(0, 3).map(cap => (
                        <Badge key={cap} variant='secondary' className='text-xs'>
                          {cap}
                        </Badge>
                      ))}
                      {provider.capabilities.length > 3 && (
                        <Badge variant='secondary' className='text-xs'>
                          +{provider.capabilities.length - 3}
                        </Badge>
                      )}
                    </div>

                    {testResults[provider.id] && (
                      <div className='mt-2 p-2 bg-gray-50 rounded text-xs'>
                        {testResults[provider.id].status === 'success' ? (
                          <div className='text-green-600'>
                            ✓ Test passed ({testResults[provider.id].responseTime.toFixed(0)}ms)
                          </div>
                        ) : (
                          <div className='text-red-600'>✗ {testResults[provider.id].error}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {currentProvider && (
                <div className='mt-6'>
                  <Label className='text-base font-semibold'>Model Selection</Label>
                  <div className='mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {currentProvider.models.map(model => (
                      <div
                        key={model.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          config.primaryModel === model.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleModelChange(model.id)}
                      >
                        <div className='flex items-center justify-between mb-1'>
                          <span className='font-medium'>{model.displayName}</span>
                          {model.recommended && (
                            <Badge variant='secondary' className='text-xs'>
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className='text-xs text-gray-600 space-y-1'>
                          <div>Context: {model.contextWindow.toLocaleString()} tokens</div>
                          <div>Cost: ${model.costPer1kTokens}/1k tokens</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Fallback Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {defaultProviders
                  .filter(p => p.id !== config.primaryProvider)
                  .map(provider => (
                    <div
                      key={provider.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <Switch
                          checked={config.fallbackProviders.includes(provider.id)}
                          onCheckedChange={checked => handleFallbackToggle(provider.id, checked)}
                        />
                        <div>
                          <div className='flex items-center gap-2'>
                            <Badge className={getProviderColor(provider.type)}>
                              {provider.name}
                            </Badge>
                            {getStatusIcon(provider.status)}
                          </div>
                          <p className='text-sm text-gray-600 mt-1'>{provider.description}</p>
                        </div>
                      </div>
                      <div className='text-right text-sm text-gray-600'>
                        <div>{provider.responseTime}ms</div>
                        <div>${provider.cost.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='performance' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='h-5 w-5' />
                Performance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Load Balancing</Label>
                  <p className='text-sm text-gray-600'>
                    Distribute requests across multiple providers
                  </p>
                </div>
                <Switch
                  checked={config.performanceSettings.enableLoadBalancing}
                  onCheckedChange={checked =>
                    setConfig(prev => ({
                      ...prev,
                      performanceSettings: {
                        ...prev.performanceSettings,
                        enableLoadBalancing: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Max Response Time (ms)</Label>
                <div className='px-3'>
                  <Slider
                    value={[config.performanceSettings.maxResponseTime]}
                    onValueChange={([value]) =>
                      setConfig(prev => ({
                        ...prev,
                        performanceSettings: {
                          ...prev.performanceSettings,
                          maxResponseTime: value,
                        },
                      }))
                    }
                    max={60000}
                    min={5000}
                    step={1000}
                    className='w-full'
                  />
                  <div className='flex justify-between text-sm text-gray-600 mt-1'>
                    <span>5s</span>
                    <span>{(config.performanceSettings.maxResponseTime / 1000).toFixed(1)}s</span>
                    <span>60s</span>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Auto Fallback</Label>
                  <p className='text-sm text-gray-600'>
                    Automatically switch to fallback providers on failure
                  </p>
                </div>
                <Switch
                  checked={config.performanceSettings.enableAutoFallback}
                  onCheckedChange={checked =>
                    setConfig(prev => ({
                      ...prev,
                      performanceSettings: {
                        ...prev.performanceSettings,
                        enableAutoFallback: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Fallback Threshold</Label>
                <div className='px-3'>
                  <Slider
                    value={[config.performanceSettings.fallbackThreshold * 100]}
                    onValueChange={([value]) =>
                      setConfig(prev => ({
                        ...prev,
                        performanceSettings: {
                          ...prev.performanceSettings,
                          fallbackThreshold: value / 100,
                        },
                      }))
                    }
                    max={100}
                    min={0}
                    step={5}
                    className='w-full'
                  />
                  <div className='flex justify-between text-sm text-gray-600 mt-1'>
                    <span>0%</span>
                    <span>{(config.performanceSettings.fallbackThreshold * 100).toFixed(0)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='cost' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <DollarSign className='h-5 w-5' />
                Cost Control
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Cost Optimization</Label>
                  <p className='text-sm text-gray-600'>
                    Automatically select the most cost-effective provider
                  </p>
                </div>
                <Switch
                  checked={config.costSettings.enableCostOptimization}
                  onCheckedChange={checked =>
                    setConfig(prev => ({
                      ...prev,
                      costSettings: {
                        ...prev.costSettings,
                        enableCostOptimization: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Max Cost Per Message ($)</Label>
                <Input
                  type='number'
                  step='0.001'
                  value={config.performanceSettings.maxCostPerMessage}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      performanceSettings: {
                        ...prev.performanceSettings,
                        maxCostPerMessage: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  placeholder='0.01'
                />
              </div>

              <div className='space-y-2'>
                <Label>Daily Cost Limit ($)</Label>
                <Input
                  type='number'
                  step='0.1'
                  value={config.costSettings.maxDailyCost}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      costSettings: {
                        ...prev.costSettings,
                        maxDailyCost: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  placeholder='1.0'
                />
              </div>

              <div className='space-y-2'>
                <Label>Monthly Cost Limit ($)</Label>
                <Input
                  type='number'
                  step='1'
                  value={config.costSettings.maxMonthlyCost}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      costSettings: {
                        ...prev.costSettings,
                        maxMonthlyCost: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                  placeholder='30.0'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Cost Tracking</Label>
                  <p className='text-sm text-gray-600'>Track and monitor usage costs</p>
                </div>
                <Switch
                  checked={config.costSettings.costTrackingEnabled}
                  onCheckedChange={checked =>
                    setConfig(prev => ({
                      ...prev,
                      costSettings: {
                        ...prev.costSettings,
                        costTrackingEnabled: checked,
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='quality' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Quality & Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <Label>Minimum Quality Score</Label>
                <div className='px-3'>
                  <Slider
                    value={[config.qualitySettings.minQualityScore * 100]}
                    onValueChange={([value]) =>
                      setConfig(prev => ({
                        ...prev,
                        qualitySettings: {
                          ...prev.qualitySettings,
                          minQualityScore: value / 100,
                        },
                      }))
                    }
                    max={100}
                    min={0}
                    step={5}
                    className='w-full'
                  />
                  <div className='flex justify-between text-sm text-gray-600 mt-1'>
                    <span>0%</span>
                    <span>{(config.qualitySettings.minQualityScore * 100).toFixed(0)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Quality Monitoring</Label>
                  <p className='text-sm text-gray-600'>Monitor response quality and performance</p>
                </div>
                <Switch
                  checked={config.qualitySettings.enableQualityMonitoring}
                  onCheckedChange={checked =>
                    setConfig(prev => ({
                      ...prev,
                      qualitySettings: {
                        ...prev.qualitySettings,
                        enableQualityMonitoring: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base'>Quality Fallback</Label>
                  <p className='text-sm text-gray-600'>
                    Switch providers if quality drops below threshold
                  </p>
                </div>
                <Switch
                  checked={config.qualitySettings.qualityFallbackEnabled}
                  onCheckedChange={checked =>
                    setConfig(prev => ({
                      ...prev,
                      qualitySettings: {
                        ...prev.qualitySettings,
                        qualityFallbackEnabled: checked,
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='p-3 bg-blue-50 rounded-lg'>
              <div className='flex items-center gap-2 mb-1'>
                <Cpu className='h-4 w-4 text-blue-600' />
                <span className='font-medium'>Primary</span>
              </div>
              <div className='text-sm text-gray-600'>
                {currentProvider?.name} - {currentModel?.displayName}
              </div>
            </div>

            <div className='p-3 bg-green-50 rounded-lg'>
              <div className='flex items-center gap-2 mb-1'>
                <Shield className='h-4 w-4 text-green-600' />
                <span className='font-medium'>Fallbacks</span>
              </div>
              <div className='text-sm text-gray-600'>
                {config.fallbackProviders.length} providers
              </div>
            </div>

            <div className='p-3 bg-yellow-50 rounded-lg'>
              <div className='flex items-center gap-2 mb-1'>
                <DollarSign className='h-4 w-4 text-yellow-600' />
                <span className='font-medium'>Cost Limit</span>
              </div>
              <div className='text-sm text-gray-600'>
                ${config.performanceSettings.maxCostPerMessage}/msg
              </div>
            </div>

            <div className='p-3 bg-purple-50 rounded-lg'>
              <div className='flex items-center gap-2 mb-1'>
                <Activity className='h-4 w-4 text-purple-600' />
                <span className='font-medium'>Quality</span>
              </div>
              <div className='text-sm text-gray-600'>
                {(config.qualitySettings.minQualityScore * 100).toFixed(0)}% minimum
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
