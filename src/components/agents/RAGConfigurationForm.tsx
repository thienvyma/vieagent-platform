/**
 * ⚙️ RAG Configuration Form - Phase 4 Day 16 Step 16.4
 * Comprehensive RAG settings form với real-time validation và testing tools
 */

'use client';

import { useState, useEffect } from 'react';

export interface RAGSettings {
  enabled: boolean;
  useAutoLearning: boolean;
  enableMultiModel: boolean;

  // Search Configuration
  searchThreshold: number;
  maxResults: number;
  semanticWeight: number;
  keywordWeight: number;
  enableKeywordSearch: boolean;

  // Context Configuration
  maxTokens: number;
  maxContextLength: number;
  maxSourcesPerContext: number;
  includeSourceInfo: boolean;
  includeHighlights: boolean;

  // Quality Settings
  minRelevanceScore: number;
  prioritizeRecency: boolean;
  balanceContentTypes: boolean;

  // Fallback Behavior
  fallbackToGeneral: boolean;
  fallbackPrompt?: string;
  enableEmptyContextResponse: boolean;

  // Performance Settings
  timeoutMs: number;
  enableCaching: boolean;
  cacheTTL: number;
}

export interface RAGConfigurationFormProps {
  initialSettings?: Partial<RAGSettings>;
  onSave: (settings: RAGSettings) => void;
  onTest?: (settings: RAGSettings, testQuery: string) => Promise<any>;
  loading?: boolean;
  agentId?: string;
}

export const DEFAULT_RAG_SETTINGS: RAGSettings = {
  enabled: true,
  useAutoLearning: true,
  enableMultiModel: false,

  searchThreshold: 0.7,
  maxResults: 20,
  semanticWeight: 0.8,
  keywordWeight: 0.2,
  enableKeywordSearch: true,

  maxTokens: 8000,
  maxContextLength: 32000,
  maxSourcesPerContext: 10,
  includeSourceInfo: true,
  includeHighlights: true,

  minRelevanceScore: 0.5,
  prioritizeRecency: false,
  balanceContentTypes: true,

  fallbackToGeneral: true,
  enableEmptyContextResponse: true,

  timeoutMs: 10000,
  enableCaching: true,
  cacheTTL: 300000,
};

