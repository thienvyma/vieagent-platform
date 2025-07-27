/**
 * 🧙‍♂️ Agent Configuration Wizard Steps - DAY 28 Step 28.1
 * Individual step components for the Advanced Agent Configuration Wizard
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { EnableSwitchContainer } from '@/components/ui/enable-switch-container';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Database,
  Globe,
  Settings,
  Shield,
  Activity,
  Eye,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  Plus,
  X,
  FileText,
  Users,
  Clock,
  DollarSign,
  Cpu,
  Cloud,
  MessageSquare,
  User,
} from 'lucide-react';

import type { AgentConfigurationData } from './AgentConfigurationWizard';

// =============================================================================
// BASIC INFORMATION STEP
// =============================================================================

export const BasicInformationStep: React.FC<{
  data: AgentConfigurationData;
  onChange: (data: Partial<AgentConfigurationData>) => void;
}> = ({ data, onChange }) => {
  const [tags, setTags] = useState<string[]>(data.basicInfo.tags || []);
  const [newTag, setNewTag] = useState('');

  // 🔧 Fixed: Use useCallback for input handlers to prevent focus loss
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        basicInfo: { ...data.basicInfo, name: e.target.value },
      });
    },
    [data.basicInfo, onChange]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      onChange({
        basicInfo: { ...data.basicInfo, category: value },
      });
    },
    [data.basicInfo, onChange]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({
        basicInfo: { ...data.basicInfo, description: e.target.value },
      });
    },
    [data.basicInfo, onChange]
  );

  const handlePublicChange = useCallback(
    (checked: boolean) => {
      onChange({
        basicInfo: { ...data.basicInfo, isPublic: checked },
      });
    },
    [data.basicInfo, onChange]
  );

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      onChange({
        basicInfo: {
          ...data.basicInfo,
          tags: updatedTags,
        },
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    onChange({
      basicInfo: {
        ...data.basicInfo,
        tags: updatedTags,
      },
    });
  };

  const categories = [
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'customer_service', name: 'Customer Service', icon: '🎧' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'technology', name: 'Technology', icon: '🔧' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'research', name: 'Research', icon: '🔬' },
    { id: 'personal', name: 'Personal', icon: '👤' },
  ];

  return (
    <div className='space-y-8'>
      {/* Enhanced Header */}
      <div className='text-center bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-2xl p-6 border border-blue-500/20'>
        <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <FileText className='w-8 h-8 text-white' />
        </div>
        <h2 className='text-2xl font-bold text-white mb-2'>Basic Information</h2>
        <p className='text-gray-400'>Tell us about your agent's purpose and identity</p>
      </div>

      {/* Enhanced Form Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Enhanced Agent Name */}
        <div className='space-y-3'>
          <Label htmlFor='agent-name' className='text-white font-medium flex items-center space-x-2'>
            <User className='w-4 h-4 text-blue-400' />
            <span>Agent Name *</span>
          </Label>
          <div className='relative'>
            <Input
              id='agent-name'
              placeholder='e.g., Customer Support Assistant'
              value={data.basicInfo.name}
              onChange={handleNameChange}
              className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 pl-4 pr-4 py-3 rounded-xl'
            />
            <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-600/5 pointer-events-none'></div>
          </div>
          <p className='text-xs text-gray-400 flex items-center space-x-1'>
            <Info className='w-3 h-3' />
            <span>Choose a clear, descriptive name for your agent</span>
          </p>
        </div>

        {/* Enhanced Category */}
        <div className='space-y-3'>
          <Label htmlFor='category' className='text-white font-medium flex items-center space-x-2'>
            <Target className='w-4 h-4 text-purple-400' />
            <span>Category *</span>
          </Label>
          <Select value={data.basicInfo.category} onValueChange={handleCategoryChange}>
            <SelectTrigger className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'>
              <SelectValue placeholder='Select a category' />
            </SelectTrigger>
            <SelectContent className='bg-gray-800 border-gray-600 rounded-xl'>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id} className='text-white hover:bg-gray-700 rounded-lg'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-lg'>{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Description */}
      <div className='space-y-3'>
        <Label htmlFor='description' className='text-white font-medium flex items-center space-x-2'>
          <MessageSquare className='w-4 h-4 text-green-400' />
          <span>Description *</span>
        </Label>
        <div className='relative'>
          <Textarea
            id='description'
            placeholder='Describe what your agent does and how it helps users...'
            value={data.basicInfo.description}
            onChange={handleDescriptionChange}
            className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white min-h-[120px] focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl resize-none'
          />
          <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-blue-500/5 pointer-events-none'></div>
        </div>
        <p className='text-xs text-gray-400 flex items-center space-x-1'>
          <Info className='w-3 h-3' />
          <span>A clear description helps users understand your agent's capabilities</span>
        </p>
      </div>

      {/* Enhanced Tags Section */}
      <div className='space-y-4'>
        <Label className='text-white font-medium flex items-center space-x-2'>
          <Settings className='w-4 h-4 text-yellow-400' />
          <span>Tags</span>
        </Label>
        
        {/* Tags Display */}
        <div className='bg-gray-800/30 backdrop-blur-sm border border-gray-600 rounded-xl p-4'>
          <div className='flex flex-wrap gap-2 mb-3'>
            {tags.map(tag => (
              <Badge
                key={tag}
                variant='secondary'
                className='bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 border-blue-500/30 hover:from-blue-500/30 hover:to-purple-600/30 transition-all duration-300 cursor-pointer'
                onClick={() => handleRemoveTag(tag)}
              >
                {tag}
                <X className='w-3 h-3 ml-1 hover:text-red-400' />
              </Badge>
            ))}
            {tags.length === 0 && (
              <p className='text-gray-500 text-sm italic'>No tags added yet</p>
            )}
          </div>
          
          {/* Add Tag Input */}
          <div className='flex gap-2'>
            <Input
              placeholder='Add a tag...'
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className='bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all duration-300 rounded-lg'
            />
            <Button
              type='button'
              onClick={handleAddTag}
              variant='outline'
              className='border-gray-600 text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-300 transition-all duration-300 rounded-lg'
            >
              <Plus className='w-4 h-4' />
            </Button>
          </div>
        </div>
        
        <p className='text-xs text-gray-400 flex items-center space-x-1'>
          <Info className='w-3 h-3' />
          <span>Tags help categorize and organize your agents</span>
        </p>
      </div>

      {/* Enhanced Public Setting */}
      <EnableSwitchContainer
        checked={data.basicInfo.isPublic}
        onCheckedChange={handlePublicChange}
        title="Make Agent Public"
        description="Allow other users to discover and use your agent"
        icon={<Globe className='w-4 h-4' />}
        iconBgColor="purple"
        iconColor="purple"
        borderColor="purple"
        shadowColor="purple"
        size="md"
      />
    </div>
  );
};

