'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Download,
  Upload,
  Copy,
  Trash2,
  Play,
  Pause,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Package,
  Rocket,
  Database,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Share2,
  Archive,
  Zap,
  Target,
  Clock,
  Globe,
  Lock,
  Unlock,
  GitBranch,
  GitCommit,
  GitMerge,
  Layers,
  Box,
  Truck,
  CheckSquare,
  Square,
  Minus,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  isPublic: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  knowledgeSourcesCount: number;
  conversationsCount: number;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  deploymentStatus: 'deployed' | 'staging' | 'development' | 'archived';
  tags: string[];
  owner: string;
  collaborators: string[];
  cost: number;
  performance: number;
}

interface BulkOperation {
  id: string;
  type:
    | 'activate'
    | 'deactivate'
    | 'delete'
    | 'export'
    | 'deploy'
    | 'archive'
    | 'duplicate'
    | 'update';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

interface BulkOperationResult {
  success: boolean;
  agentId: string;
  agentName: string;
  error?: string;
  details?: string;
}

interface DeploymentConfig {
  environment: 'production' | 'staging' | 'development';
  region: string;
  scaling: 'auto' | 'manual';
  replicas: number;
  resources: {
    cpu: string;
    memory: string;
  };
  healthCheck: boolean;
  monitoring: boolean;
}

interface ImportExportConfig {
  format: 'json' | 'csv' | 'yaml';
  includeKnowledge: boolean;
  includeConversations: boolean;
  includeMetrics: boolean;
  compression: boolean;
}

interface BatchUpdateSettings {
  model: string;
  temperature: string;
  maxTokens: string;
  status: string;
  category: string;
  tags: string;
  isPublic: string;
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'activate',
    type: 'activate',
    name: 'Activate Agents',
    description: 'Start selected agents',
    icon: <Play className='w-4 h-4' />,
    color: 'bg-green-500',
    requiresConfirmation: false,
  },
  {
    id: 'deactivate',
    type: 'deactivate',
    name: 'Deactivate Agents',
    description: 'Stop selected agents',
    icon: <Pause className='w-4 h-4' />,
    color: 'bg-yellow-500',
    requiresConfirmation: false,
  },
  {
    id: 'delete',
    type: 'delete',
    name: 'Delete Agents',
    description: 'Permanently remove selected agents',
    icon: <Trash2 className='w-4 h-4' />,
    color: 'bg-red-500',
    requiresConfirmation: true,
    confirmationMessage:
      'This action cannot be undone. All agent data, conversations, and knowledge will be permanently deleted.',
  },
  {
    id: 'duplicate',
    type: 'duplicate',
    name: 'Duplicate Agents',
    description: 'Create copies of selected agents',
    icon: <Copy className='w-4 h-4' />,
    color: 'bg-blue-500',
    requiresConfirmation: false,
  },
  {
    id: 'archive',
    type: 'archive',
    name: 'Archive Agents',
    description: 'Move selected agents to archive',
    icon: <Archive className='w-4 h-4' />,
    color: 'bg-gray-500',
    requiresConfirmation: false,
  },
  {
    id: 'deploy',
    type: 'deploy',
    name: 'Deploy Agents',
    description: 'Deploy selected agents to production',
    icon: <Rocket className='w-4 h-4' />,
    color: 'bg-purple-500',
    requiresConfirmation: true,
    confirmationMessage: 'Deploy selected agents to production environment?',
  },
  {
    id: 'export',
    type: 'export',
    name: 'Export Agents',
    description: 'Export selected agents data',
    icon: <Download className='w-4 h-4' />,
    color: 'bg-indigo-500',
    requiresConfirmation: false,
  },
  {
    id: 'update',
    type: 'update',
    name: 'Batch Update',
    description: 'Update common settings for selected agents',
    icon: <Settings className='w-4 h-4' />,
    color: 'bg-orange-500',
    requiresConfirmation: false,
  },
];

