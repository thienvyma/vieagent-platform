'use client';

import { useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';

export type KnowledgeStrategy = 'AUTO' | 'SELECTIVE' | 'PRIORITY';

export interface StrategyConfig {
  strategy: KnowledgeStrategy;
  config: {
    // Auto strategy settings
    autoFallbackEnabled?: boolean;
    autoRelevanceThreshold?: number;
    autoMaxDocuments?: number;

    // Selective strategy settings
    selectedDocumentIds?: string[];
    enableDynamicSelection?: boolean;

    // Priority strategy settings
    priorityWeights?: Record<string, number>;
    priorityThreshold?: number;
    enableWeightDecay?: boolean;
  };
}

interface StrategySelectorProps {
  value: StrategyConfig;
  onChange: (config: StrategyConfig) => void;
  availableDocuments: Array<{
    id: string;
    title: string;
    filename: string;
    type: string;
    status: string;
    size?: number;
    createdAt: string;
  }>;
  loading?: boolean;
  disabled?: boolean;
}

export default function StrategySelector({
  value,
  onChange,
  availableDocuments,
  loading = false,
  disabled = false,
}: StrategySelectorProps) {
  const [activeStrategy, setActiveStrategy] = useState<KnowledgeStrategy>(value.strategy);

  const handleStrategyChange = (strategy: KnowledgeStrategy) => {
    setActiveStrategy(strategy);

    // Initialize default config for each strategy
    let defaultConfig = {};

    switch (strategy) {
      case 'AUTO':
        defaultConfig = {
          autoFallbackEnabled: true,
          autoRelevanceThreshold: 0.7,
          autoMaxDocuments: 5,
        };
        break;
      case 'SELECTIVE':
        defaultConfig = {
          selectedDocumentIds: value.config.selectedDocumentIds || [],
          enableDynamicSelection: false,
        };
        break;
      case 'PRIORITY':
        defaultConfig = {
          priorityWeights: value.config.priorityWeights || {},
          priorityThreshold: 0.5,
          enableWeightDecay: true,
        };
        break;
    }

    onChange({
      strategy,
      config: defaultConfig,
    });
  };

  const strategies = [
    {
      key: 'AUTO' as const,
      name: 'Auto Strategy',
      icon: '🤖',
      description: 'Automatically selects the most relevant documents based on query context',
      features: [
        'Smart relevance scoring',
        'Automatic fallback logic',
        'Dynamic document selection',
        'Context-aware filtering',
      ],
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30',
    },
    {
      key: 'SELECTIVE' as const,
      name: 'Selective Strategy',
      icon: '🎯',
      description: 'Manually select specific documents to use for knowledge retrieval',
      features: [
        'Manual document selection',
        'Precise control over sources',
        'Consistent knowledge base',
        'Predictable responses',
      ],
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500/30',
    },
    {
      key: 'PRIORITY' as const,
      name: 'Priority Strategy',
      icon: '⚖️',
      description: 'Assign priority weights to documents for intelligent retrieval ranking',
      features: [
        'Weighted document ranking',
        'Fine-grained priority control',
        'Relevance-based scoring',
        'Dynamic weight adjustment',
      ],
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Strategy Selection */}
      <div>
        <h3 className='text-lg font-semibold text-white mb-4 flex items-center space-x-2'>
          <span>🧠</span>
          <span>Knowledge Strategy</span>
          {loading && (
            <div className='animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent'></div>
          )}
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {strategies.map(strategy => (
            <div
              key={strategy.key}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${
                activeStrategy === strategy.key
                  ? `bg-gradient-to-br ${strategy.color} ${strategy.borderColor} shadow-lg`
                  : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && handleStrategyChange(strategy.key)}
            >
              <div className='flex items-start space-x-3'>
                <div className='text-2xl'>{strategy.icon}</div>
                <div className='flex-1'>
                  <h4 className='font-semibold text-white mb-1'>{strategy.name}</h4>
                  <p className='text-sm text-gray-300 mb-3'>{strategy.description}</p>

                  <div className='space-y-1'>
                    {strategy.features.map((feature, index) => (
                      <div key={index} className='flex items-center space-x-2'>
                        <div className='w-1.5 h-1.5 bg-current rounded-full opacity-60'></div>
                        <span className='text-xs text-gray-400'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {activeStrategy === strategy.key && (
                <div className='absolute -top-2 -right-2 bg-white text-green-600 rounded-full p-1'>
                  <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Configuration */}
      <div className='bg-gray-800/30 rounded-xl p-6 border border-gray-600'>
        <h4 className='text-white font-semibold mb-4 flex items-center space-x-2'>
          <span>⚙️</span>
          <span>{strategies.find(s => s.key === activeStrategy)?.name} Configuration</span>
        </h4>

        {activeStrategy === 'AUTO' && (
          <AutoStrategyConfig
            config={value.config}
            onChange={config => onChange({ strategy: activeStrategy, config })}
            disabled={disabled}
          />
        )}

        {activeStrategy === 'SELECTIVE' && (
          <SelectiveStrategyConfig
            config={value.config}
            onChange={config => onChange({ strategy: activeStrategy, config })}
            availableDocuments={availableDocuments}
            disabled={disabled}
          />
        )}

        {activeStrategy === 'PRIORITY' && (
          <PriorityStrategyConfig
            config={value.config}
            onChange={config => onChange({ strategy: activeStrategy, config })}
            availableDocuments={availableDocuments}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

// Auto Strategy Configuration Component
function AutoStrategyConfig({
  config,
  onChange,
  disabled,
}: {
  config: any;
  onChange: (config: any) => void;
  disabled: boolean;
}) {
  return (
    <div className='space-y-4'>
      <div>
        <label className='flex items-center space-x-3 cursor-pointer'>
          <input
            type='checkbox'
            checked={config.autoFallbackEnabled || false}
            onChange={e => onChange({ ...config, autoFallbackEnabled: e.target.checked })}
            disabled={disabled}
            className='rounded text-blue-500 focus:ring-blue-500'
          />
          <span className='text-white'>Enable Auto Fallback</span>
          <Tooltip content='Automatically fall back to less relevant documents if no high-relevance matches are found'>
            <span className='text-gray-400 hover:text-gray-300 cursor-help'>ℹ️</span>
          </Tooltip>
        </label>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-300 mb-2'>Relevance Threshold</label>
        <div className='flex items-center space-x-3'>
          <input
            type='range'
            min='0.1'
            max='1.0'
            step='0.1'
            value={config.autoRelevanceThreshold || 0.7}
            onChange={e =>
              onChange({ ...config, autoRelevanceThreshold: parseFloat(e.target.value) })
            }
            disabled={disabled}
            className='flex-1'
          />
          <span className='text-white text-sm w-12'>{config.autoRelevanceThreshold || 0.7}</span>
        </div>
        <p className='text-xs text-gray-400 mt-1'>Minimum relevance score for document inclusion</p>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-300 mb-2'>Max Documents</label>
        <input
          type='number'
          min='1'
          max='20'
          value={config.autoMaxDocuments || 5}
          onChange={e => onChange({ ...config, autoMaxDocuments: parseInt(e.target.value) })}
          disabled={disabled}
          className='w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <p className='text-xs text-gray-400 mt-1'>
          Maximum number of documents to include in context
        </p>
      </div>
    </div>
  );
}

// Selective Strategy Configuration Component
function SelectiveStrategyConfig({
  config,
  onChange,
  availableDocuments,
  disabled,
}: {
  config: any;
  onChange: (config: any) => void;
  availableDocuments: Array<any>;
  disabled: boolean;
}) {
  const selectedIds = config.selectedDocumentIds || [];

  const handleDocumentToggle = (documentId: string) => {
    const newSelected = selectedIds.includes(documentId)
      ? selectedIds.filter((id: string) => id !== documentId)
      : [...selectedIds, documentId];

    onChange({ ...config, selectedDocumentIds: newSelected });
  };

  return (
    <div className='space-y-4'>
      <div>
        <label className='flex items-center space-x-3 cursor-pointer'>
          <input
            type='checkbox'
            checked={config.enableDynamicSelection || false}
            onChange={e => onChange({ ...config, enableDynamicSelection: e.target.checked })}
            disabled={disabled}
            className='rounded text-green-500 focus:ring-green-500'
          />
          <span className='text-white'>Enable Dynamic Selection</span>
          <Tooltip content='Allow the system to dynamically add/remove documents based on context'>
            <span className='text-gray-400 hover:text-gray-300 cursor-help'>ℹ️</span>
          </Tooltip>
        </label>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-300 mb-3'>
          Selected Documents ({selectedIds.length})
        </label>
        <div className='max-h-64 overflow-y-auto space-y-2'>
          {availableDocuments.map(doc => (
            <label
              key={doc.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedIds.includes(doc.id)
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-gray-800/50 border-gray-600 hover:border-gray-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && handleDocumentToggle(doc.id)}
            >
              <input
                type='checkbox'
                checked={selectedIds.includes(doc.id)}
                onChange={() => {}} // Handled by parent click
                disabled={disabled}
                className='rounded text-green-500 focus:ring-green-500 mt-1'
              />
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <span className='text-white font-medium'>{doc.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      doc.status === 'PROCESSED'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className='text-gray-400 text-sm mt-1'>
                  {doc.type.toUpperCase()} • {doc.filename} •{' '}
                  {new Date(doc.createdAt).toLocaleDateString()}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// Priority Strategy Configuration Component
function PriorityStrategyConfig({
  config,
  onChange,
  availableDocuments,
  disabled,
}: {
  config: any;
  onChange: (config: any) => void;
  availableDocuments: Array<any>;
  disabled: boolean;
}) {
  const priorityWeights = config.priorityWeights || {};

  const handleWeightChange = (documentId: string, weight: number) => {
    const newWeights = { ...priorityWeights, [documentId]: weight };
    onChange({ ...config, priorityWeights: newWeights });
  };

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-300 mb-2'>Priority Threshold</label>
          <div className='flex items-center space-x-3'>
            <input
              type='range'
              min='0.1'
              max='1.0'
              step='0.1'
              value={config.priorityThreshold || 0.5}
              onChange={e => onChange({ ...config, priorityThreshold: parseFloat(e.target.value) })}
              disabled={disabled}
              className='flex-1'
            />
            <span className='text-white text-sm w-12'>{config.priorityThreshold || 0.5}</span>
          </div>
        </div>

        <div>
          <label className='flex items-center space-x-3 cursor-pointer'>
            <input
              type='checkbox'
              checked={config.enableWeightDecay || false}
              onChange={e => onChange({ ...config, enableWeightDecay: e.target.checked })}
              disabled={disabled}
              className='rounded text-purple-500 focus:ring-purple-500'
            />
            <span className='text-white'>Enable Weight Decay</span>
            <Tooltip content='Gradually reduce document weights over time to promote content freshness'>
              <span className='text-gray-400 hover:text-gray-300 cursor-help'>ℹ️</span>
            </Tooltip>
          </label>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-300 mb-3'>
          Document Priority Weights
        </label>
        <div className='max-h-64 overflow-y-auto space-y-3'>
          {availableDocuments.map(doc => (
            <div key={doc.id} className='bg-gray-800/50 border border-gray-600 rounded-lg p-3'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-white font-medium'>{doc.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        doc.status === 'PROCESSED'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <div className='text-gray-400 text-sm'>
                    {doc.type.toUpperCase()} • {doc.filename}
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-white font-bold text-lg'>
                    {priorityWeights[doc.id] || 1.0}
                  </div>
                  <div className='text-xs text-gray-400'>Weight</div>
                </div>
              </div>

              <div className='flex items-center space-x-3'>
                <span className='text-xs text-gray-400'>Low</span>
                <input
                  type='range'
                  min='0.1'
                  max='3.0'
                  step='0.1'
                  value={priorityWeights[doc.id] || 1.0}
                  onChange={e => handleWeightChange(doc.id, parseFloat(e.target.value))}
                  disabled={disabled}
                  className='flex-1'
                />
                <span className='text-xs text-gray-400'>High</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