// =============================================================================
// AI CONFIGURATION STEP
// =============================================================================

export const AIConfigurationStep: React.FC<{
  data: AgentConfigurationData;
  onChange: (data: Partial<AgentConfigurationData>) => void;
}> = ({ data, onChange }) => {
  const [conversationStarters, setConversationStarters] = useState<string[]>(
    data.aiConfig.conversationStarters || []
  );
  const [newStarter, setNewStarter] = useState('');

  const modelProviders = [
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      models: [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: '$', speed: 'Fast' },
        { id: 'gpt-4o', name: 'GPT-4o', cost: '$$$', speed: 'Medium' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', cost: '$$', speed: 'Medium' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: '$', speed: 'Fast' },
      ],
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      icon: '🧠',
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          cost: '$$',
          speed: 'Medium',
        },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', cost: '$', speed: 'Fast' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', cost: '$$$', speed: 'Slow' },
      ],
    },
    {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      models: [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', cost: '$', speed: 'Fast' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', cost: '$$', speed: 'Medium' },
      ],
    },
  ];

  const handleAddStarter = () => {
    if (newStarter.trim() && !conversationStarters.includes(newStarter.trim())) {
      const updatedStarters = [...conversationStarters, newStarter.trim()];
      setConversationStarters(updatedStarters);
      onChange({
        aiConfig: {
          ...data.aiConfig,
          conversationStarters: updatedStarters,
        },
      });
      setNewStarter('');
    }
  };

  const handleRemoveStarter = (starterToRemove: string) => {
    const updatedStarters = conversationStarters.filter(starter => starter !== starterToRemove);
    setConversationStarters(updatedStarters);
    onChange({
      aiConfig: {
        ...data.aiConfig,
        conversationStarters: updatedStarters,
      },
    });
  };

  const selectedProvider = modelProviders.find(p => p.id === data.aiConfig.modelProvider);
  const availableModels = selectedProvider?.models || [];

  return (
    <div className='space-y-8'>
      {/* Enhanced Header */}
      <div className='text-center bg-gradient-to-r from-purple-500/10 to-pink-600/10 rounded-2xl p-6 border border-purple-500/20'>
        <div className='w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <Brain className='w-8 h-8 text-white' />
        </div>
        <h2 className='text-2xl font-bold text-white mb-2'>AI Configuration</h2>
        <p className='text-gray-400'>Configure your agent's AI model and behavior</p>
      </div>

      {/* Enhanced Model Provider Selection */}
      <div className='space-y-4'>
        <Label className='text-white font-medium flex items-center space-x-2'>
          <Cpu className='w-4 h-4 text-blue-400' />
          <span>Model Provider *</span>
        </Label>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {modelProviders.map(provider => (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                data.aiConfig.modelProvider === provider.id
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25'
                  : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
              }`}
              onClick={() =>
                onChange({
                  aiConfig: {
                    ...data.aiConfig,
                    modelProvider: provider.id as any,
                    model: provider.models[0].id, // Auto-select first model
                  },
                })
              }
            >
              <CardContent className='p-6 text-center'>
                <div className='w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3'>
                  <span className='text-2xl'>{provider.icon}</span>
                </div>
                <h3 className='text-white font-semibold mb-1'>{provider.name}</h3>
                <p className='text-sm text-gray-400'>{provider.models.length} models available</p>
                {data.aiConfig.modelProvider === provider.id && (
                  <div className='mt-3 flex items-center justify-center space-x-1'>
                    <CheckCircle className='w-4 h-4 text-green-400' />
                    <span className='text-green-400 text-sm font-medium'>Selected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Model Selection */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-3'>
          <Label className='text-white font-medium flex items-center space-x-2'>
            <Zap className='w-4 h-4 text-yellow-400' />
            <span>Primary Model *</span>
          </Label>
          <Select
            value={data.aiConfig.model}
            onValueChange={value =>
              onChange({
                aiConfig: {
                  ...data.aiConfig,
                  model: value,
                },
              })
            }
          >
            <SelectTrigger className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'>
              <SelectValue placeholder='Select a model' />
            </SelectTrigger>
            <SelectContent className='bg-gray-800 border-gray-600 rounded-xl'>
              {availableModels.map(model => (
                <SelectItem key={model.id} value={model.id} className='text-white hover:bg-gray-700 rounded-lg'>
                  <div className='flex items-center justify-between w-full'>
                    <span className='font-medium'>{model.name}</span>
                    <div className='flex items-center space-x-2 ml-4'>
                      <Badge variant='outline' className='text-xs border-green-500/30 text-green-400'>
                        {model.cost}
                      </Badge>
                      <Badge variant='outline' className='text-xs border-blue-500/30 text-blue-400'>
                        {model.speed}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-3'>
          <Label className='text-white font-medium flex items-center space-x-2'>
            <Shield className='w-4 h-4 text-purple-400' />
            <span>Fallback Model</span>
          </Label>
          <Select
            value={data.aiConfig.fallbackModel || ''}
            onValueChange={value =>
              onChange({
                aiConfig: {
                  ...data.aiConfig,
                  fallbackModel: value || undefined,
                },
              })
            }
          >
            <SelectTrigger className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'>
              <SelectValue placeholder='Optional fallback model' />
            </SelectTrigger>
            <SelectContent className='bg-gray-800 border-gray-600 rounded-xl'>
              <SelectItem value='' className='text-white hover:bg-gray-700 rounded-lg'>
                <span className='text-gray-400'>No fallback</span>
              </SelectItem>
              {availableModels.map(model => (
                <SelectItem key={model.id} value={model.id} className='text-white hover:bg-gray-700 rounded-lg'>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Temperature and Max Tokens */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <Label className='text-white font-medium flex items-center space-x-2'>
            <Activity className='w-4 h-4 text-orange-400' />
            <span>Temperature: {data.aiConfig.temperature}</span>
          </Label>
          <div className='bg-gray-800/30 backdrop-blur-sm border border-gray-600 rounded-xl p-4'>
            <Slider
              value={[data.aiConfig.temperature]}
              onValueChange={value =>
                onChange({
                  aiConfig: {
                    ...data.aiConfig,
                    temperature: value[0],
                  },
                })
              }
              max={1}
              min={0}
              step={0.1}
              className='w-full [&>span]:bg-gradient-to-r [&>span]:from-orange-400 [&>span]:to-red-500 [&>span]:h-2 [&>span]:rounded-full [&>span]:shadow-lg [&>span]:shadow-orange-500/20'
            />
            <div className='flex justify-between text-xs text-gray-400 mt-2'>
              <span>Conservative (0.0)</span>
              <span>Balanced (0.5)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
          <p className='text-xs text-gray-400 flex items-center space-x-1'>
            <Info className='w-3 h-3' />
            <span>Higher values make output more creative and unpredictable</span>
          </p>
        </div>

        <div className='space-y-3'>
          <Label className='text-white font-medium flex items-center space-x-2'>
            <TrendingUp className='w-4 h-4 text-green-400' />
            <span>Max Tokens</span>
          </Label>
          <div className='relative'>
            <Input
              type='number'
              value={data.aiConfig.maxTokens}
              onChange={e =>
                onChange({
                  aiConfig: {
                    ...data.aiConfig,
                    maxTokens: parseInt(e.target.value),
                  },
                })
              }
              className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'
            />
            <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-blue-500/5 pointer-events-none'></div>
          </div>
          <p className='text-xs text-gray-400 flex items-center space-x-1'>
            <Info className='w-3 h-3' />
            <span>Maximum response length (recommended: 1000-4000)</span>
          </p>
        </div>
      </div>

      {/* Enhanced System Prompt */}
      <div className='space-y-4'>
        <Label className='text-white font-medium flex items-center space-x-2'>
          <FileText className='w-4 h-4 text-cyan-400' />
          <span>System Prompt *</span>
        </Label>
        <div className='relative'>
          <Textarea
            placeholder='You are a helpful AI assistant. Your role is to...'
            value={data.aiConfig.systemPrompt}
            onChange={e =>
              onChange({
                aiConfig: {
                  ...data.aiConfig,
                  systemPrompt: e.target.value,
                },
              })
            }
            className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white min-h-[140px] focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl resize-none'
          />
          <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 pointer-events-none'></div>
        </div>
        <p className='text-xs text-gray-400 flex items-center space-x-1'>
          <Info className='w-3 h-3' />
          <span>Define your agent's personality, role, and behavior guidelines</span>
        </p>
      </div>

      {/* Enhanced Conversation Starters */}
      <div className='space-y-4'>
        <Label className='text-white font-medium flex items-center space-x-2'>
          <MessageSquare className='w-4 h-4 text-pink-400' />
          <span>Conversation Starters</span>
        </Label>
        
        <div className='bg-gray-800/30 backdrop-blur-sm border border-gray-600 rounded-xl p-4'>
          <div className='space-y-3 mb-4'>
            {conversationStarters.map((starter, index) => (
              <div key={index} className='flex items-center space-x-3 p-3 bg-gray-700/50 rounded-xl border border-gray-600'>
                <div className='w-8 h-8 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-pink-500/30'>
                  <MessageSquare className='w-4 h-4 text-pink-400' />
                </div>
                <span className='text-white flex-1 text-sm'>{starter}</span>
                <button
                  onClick={() => handleRemoveStarter(starter)}
                  className='text-gray-400 hover:text-red-400 transition-colors'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
            {conversationStarters.length === 0 && (
              <p className='text-gray-500 text-sm italic text-center py-4'>No conversation starters added yet</p>
            )}
          </div>
          
          <div className='flex gap-2'>
            <Input
              placeholder='Add a conversation starter...'
              value={newStarter}
              onChange={e => setNewStarter(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStarter();
                }
              }}
              className='bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all duration-300 rounded-lg'
            />
            <Button
              type='button'
              onClick={handleAddStarter}
              variant='outline'
              className='border-gray-600 text-gray-300 hover:bg-pink-500/10 hover:border-pink-500/50 hover:text-pink-300 transition-all duration-300 rounded-lg'
            >
              <Plus className='w-4 h-4' />
            </Button>
          </div>
        </div>
        
        <p className='text-xs text-gray-400 flex items-center space-x-1'>
          <Info className='w-3 h-3' />
          <span>Suggested questions to help users start conversations</span>
        </p>
      </div>

      {/* Enhanced Multi-Model Support */}
      <EnableSwitchContainer
        checked={data.aiConfig.enableMultiModel}
        onCheckedChange={(checked: boolean) =>
          onChange({
            aiConfig: {
              ...data.aiConfig,
              enableMultiModel: checked,
            },
          })
        }
        title="Multi-Model Support"
        description="Enable automatic switching between models for optimal performance"
        icon={<Cpu className='w-4 h-4' />}
        iconBgColor="purple"
        iconColor="purple"
        borderColor="purple"
        shadowColor="purple"
        size="md"
      />
    </div>
  );
};

// =============================================================================
// RAG CONFIGURATION STEP
// =============================================================================

export const RAGConfigurationStep: React.FC<{
  data: AgentConfigurationData;
  onChange: (data: Partial<AgentConfigurationData>) => void;
  availableDocuments?: any[];
}> = ({ data, onChange, availableDocuments = [] }) => {
  const searchTypes = [
    {
      id: 'SEMANTIC',
      name: 'Semantic Search',
      description: 'Find content based on meaning and context',
      icon: <Brain className='w-5 h-5' />,
    },
    {
      id: 'KEYWORD',
      name: 'Keyword Search',
      description: 'Find content based on exact word matches',
      icon: <FileText className='w-5 h-5' />,
    },
    {
      id: 'HYBRID',
      name: 'Hybrid Search',
      description: 'Combine semantic and keyword search for best results',
      icon: <Zap className='w-5 h-5' />,
    },
  ];

  const knowledgeStrategies = [
    {
      id: 'AUTO',
      name: 'Auto Strategy',
      description: 'Automatically select the most relevant knowledge sources',
      icon: <Target className='w-5 h-5' />,
    },
    {
      id: 'SELECTIVE',
      name: 'Selective Strategy',
      description: 'Use only specific knowledge sources you choose',
      icon: <Settings className='w-5 h-5' />,
    },
    {
      id: 'PRIORITY',
      name: 'Priority Strategy',
      description: 'Prioritize knowledge sources based on importance weights',
      icon: <TrendingUp className='w-5 h-5' />,
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-white mb-2'>Knowledge & RAG Configuration</h2>
        <p className='text-gray-400'>Configure how your agent accesses and uses knowledge</p>
      </div>

      {/* Enable RAG */}
      <EnableSwitchContainer
        checked={data.ragConfig.enableRAG}
        onCheckedChange={(checked: boolean) =>
          onChange({
            ragConfig: {
              ...data.ragConfig,
              enableRAG: checked,
            },
          })
        }
        title="Enable RAG (Retrieval-Augmented Generation)"
        description="Allow your agent to use knowledge sources to provide more accurate responses"
        icon={<Database className='w-4 h-4' />}
        iconBgColor="green"
        iconColor="green"
        borderColor="green"
        shadowColor="green"
        size="md"
      />

      {data.ragConfig.enableRAG && (
        <>
          {/* Search Type Selection */}
          <div className='space-y-4'>
            <Label className='text-white font-medium'>Search Type</Label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {searchTypes.map(type => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    data.ragConfig.ragSearchType === type.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                  onClick={() =>
                    onChange({
                      ragConfig: {
                        ...data.ragConfig,
                        ragSearchType: type.id as any,
                      },
                    })
                  }
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <div className='text-blue-400'>{type.icon}</div>
                      <h3 className='text-white font-medium'>{type.name}</h3>
                    </div>
                    <p className='text-sm text-gray-400'>{type.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Knowledge Strategy */}
          <div className='space-y-4'>
            <Label className='text-white font-medium'>Knowledge Strategy</Label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {knowledgeStrategies.map(strategy => (
                <Card
                  key={strategy.id}
                  className={`cursor-pointer transition-all ${
                    data.ragConfig.knowledgeStrategy === strategy.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                  }`}
                  onClick={() =>
                    onChange({
                      ragConfig: {
                        ...data.ragConfig,
                        knowledgeStrategy: strategy.id as any,
                      },
                    })
                  }
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <div className='text-purple-400'>{strategy.icon}</div>
                      <h3 className='text-white font-medium'>{strategy.name}</h3>
                    </div>
                    <p className='text-sm text-gray-400'>{strategy.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* RAG Parameters */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label className='text-white font-medium'>
                Relevance Threshold: {data.ragConfig.ragThreshold}
              </Label>
              <Slider
                value={[data.ragConfig.ragThreshold]}
                onValueChange={value =>
                  onChange({
                    ragConfig: {
                      ...data.ragConfig,
                      ragThreshold: value[0],
                    },
                  })
                }
                min={0}
                max={1}
                step={0.05}
                className='w-full [&>span]:bg-gradient-to-r [&>span]:from-blue-400 [&>span]:to-purple-500 [&>span]:h-2 [&>span]:rounded-full [&>span]:shadow-lg [&>span]:shadow-blue-500/20'
              />
              <p className='text-xs text-gray-400'>
                Minimum similarity score for including knowledge in responses
              </p>
            </div>

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Max Documents</Label>
              <Input
                type='number'
                value={data.ragConfig.ragMaxDocuments}
                onChange={e =>
                  onChange({
                    ragConfig: {
                      ...data.ragConfig,
                      ragMaxDocuments: parseInt(e.target.value) || 5,
                    },
                  })
                }
                min={1}
                max={20}
                className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'
              />
              <p className='text-xs text-gray-400'>
                Maximum number of knowledge sources to use per response
              </p>
            </div>
          </div>

          {/* Chunk Settings */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label className='text-white font-medium'>Chunk Size</Label>
              <Input
                type='number'
                value={data.ragConfig.ragChunkSize}
                onChange={e =>
                  onChange({
                    ragConfig: {
                      ...data.ragConfig,
                      ragChunkSize: parseInt(e.target.value) || 500,
                    },
                  })
                }
                min={100}
                max={2000}
                className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'
              />
              <p className='text-xs text-gray-400'>
                Size of text chunks for processing (100-2000 characters)
              </p>
            </div>

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Chunk Overlap</Label>
              <Input
                type='number'
                value={data.ragConfig.ragOverlapSize}
                onChange={e =>
                  onChange({
                    ragConfig: {
                      ...data.ragConfig,
                      ragOverlapSize: parseInt(e.target.value) || 50,
                    },
                  })
                }
                min={0}
                max={500}
                className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'
              />
              <p className='text-xs text-gray-400'>Overlap between chunks to maintain context</p>
            </div>
          </div>

          {/* Knowledge Sources */}
          <div className='space-y-4'>
            <Label className='text-white font-medium'>Knowledge Sources</Label>
            {availableDocuments.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto'>
                {availableDocuments.map((doc: any) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      data.ragConfig.knowledgeFiles.includes(doc.id)
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                    onClick={() => {
                      const isSelected = data.ragConfig.knowledgeFiles.includes(doc.id);
                      const updatedFiles = isSelected
                        ? data.ragConfig.knowledgeFiles.filter(id => id !== doc.id)
                        : [...data.ragConfig.knowledgeFiles, doc.id];

                      onChange({
                        ragConfig: {
                          ...data.ragConfig,
                          knowledgeFiles: updatedFiles,
                        },
                      });
                    }}
                  >
                    <div className='flex items-center space-x-3'>
                      <div className='text-blue-400'>
                        <FileText className='w-5 h-5' />
                      </div>
                      <div className='flex-1'>
                        <h4 className='text-white font-medium'>{doc.title}</h4>
                        <p className='text-sm text-gray-400'>
                          {doc.type} • {doc.status}
                        </p>
                      </div>
                      {data.ragConfig.knowledgeFiles.includes(doc.id) && (
                        <CheckCircle className='w-5 h-5 text-green-400' />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-400'>
                <FileText className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p>No knowledge sources available</p>
                <p className='text-sm'>Upload documents to enable RAG features</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// REVIEW STEP
// =============================================================================

export const ReviewStep: React.FC<{
  data: AgentConfigurationData;
  onChange: (data: Partial<AgentConfigurationData>) => void;
}> = ({ data, onChange }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateConfiguration = async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/agents/wizard/validate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errors: ['Failed to validate configuration'],
        warnings: [],
        suggestions: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validateConfiguration();
  }, []);

  const getFeaturesList = () => {
    const features = [];

    if (data.ragConfig.enableRAG) {
      features.push({
        name: 'RAG (Retrieval-Augmented Generation)',
        description: `${data.ragConfig.ragSearchType} search with ${data.ragConfig.knowledgeFiles.length} knowledge sources`,
        icon: <Database className='w-5 h-5 text-green-400' />,
      });
    }

    if (data.learningConfig.enableAutoLearning) {
      features.push({
        name: 'Auto-Learning',
        description: `${data.learningConfig.learningMode} mode with ${data.learningConfig.learningThreshold} threshold`,
        icon: <Brain className='w-5 h-5 text-blue-400' />,
      });
    }

    if (data.integrationConfig.enableGoogleIntegration) {
      const enabledServices = Object.entries(data.integrationConfig.googleServices)
        .filter(([_, enabled]) => enabled)
        .map(([service, _]) => service);

      features.push({
        name: 'Google Integration',
        description: `${enabledServices.length} services: ${enabledServices.join(', ')}`,
        icon: <Globe className='w-5 h-5 text-purple-400' />,
      });
    }

    if (data.advancedConfig.enableAutoHandover) {
      features.push({
        name: 'Auto-Handover',
        description: 'Automatic escalation to human agents when needed',
        icon: <Users className='w-5 h-5 text-orange-400' />,
      });
    }

    if (data.advancedConfig.enableAnalytics) {
      features.push({
        name: 'Analytics',
        description: 'Performance tracking and insights',
        icon: <TrendingUp className='w-5 h-5 text-yellow-400' />,
      });
    }

    return features;
  };

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-white mb-2'>Review & Deploy</h2>
        <p className='text-gray-400'>Review your configuration and deploy your agent</p>
      </div>

      {/* Configuration Summary */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Basic Info */}
        <Card className='bg-gray-800/50 border-gray-600'>
          <CardHeader>
            <CardTitle className='text-white flex items-center space-x-2'>
              <FileText className='w-5 h-5' />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <Label className='text-gray-400'>Name</Label>
              <p className='text-white'>{data.basicInfo.name}</p>
            </div>
            <div>
              <Label className='text-gray-400'>Category</Label>
              <p className='text-white'>{data.basicInfo.category}</p>
            </div>
            <div>
              <Label className='text-gray-400'>Description</Label>
              <p className='text-white text-sm'>{data.basicInfo.description}</p>
            </div>
            <div>
              <Label className='text-gray-400'>Tags</Label>
              <div className='flex flex-wrap gap-1 mt-1'>
                {data.basicInfo.tags.map(tag => (
                  <Badge key={tag} variant='outline' className='text-xs'>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card className='bg-gray-800/50 border-gray-600'>
          <CardHeader>
            <CardTitle className='text-white flex items-center space-x-2'>
              <Brain className='w-5 h-5' />
              <span>AI Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <Label className='text-gray-400'>Model</Label>
              <p className='text-white'>{data.aiConfig.model}</p>
            </div>
            <div>
              <Label className='text-gray-400'>Provider</Label>
              <p className='text-white'>{data.aiConfig.modelProvider}</p>
            </div>
            <div>
              <Label className='text-gray-400'>Temperature</Label>
              <p className='text-white'>{data.aiConfig.temperature}</p>
            </div>
            <div>
              <Label className='text-gray-400'>Max Tokens</Label>
              <p className='text-white'>{data.aiConfig.maxTokens}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enabled Features */}
      <Card className='bg-gray-800/50 border-gray-600'>
        <CardHeader>
          <CardTitle className='text-white flex items-center space-x-2'>
            <Zap className='w-5 h-5' />
            <span>Enabled Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getFeaturesList().length > 0 ? (
            <div className='space-y-3'>
              {getFeaturesList().map((feature, index) => (
                <div
                  key={index}
                  className='flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg'
                >
                  {feature.icon}
                  <div>
                    <h4 className='text-white font-medium'>{feature.name}</h4>
                    <p className='text-sm text-gray-400'>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-400'>No advanced features enabled</p>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      <Card className='bg-gray-800/50 border-gray-600'>
        <CardHeader>
          <CardTitle className='text-white flex items-center space-x-2'>
            <Shield className='w-5 h-5' />
            <span>Configuration Validation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isValidating ? (
            <div className='flex items-center space-x-2 text-gray-400'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400'></div>
              <span>Validating configuration...</span>
            </div>
          ) : validationResult ? (
            <div className='space-y-3'>
              <div
                className={`flex items-center space-x-2 ${
                  validationResult.isValid ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {validationResult.isValid ? (
                  <CheckCircle className='w-5 h-5' />
                ) : (
                  <AlertCircle className='w-5 h-5' />
                )}
                <span className='font-medium'>
                  {validationResult.isValid ? 'Configuration is valid' : 'Configuration has errors'}
                </span>
              </div>

              {validationResult.errors?.length > 0 && (
                <div className='space-y-2'>
                  <Label className='text-red-400'>Errors:</Label>
                  {validationResult.errors.map((error: string, index: number) => (
                    <p key={index} className='text-sm text-red-400 pl-4'>
                      • {error}
                    </p>
                  ))}
                </div>
              )}

              {validationResult.warnings?.length > 0 && (
                <div className='space-y-2'>
                  <Label className='text-yellow-400'>Warnings:</Label>
                  {validationResult.warnings.map((warning: string, index: number) => (
                    <p key={index} className='text-sm text-yellow-400 pl-4'>
                      • {warning}
                    </p>
                  ))}
                </div>
              )}

              {validationResult.suggestions?.length > 0 && (
                <div className='space-y-2'>
                  <Label className='text-blue-400'>Suggestions:</Label>
                  {validationResult.suggestions.map((suggestion: string, index: number) => (
                    <p key={index} className='text-sm text-blue-400 pl-4'>
                      • {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className='text-gray-400'>Unable to validate configuration</p>
          )}
        </CardContent>
      </Card>

      {/* Deployment Configuration */}
      <Card className='bg-gray-800/50 border-gray-600'>
        <CardHeader>
          <CardTitle className='text-white flex items-center space-x-2'>
            <Cloud className='w-5 h-5' />
            <span>Deployment Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-white font-medium'>Deployment Name</Label>
              <Input
                placeholder='Enter deployment name'
                value={data.deploymentConfig.deploymentName}
                onChange={e =>
                  onChange({
                    deploymentConfig: {
                      ...data.deploymentConfig,
                      deploymentName: e.target.value,
                    },
                  })
                }
                className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-white font-medium'>Environment</Label>
              <Select
                value={data.deploymentConfig.environment}
                onValueChange={value =>
                  onChange({
                    deploymentConfig: {
                      ...data.deploymentConfig,
                      environment: value as any,
                    },
                  })
                }
              >
                <SelectTrigger className='bg-gray-800/50 backdrop-blur-sm border-gray-600 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 hover:border-gray-500 rounded-xl h-12'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-gray-800 border-gray-600'>
                  <SelectItem value='development' className='text-white'>
                    Development
                  </SelectItem>
                  <SelectItem value='staging' className='text-white'>
                    Staging
                  </SelectItem>
                  <SelectItem value='production' className='text-white'>
                    Production
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <EnableSwitchContainer
            checked={data.deploymentConfig.enableMonitoring}
            onCheckedChange={(checked: boolean) =>
              onChange({
                deploymentConfig: {
                  ...data.deploymentConfig,
                  enableMonitoring: checked,
                },
              })
            }
            title="Enable Monitoring"
            description="Monitor agent performance and usage"
            icon={<Activity className='w-4 h-4' />}
            iconBgColor="green"
            iconColor="green"
            borderColor="green"
            shadowColor="green"
            size="md"
          />

          <EnableSwitchContainer
            checked={data.deploymentConfig.enableAlerts}
            onCheckedChange={(checked: boolean) =>
              onChange({
                deploymentConfig: {
                  ...data.deploymentConfig,
                  enableAlerts: checked,
                },
              })
            }
            title="Enable Alerts"
            description="Get notified about important events"
            icon={<AlertCircle className='w-4 h-4' />}
            iconBgColor="yellow"
            iconColor="yellow"
            borderColor="yellow"
            shadowColor="yellow"
            size="md"
          />
        </CardContent>
      </Card>
    </div>
  );
};