export default function RAGConfigurationForm({
  initialSettings = {},
  onSave,
  onTest,
  loading = false,
  agentId,
}: RAGConfigurationFormProps) {
  const [settings, setSettings] = useState<RAGSettings>({
    ...DEFAULT_RAG_SETTINGS,
    ...initialSettings,
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'performance' | 'test'>(
    'basic'
  );
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    validateSettings();
  }, [settings]);

  const validateSettings = () => {
    const errors: string[] = [];

    if (settings.searchThreshold < 0 || settings.searchThreshold > 1) {
      errors.push('Search threshold must be between 0 and 1');
    }

    if (settings.semanticWeight + settings.keywordWeight !== 1) {
      errors.push('Semantic weight và keyword weight phải tổng bằng 1');
    }

    if (settings.maxResults < 1 || settings.maxResults > 100) {
      errors.push('Max results must be between 1 and 100');
    }

    if (settings.maxTokens < 100 || settings.maxTokens > 50000) {
      errors.push('Max tokens must be between 100 and 50,000');
    }

    if (settings.timeoutMs < 1000 || settings.timeoutMs > 60000) {
      errors.push('Timeout must be between 1 and 60 seconds');
    }

    setValidationErrors(errors);
  };

  const handleSave = () => {
    if (validationErrors.length === 0) {
      onSave(settings);
    }
  };

  const handleTest = async () => {
    if (!testQuery.trim() || !onTest) return;

    setTestLoading(true);
    try {
      const results = await onTest(settings, testQuery);
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: 'Test failed' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      ...DEFAULT_RAG_SETTINGS,
      ...initialSettings,
    });
  };

  const updateSetting = (key: keyof RAGSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getPerformanceRating = (): 'high' | 'medium' | 'low' => {
    const score =
      (settings.maxResults <= 10 ? 0.3 : settings.maxResults <= 20 ? 0.2 : 0.1) +
      (settings.maxTokens <= 5000 ? 0.3 : settings.maxTokens <= 10000 ? 0.2 : 0.1) +
      (settings.timeoutMs <= 5000 ? 0.3 : settings.timeoutMs <= 10000 ? 0.2 : 0.1) +
      (settings.enableCaching ? 0.1 : 0);

    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  };

  const performanceRating = getPerformanceRating();

  return (
    <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-2xl font-bold text-white flex items-center space-x-2'>
          <span>⚙️</span>
          <span>RAG Configuration</span>
        </h2>
        <div className='flex items-center space-x-2'>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              performanceRating === 'high'
                ? 'bg-green-500/20 text-green-400'
                : performanceRating === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
            }`}
          >
            Performance: {performanceRating.toUpperCase()}
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              validationErrors.length === 0
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {validationErrors.length === 0 ? 'Valid' : `${validationErrors.length} errors`}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='flex space-x-1 mb-6 bg-white/5 p-1 rounded-2xl'>
        {[
          { id: 'basic', label: 'Basic', icon: '🔧' },
          { id: 'advanced', label: 'Advanced', icon: '⚡' },
          { id: 'performance', label: 'Performance', icon: '🚀' },
          { id: 'test', label: 'Test', icon: '🧪' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span className='font-medium'>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className='mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl'>
          <h4 className='text-red-400 font-medium mb-2'>⚠️ Validation Errors:</h4>
          <ul className='text-sm text-red-300 space-y-1'>
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Settings */}
      {activeTab === 'basic' && (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Enable RAG */}
            <div className='space-y-3'>
              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.enabled}
                  onChange={e => updateSetting('enabled', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Enable RAG</span>
              </label>
              <p className='text-sm text-gray-400'>Enable Retrieval-Augmented Generation</p>
            </div>

            {/* Auto Learning */}
            <div className='space-y-3'>
              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.useAutoLearning}
                  onChange={e => updateSetting('useAutoLearning', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Auto Learning</span>
              </label>
              <p className='text-sm text-gray-400'>Enable automatic learning from interactions</p>
            </div>

            {/* Search Threshold */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Search Threshold: {settings.searchThreshold.toFixed(2)}
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.05'
                value={settings.searchThreshold}
                onChange={e => updateSetting('searchThreshold', parseFloat(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Minimum similarity score for search results</p>
            </div>

            {/* Max Results */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Max Results: {settings.maxResults}
              </label>
              <input
                type='range'
                min='1'
                max='50'
                value={settings.maxResults}
                onChange={e => updateSetting('maxResults', parseInt(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Maximum number of search results</p>
            </div>

            {/* Semantic vs Keyword Weight */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Semantic Weight: {settings.semanticWeight.toFixed(2)}
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.1'
                value={settings.semanticWeight}
                onChange={e => {
                  const semantic = parseFloat(e.target.value);
                  updateSetting('semanticWeight', semantic);
                  updateSetting('keywordWeight', 1 - semantic);
                }}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>
                Semantic: {settings.semanticWeight.toFixed(2)} / Keyword:{' '}
                {settings.keywordWeight.toFixed(2)}
              </p>
            </div>

            {/* Enable Keyword Search */}
            <div className='space-y-3'>
              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.enableKeywordSearch}
                  onChange={e => updateSetting('enableKeywordSearch', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Enable Keyword Search</span>
              </label>
              <p className='text-sm text-gray-400'>Use hybrid semantic + keyword search</p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {activeTab === 'advanced' && (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Max Tokens */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Max Tokens: {settings.maxTokens.toLocaleString()}
              </label>
              <input
                type='range'
                min='100'
                max='20000'
                step='100'
                value={settings.maxTokens}
                onChange={e => updateSetting('maxTokens', parseInt(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Maximum context tokens</p>
            </div>

            {/* Max Context Length */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Max Context Length: {settings.maxContextLength.toLocaleString()}
              </label>
              <input
                type='range'
                min='1000'
                max='50000'
                step='1000'
                value={settings.maxContextLength}
                onChange={e => updateSetting('maxContextLength', parseInt(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Maximum context character length</p>
            </div>

            {/* Max Sources Per Context */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Max Sources: {settings.maxSourcesPerContext}
              </label>
              <input
                type='range'
                min='1'
                max='20'
                value={settings.maxSourcesPerContext}
                onChange={e => updateSetting('maxSourcesPerContext', parseInt(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Maximum sources per context</p>
            </div>

            {/* Min Relevance Score */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Min Relevance: {settings.minRelevanceScore.toFixed(2)}
              </label>
              <input
                type='range'
                min='0'
                max='1'
                step='0.05'
                value={settings.minRelevanceScore}
                onChange={e => updateSetting('minRelevanceScore', parseFloat(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Minimum relevance score for inclusion</p>
            </div>

            {/* Additional Options */}
            <div className='space-y-4'>
              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.includeSourceInfo}
                  onChange={e => updateSetting('includeSourceInfo', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Include Source Info</span>
              </label>

              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.includeHighlights}
                  onChange={e => updateSetting('includeHighlights', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Include Highlights</span>
              </label>

              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.prioritizeRecency}
                  onChange={e => updateSetting('prioritizeRecency', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Prioritize Recent Content</span>
              </label>

              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.balanceContentTypes}
                  onChange={e => updateSetting('balanceContentTypes', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Balance Content Types</span>
              </label>
            </div>

            {/* Fallback Settings */}
            <div className='space-y-4'>
              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.fallbackToGeneral}
                  onChange={e => updateSetting('fallbackToGeneral', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Fallback to General</span>
              </label>

              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.enableEmptyContextResponse}
                  onChange={e => updateSetting('enableEmptyContextResponse', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Allow Empty Context Response</span>
              </label>

              {settings.fallbackToGeneral && (
                <div className='space-y-2'>
                  <label className='block text-white font-medium'>Fallback Prompt:</label>
                  <textarea
                    value={settings.fallbackPrompt || ''}
                    onChange={e => updateSetting('fallbackPrompt', e.target.value)}
                    placeholder='Enter fallback prompt...'
                    className='w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500'
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Settings */}
      {activeTab === 'performance' && (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Timeout */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Timeout: {settings.timeoutMs / 1000}s
              </label>
              <input
                type='range'
                min='1000'
                max='30000'
                step='1000'
                value={settings.timeoutMs}
                onChange={e => updateSetting('timeoutMs', parseInt(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Maximum search timeout</p>
            </div>

            {/* Cache TTL */}
            <div className='space-y-3'>
              <label className='block text-white font-medium'>
                Cache TTL: {settings.cacheTTL / 1000 / 60}min
              </label>
              <input
                type='range'
                min='60000'
                max='3600000'
                step='60000'
                value={settings.cacheTTL}
                onChange={e => updateSetting('cacheTTL', parseInt(e.target.value))}
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer'
              />
              <p className='text-sm text-gray-400'>Cache time-to-live</p>
            </div>

            {/* Caching */}
            <div className='space-y-3'>
              <label className='flex items-center space-x-3'>
                <input
                  type='checkbox'
                  checked={settings.enableCaching}
                  onChange={e => updateSetting('enableCaching', e.target.checked)}
                  className='w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500'
                />
                <span className='text-white font-medium'>Enable Caching</span>
              </label>
              <p className='text-sm text-gray-400'>Cache search results for better performance</p>
            </div>
          </div>

          {/* Performance Recommendations */}
          <div className='bg-white/5 rounded-xl p-4'>
            <h4 className='text-white font-medium mb-3'>📊 Performance Recommendations</h4>
            <div className='space-y-2 text-sm'>
              {settings.maxResults > 20 && (
                <div className='text-yellow-400'>
                  ⚠️ Consider reducing max results for better performance
                </div>
              )}
              {settings.maxTokens > 10000 && (
                <div className='text-yellow-400'>⚠️ High token limit may impact response time</div>
              )}
              {settings.timeoutMs > 15000 && (
                <div className='text-yellow-400'>⚠️ Long timeout may affect user experience</div>
              )}
              {!settings.enableCaching && (
                <div className='text-blue-400'>💡 Enable caching for better performance</div>
              )}
              {performanceRating === 'high' && (
                <div className='text-green-400'>✅ Configuration optimized for performance</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Settings */}
      {activeTab === 'test' && (
        <div className='space-y-6'>
          <div className='space-y-4'>
            <label className='block text-white font-medium'>Test Query:</label>
            <textarea
              value={testQuery}
              onChange={e => setTestQuery(e.target.value)}
              placeholder='Enter a test query to see how RAG performs...'
              className='w-full p-4 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500'
              rows={4}
            />
            <button
              onClick={handleTest}
              disabled={!testQuery.trim() || testLoading || !onTest}
              className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold'
            >
              {testLoading ? (
                <span className='flex items-center space-x-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span>Testing...</span>
                </span>
              ) : (
                <span className='flex items-center space-x-2'>
                  <span>🧪</span>
                  <span>Test RAG</span>
                </span>
              )}
            </button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className='bg-white/5 rounded-xl p-4'>
              <h4 className='text-white font-medium mb-3'>Test Results:</h4>
              <pre className='text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-96'>
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex items-center justify-between pt-6 border-t border-gray-700'>
        <div className='flex space-x-3'>
          <button
            onClick={handleReset}
            className='px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors'
          >
            Reset to Default
          </button>
        </div>
        <div className='flex space-x-3'>
          <button
            onClick={handleSave}
            disabled={loading || validationErrors.length > 0}
            className='bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold'
          >
            {loading ? (
              <span className='flex items-center space-x-2'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Saving...</span>
              </span>
            ) : (
              <span className='flex items-center space-x-2'>
                <span>💾</span>
                <span>Save Configuration</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