export default function BulkAgentOperations() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('operations');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [pendingOperation, setPendingOperation] = useState<BulkOperation | null>(null);
  const [operationResults, setOperationResults] = useState<BulkOperationResult[]>([]);
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    environment: 'staging',
    region: 'us-east-1',
    scaling: 'auto',
    replicas: 1,
    resources: {
      cpu: '0.5',
      memory: '1Gi',
    },
    healthCheck: true,
    monitoring: true,
  });
  const [importExportConfig, setImportExportConfig] = useState<ImportExportConfig>({
    format: 'json',
    includeKnowledge: true,
    includeConversations: false,
    includeMetrics: true,
    compression: true,
  });
  const [batchUpdateSettings, setBatchUpdateSettings] = useState<BatchUpdateSettings>({
    model: '',
    temperature: '',
    maxTokens: '',
    status: '',
    category: '',
    tags: '',
    isPublic: '',
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents');
      const data = await response.json();

      // Transform data to match our interface
      // API agents trả về array trực tiếp, không có wrapper data
      const transformedAgents = (Array.isArray(data) ? data : []).map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description || '',
        category: agent.category || 'general',
        status: agent.status?.toLowerCase() || 'inactive',
        isPublic: agent.isPublic || false,
        model: agent.model || 'gpt-3.5-turbo',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 1000,
        knowledgeSourcesCount: agent.knowledgeFiles?.length || 0,
        conversationsCount: agent._count?.conversations || 0,
        lastActive: agent.updatedAt || agent.createdAt,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt || agent.createdAt,
        version: '1.0.0',
        deploymentStatus: (agent.status === 'ACTIVE' ? 'deployed' : 'development') as 'deployed' | 'staging' | 'development' | 'archived',
        tags: agent.tags || [],
        owner: 'current-user',
        collaborators: [],
        cost: 0, // Will be calculated from actual usage data
        performance: 0, // Will be calculated from actual metrics
      }));

      setAgents(transformedAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      // Production: Show empty state instead of mock data
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  // Mock agent generator removed - all data now comes from API

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || agent.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [agents, searchTerm, filterStatus, filterCategory]);

  const handleSelectAgent = useCallback((agentId: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgents(newSelected);
  }, [selectedAgents]);

  const handleSelectAll = useCallback(() => {
    if (selectedAgents.size === filteredAgents.length) {
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(filteredAgents.map(agent => agent.id)));
    }
  }, [selectedAgents.size, filteredAgents]);

  const handleBulkOperation = useCallback(async (operation: BulkOperation) => {
    if (selectedAgents.size === 0) {
      alert('Please select at least one agent');
      return;
    }

    if (operation.requiresConfirmation) {
      setPendingOperation(operation);
      setShowConfirmation(true);
      return;
    }

    await executeBulkOperation(operation);
  }, [selectedAgents.size]);

  const executeBulkOperation = async (operation: BulkOperation) => {
    setProcessing(true);
    setOperationResults([]);

    try {
      const results: BulkOperationResult[] = [];
      const selectedAgentsList = Array.from(selectedAgents);

      for (const agentId of selectedAgentsList) {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) continue;

        try {
          let success = false;
          let details = '';

          switch (operation.type) {
            case 'activate':
              success = await activateAgent(agentId);
              details = 'Agent activated successfully';
              break;
            case 'deactivate':
              success = await deactivateAgent(agentId);
              details = 'Agent deactivated successfully';
              break;
            case 'delete':
              success = await deleteAgent(agentId);
              details = 'Agent deleted successfully';
              break;
            case 'duplicate':
              success = await duplicateAgent(agentId);
              details = 'Agent duplicated successfully';
              break;
            case 'archive':
              success = await archiveAgent(agentId);
              details = 'Agent archived successfully';
              break;
            case 'deploy':
              success = await deployAgent(agentId, deploymentConfig);
              details = `Agent deployed to ${deploymentConfig.environment}`;
              break;
            case 'export':
              success = await exportAgent(agentId, importExportConfig);
              details = 'Agent exported successfully';
              break;
            case 'update':
              success = await updateAgent(agentId, batchUpdateSettings);
              details = 'Agent updated successfully';
              break;
          }

          results.push({
            success,
            agentId,
            agentName: agent.name,
            details,
          });
        } catch (error) {
          results.push({
            success: false,
            agentId,
            agentName: agent.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setOperationResults(results);

      // Refresh agents list
      await loadAgents();

      // Clear selection
      setSelectedAgents(new Set());
    } catch (error) {
      console.error('Bulk operation error:', error);
      alert('Error executing bulk operation');
    } finally {
      setProcessing(false);
      setShowConfirmation(false);
      setPendingOperation(null);
    }
  };

  // Individual operation functions
  const activateAgent = async (agentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error activating agent:', error);
      return false;
    }
  };

  const deactivateAgent = async (agentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deactivating agent:', error);
      return false;
    }
  };

  const deleteAgent = async (agentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting agent:', error);
      return false;
    }
  };

  const duplicateAgent = async (agentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${agentId}/duplicate`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error duplicating agent:', error);
      return false;
    }
  };

  const archiveAgent = async (agentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${agentId}/archive`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error archiving agent:', error);
      return false;
    }
  };

  const deployAgent = async (agentId: string, config: DeploymentConfig): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${agentId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deploying agent:', error);
      return false;
    }
  };

  const exportAgent = async (agentId: string, config: ImportExportConfig): Promise<boolean> => {
    try {
      const response = await fetch(`/api/agents/${agentId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-${agentId}.${config.format}`;
        a.click();
        URL.revokeObjectURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error exporting agent:', error);
      return false;
    }
  };

  const updateAgent = async (agentId: string, settings: BatchUpdateSettings): Promise<boolean> => {
    try {
      const updateData: any = {};

      if (settings.model) updateData.model = settings.model;
      if (settings.temperature) updateData.temperature = parseFloat(settings.temperature);
      if (settings.maxTokens) updateData.maxTokens = parseInt(settings.maxTokens);
      if (settings.status) updateData.status = settings.status;
      if (settings.category) updateData.category = settings.category;
      if (settings.isPublic !== '') updateData.isPublic = settings.isPublic === 'true';

      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating agent:', error);
      return false;
    }
  };

  const handleImportAgents = async (file: File) => {
    try {
      setProcessing(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/agents/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadAgents();
        alert('Agents imported successfully');
      } else {
        alert('Error importing agents');
      }
    } catch (error) {
      console.error('Error importing agents:', error);
      alert('Error importing agents');
    } finally {
      setProcessing(false);
    }
  };

  const exportAllAgents = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/agents/export-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importExportConfig),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-agents.${importExportConfig.format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Error exporting agents');
      }
    } catch (error) {
      console.error('Error exporting agents:', error);
      alert('Error exporting agents');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'training':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeploymentStatusColor = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-100 text-green-800';
      case 'staging':
        return 'bg-blue-100 text-blue-800';
      case 'development':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSelectionState = () => {
    if (selectedAgents.size === 0) return 'none';
    if (selectedAgents.size === filteredAgents.length) return 'all';
    return 'partial';
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='flex items-center space-x-2'>
          <RefreshCw className='w-6 h-6 animate-spin' />
          <span>Loading agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Bulk Agent Operations</h1>
          <p className='text-gray-600'>Manage multiple agents efficiently with batch operations</p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='secondary'>{selectedAgents.size} selected</Badge>
          <Button variant='outline' size='sm' onClick={loadAgents} disabled={processing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='flex flex-wrap gap-4'>
        <div className='flex-1 min-w-64'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='Search agents...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='inactive'>Inactive</SelectItem>
            <SelectItem value='training'>Training</SelectItem>
            <SelectItem value='error'>Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            <SelectItem value='support'>Support</SelectItem>
            <SelectItem value='sales'>Sales</SelectItem>
            <SelectItem value='marketing'>Marketing</SelectItem>
            <SelectItem value='technical'>Technical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='operations'>Bulk Operations</TabsTrigger>
          <TabsTrigger value='deployment'>Deployment</TabsTrigger>
          <TabsTrigger value='import-export'>Import/Export</TabsTrigger>
          <TabsTrigger value='results'>Results</TabsTrigger>
        </TabsList>

        {/* Bulk Operations Tab */}
        <TabsContent value='operations' className='space-y-6'>
          {/* Selection Controls */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckSquare className='w-5 h-5' />
                Selection Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleSelectAll}
                  className='flex items-center gap-2'
                >
                  {getSelectionState() === 'all' ? (
                    <>
                      <CheckSquare className='w-4 h-4' />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className='w-4 h-4' />
                      Select All
                    </>
                  )}
                </Button>
                <span className='text-sm text-gray-600'>
                  {selectedAgents.size} of {filteredAgents.length} agents selected
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Operations */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='w-5 h-5' />
                Bulk Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {BULK_OPERATIONS.map(operation => (
                  <Button
                    key={operation.id}
                    variant='outline'
                    className='h-auto p-4 flex flex-col items-center gap-2'
                    onClick={() => handleBulkOperation(operation)}
                    disabled={processing || selectedAgents.size === 0}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${operation.color} flex items-center justify-center text-white`}
                    >
                      {operation.icon}
                    </div>
                    <div className='text-center'>
                      <div className='font-medium text-sm'>{operation.name}</div>
                      <div className='text-xs text-gray-500'>{operation.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Batch Update Settings */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='w-5 h-5' />
                Batch Update Settings
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Model</label>
                  <Select
                    value={batchUpdateSettings.model}
                    onValueChange={value =>
                      setBatchUpdateSettings(prev => ({ ...prev, model: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select model' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>No change</SelectItem>
                      <SelectItem value='gpt-4'>GPT-4</SelectItem>
                      <SelectItem value='gpt-3.5-turbo'>GPT-3.5 Turbo</SelectItem>
                      <SelectItem value='claude-3'>Claude 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Temperature</label>
                  <Input
                    type='number'
                    min='0'
                    max='2'
                    step='0.1'
                    placeholder='0.7'
                    value={batchUpdateSettings.temperature}
                    onChange={e =>
                      setBatchUpdateSettings(prev => ({ ...prev, temperature: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Max Tokens</label>
                  <Input
                    type='number'
                    min='1'
                    max='4000'
                    placeholder='1000'
                    value={batchUpdateSettings.maxTokens}
                    onChange={e =>
                      setBatchUpdateSettings(prev => ({ ...prev, maxTokens: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Status</label>
                  <Select
                    value={batchUpdateSettings.status}
                    onValueChange={value =>
                      setBatchUpdateSettings(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>No change</SelectItem>
                      <SelectItem value='ACTIVE'>Active</SelectItem>
                      <SelectItem value='INACTIVE'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Category</label>
                  <Select
                    value={batchUpdateSettings.category}
                    onValueChange={value =>
                      setBatchUpdateSettings(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>No change</SelectItem>
                      <SelectItem value='support'>Support</SelectItem>
                      <SelectItem value='sales'>Sales</SelectItem>
                      <SelectItem value='marketing'>Marketing</SelectItem>
                      <SelectItem value='technical'>Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Public</label>
                  <Select
                    value={batchUpdateSettings.isPublic}
                    onValueChange={value =>
                      setBatchUpdateSettings(prev => ({ ...prev, isPublic: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select visibility' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=''>No change</SelectItem>
                      <SelectItem value='true'>Public</SelectItem>
                      <SelectItem value='false'>Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agents List */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='w-5 h-5' />
                Agents ({filteredAgents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {filteredAgents.map(agent => (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      selectedAgents.has(agent.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={selectedAgents.has(agent.id)}
                      onCheckedChange={() => handleSelectAgent(agent.id)}
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <h3 className='font-medium'>{agent.name}</h3>
                        <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                        <Badge className={getDeploymentStatusColor(agent.deploymentStatus)}>
                          {agent.deploymentStatus}
                        </Badge>
                        {agent.isPublic && (
                          <Badge variant='outline'>
                            <Globe className='w-3 h-3 mr-1' />
                            Public
                          </Badge>
                        )}
                      </div>
                      <div className='text-sm text-gray-600 mt-1'>{agent.description}</div>
                      <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                        <span>Model: {agent.model}</span>
                        <span>Conversations: {agent.conversationsCount}</span>
                        <span>Knowledge: {agent.knowledgeSourcesCount}</span>
                        <span>Performance: {agent.performance.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='ghost' size='sm'>
                        <Eye className='w-4 h-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value='deployment' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Rocket className='w-5 h-5' />
                Deployment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Environment</label>
                  <Select
                    value={deploymentConfig.environment}
                    onValueChange={(value: any) =>
                      setDeploymentConfig(prev => ({ ...prev, environment: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='development'>Development</SelectItem>
                      <SelectItem value='staging'>Staging</SelectItem>
                      <SelectItem value='production'>Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Region</label>
                  <Select
                    value={deploymentConfig.region}
                    onValueChange={value =>
                      setDeploymentConfig(prev => ({ ...prev, region: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='us-east-1'>US East (N. Virginia)</SelectItem>
                      <SelectItem value='us-west-2'>US West (Oregon)</SelectItem>
                      <SelectItem value='eu-west-1'>Europe (Ireland)</SelectItem>
                      <SelectItem value='ap-southeast-1'>Asia Pacific (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Scaling</label>
                  <Select
                    value={deploymentConfig.scaling}
                    onValueChange={(value: any) =>
                      setDeploymentConfig(prev => ({ ...prev, scaling: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='auto'>Auto Scaling</SelectItem>
                      <SelectItem value='manual'>Manual Scaling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Replicas</label>
                  <Input
                    type='number'
                    min='1'
                    max='10'
                    value={deploymentConfig.replicas}
                    onChange={e =>
                      setDeploymentConfig(prev => ({ ...prev, replicas: parseInt(e.target.value) }))
                    }
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>CPU</label>
                  <Select
                    value={deploymentConfig.resources.cpu}
                    onValueChange={value =>
                      setDeploymentConfig(prev => ({
                        ...prev,
                        resources: { ...prev.resources, cpu: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0.25'>0.25 vCPU</SelectItem>
                      <SelectItem value='0.5'>0.5 vCPU</SelectItem>
                      <SelectItem value='1'>1 vCPU</SelectItem>
                      <SelectItem value='2'>2 vCPU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Memory</label>
                  <Select
                    value={deploymentConfig.resources.memory}
                    onValueChange={value =>
                      setDeploymentConfig(prev => ({
                        ...prev,
                        resources: { ...prev.resources, memory: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0.5Gi'>0.5 GB</SelectItem>
                      <SelectItem value='1Gi'>1 GB</SelectItem>
                      <SelectItem value='2Gi'>2 GB</SelectItem>
                      <SelectItem value='4Gi'>4 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='flex items-center gap-4'>
                <label className='flex items-center gap-2'>
                  <Checkbox
                    checked={deploymentConfig.healthCheck}
                    onCheckedChange={checked =>
                      setDeploymentConfig(prev => ({ ...prev, healthCheck: !!checked }))
                    }
                  />
                  <span className='text-sm'>Enable Health Checks</span>
                </label>
                <label className='flex items-center gap-2'>
                  <Checkbox
                    checked={deploymentConfig.monitoring}
                    onCheckedChange={checked =>
                      setDeploymentConfig(prev => ({ ...prev, monitoring: !!checked }))
                    }
                  />
                  <span className='text-sm'>Enable Monitoring</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value='import-export' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Import */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Upload className='w-5 h-5' />
                  Import Agents
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>File Format</label>
                  <Select
                    value={importExportConfig.format}
                    onValueChange={(value: any) =>
                      setImportExportConfig(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='json'>JSON</SelectItem>
                      <SelectItem value='csv'>CSV</SelectItem>
                      <SelectItem value='yaml'>YAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <input
                    type='file'
                    accept='.json,.csv,.yaml,.yml'
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImportAgents(file);
                      }
                    }}
                    className='w-full p-2 border rounded'
                  />
                </div>
                <div className='text-sm text-gray-600'>
                  Upload a file containing agent configurations to import multiple agents at once.
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Download className='w-5 h-5' />
                  Export Agents
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>Export Format</label>
                  <Select
                    value={importExportConfig.format}
                    onValueChange={(value: any) =>
                      setImportExportConfig(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='json'>JSON</SelectItem>
                      <SelectItem value='csv'>CSV</SelectItem>
                      <SelectItem value='yaml'>YAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <label className='flex items-center gap-2'>
                    <Checkbox
                      checked={importExportConfig.includeKnowledge}
                      onCheckedChange={checked =>
                        setImportExportConfig(prev => ({ ...prev, includeKnowledge: !!checked }))
                      }
                    />
                    <span className='text-sm'>Include Knowledge Base</span>
                  </label>
                  <label className='flex items-center gap-2'>
                    <Checkbox
                      checked={importExportConfig.includeConversations}
                      onCheckedChange={checked =>
                        setImportExportConfig(prev => ({
                          ...prev,
                          includeConversations: !!checked,
                        }))
                      }
                    />
                    <span className='text-sm'>Include Conversations</span>
                  </label>
                  <label className='flex items-center gap-2'>
                    <Checkbox
                      checked={importExportConfig.includeMetrics}
                      onCheckedChange={checked =>
                        setImportExportConfig(prev => ({ ...prev, includeMetrics: !!checked }))
                      }
                    />
                    <span className='text-sm'>Include Metrics</span>
                  </label>
                  <label className='flex items-center gap-2'>
                    <Checkbox
                      checked={importExportConfig.compression}
                      onCheckedChange={checked =>
                        setImportExportConfig(prev => ({ ...prev, compression: !!checked }))
                      }
                    />
                    <span className='text-sm'>Enable Compression</span>
                  </label>
                </div>
                <Button onClick={exportAllAgents} disabled={processing} className='w-full'>
                  <Download className='w-4 h-4 mr-2' />
                  Export All Agents
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value='results' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='w-5 h-5' />
                Operation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {operationResults.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  No operation results yet. Perform a bulk operation to see results here.
                </div>
              ) : (
                <div className='space-y-2'>
                  {operationResults.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className='flex-shrink-0'>
                        {result.success ? (
                          <CheckCircle className='w-5 h-5 text-green-600' />
                        ) : (
                          <XCircle className='w-5 h-5 text-red-600' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='font-medium'>{result.agentName}</div>
                        <div className='text-sm text-gray-600'>
                          {result.success ? result.details : result.error}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-4'>
              <div
                className={`w-12 h-12 rounded-full ${pendingOperation?.color} flex items-center justify-center text-white`}
              >
                {pendingOperation?.icon}
              </div>
              <div>
                <div className='text-lg font-semibold'>{pendingOperation?.name}</div>
                <div className='text-sm text-gray-600'>{selectedAgents.size} agents selected</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <p className='text-gray-700'>{pendingOperation?.confirmationMessage}</p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowConfirmation(false);
                setPendingOperation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => pendingOperation && executeBulkOperation(pendingOperation)}
              disabled={processing}
              className={pendingOperation?.color}
            >
              {processing ? (
                <>
                  <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  {pendingOperation?.icon}
                  <span className='ml-2'>Confirm</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Processing Overlay */}
      {processing && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 flex items-center gap-4'>
            <RefreshCw className='w-6 h-6 animate-spin text-blue-600' />
            <span className='text-lg'>Processing bulk operation...</span>
          </div>
        </div>
      )}
    </div>
  );
}
