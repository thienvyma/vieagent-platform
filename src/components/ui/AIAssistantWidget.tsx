'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Wand2,
  MessageCircle,
  Send,
  Loader2,
  Copy,
  Check,
  X,
  Lightbulb,
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Settings,
  RefreshCw,
  Zap,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface AIAssistantContext {
  formType: 'contact' | 'registration' | 'survey' | 'application' | 'custom';
  currentFields: Array<{
    name: string;
    type: string;
    label: string;
    value: string;
    required: boolean;
  }>;
  userProfile?: {
    name?: string;
    email?: string;
    company?: string;
    role?: string;
  };
  previousSubmissions?: any[];
  formPurpose?: string;
}

export interface AISuggestion {
  id: string;
  field: string;
  value: string;
  confidence: number;
  reasoning: string;
  type: 'autofill' | 'suggestion' | 'template' | 'improvement';
  category: 'personal' | 'professional' | 'creative' | 'technical';
}

export interface AITemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Record<string, string>;
  useCase: string;
  popularity: number;
}

export interface AIAssistantWidgetProps {
  context: AIAssistantContext;
  onApplySuggestion?: (field: string, value: string) => void;
  onApplyTemplate?: (template: AITemplate) => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  apiKey?: string;
  customPrompts?: Record<string, string>;
  disabled?: boolean;
}

// =============================================================================
// AI TEMPLATES
// =============================================================================

// AI templates will be loaded from API or generated dynamically - no more static mock data

// =============================================================================
// AI ASSISTANT SERVICE
// =============================================================================

class AIAssistantService {
  private static instance: AIAssistantService;
  private apiKey: string;
  private cache: Map<string, any> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static getInstance(apiKey: string): AIAssistantService {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService(apiKey);
    }
    return AIAssistantService.instance;
  }

  async generateSuggestions(context: AIAssistantContext): Promise<AISuggestion[]> {
    const cacheKey = `suggestions_${JSON.stringify(context)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildSuggestionPrompt(context);
      const response = await this.callOpenAI(prompt);
      const suggestions = this.parseSuggestions(response, context);

      this.cache.set(cacheKey, suggestions);
      return suggestions;
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      return this.getFallbackSuggestions(context);
    }
  }

  async improveText(text: string, fieldType: string): Promise<string> {
    try {
      const prompt = `Improve this ${fieldType} text while maintaining its core meaning and making it more professional and engaging:

Original text: "${text}"

Please provide an improved version that is:
- More professional and polished
- Clear and concise
- Appropriate for the context
- Grammatically correct

Improved text:`;

      const response = await this.callOpenAI(prompt, 150);
      return response.trim();
    } catch (error) {
      console.error('Text improvement failed:', error);
      return text;
    }
  }

  async generateTemplateRecommendations(context: AIAssistantContext): Promise<AITemplate[]> {
    // Templates will be generated dynamically based on context
    // For now, return empty array until API integration is complete
    return [];
  }

  private buildSuggestionPrompt(context: AIAssistantContext): string {
    const { formType, currentFields, userProfile, formPurpose } = context;

    let prompt = `You are an AI assistant helping users fill out a ${formType} form. `;

    if (formPurpose) {
      prompt += `The form is for: ${formPurpose}. `;
    }

    prompt += `Based on the context, provide intelligent suggestions for empty or incomplete fields.

Current form fields:
${currentFields.map(field => `- ${field.label} (${field.type}): "${field.value}" ${field.required ? '[Required]' : '[Optional]'}`).join('\n')}

`;

    if (userProfile) {
      prompt += `User profile information:
- Name: ${userProfile.name || 'Not provided'}
- Email: ${userProfile.email || 'Not provided'}
- Company: ${userProfile.company || 'Not provided'}
- Role: ${userProfile.role || 'Not provided'}

`;
    }

    prompt += `Please provide suggestions in JSON format:
{
  "suggestions": [
    {
      "field": "field_name",
      "value": "suggested_value",
      "confidence": 0.8,
      "reasoning": "why this suggestion makes sense",
      "type": "autofill|suggestion|improvement",
      "category": "personal|professional|creative|technical"
    }
  ]
}

Focus on:
1. Auto-filling fields based on user profile
2. Suggesting professional and appropriate content
3. Improving existing text to be more polished
4. Ensuring consistency across related fields
5. Following best practices for ${formType} forms

Only suggest for fields that are empty or could be improved.`;

    return prompt;
  }

  private async callOpenAI(prompt: string, maxTokens: number = 500): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not provided');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful AI assistant specialized in form completion and content improvement.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseSuggestions(response: string, context: AIAssistantContext): AISuggestion[] {
    try {
      const parsed = JSON.parse(response);
      return (
        parsed.suggestions?.map((s: any, index: number) => ({
          id: `suggestion_${index}`,
          field: s.field,
          value: s.value,
          confidence: s.confidence || 0.5,
          reasoning: s.reasoning || 'AI-generated suggestion',
          type: s.type || 'suggestion',
          category: s.category || 'professional',
        })) || []
      );
    } catch (error) {
      console.error('Failed to parse AI suggestions:', error);
      return this.getFallbackSuggestions(context);
    }
  }

  private getFallbackSuggestions(context: AIAssistantContext): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Generate basic suggestions based on context
    context.currentFields.forEach((field, index) => {
      if (!field.value && field.required) {
        let suggestion: AISuggestion | null = null;

        switch (field.type) {
          case 'email':
            if (context.userProfile?.email) {
              suggestion = {
                id: `fallback_${index}`,
                field: field.name,
                value: context.userProfile.email,
                confidence: 0.9,
                reasoning: 'Using your profile email',
                type: 'autofill',
                category: 'personal',
              };
            }
            break;
          case 'text':
            if (field.name.toLowerCase().includes('name') && context.userProfile?.name) {
              suggestion = {
                id: `fallback_${index}`,
                field: field.name,
                value: context.userProfile.name,
                confidence: 0.9,
                reasoning: 'Using your profile name',
                type: 'autofill',
                category: 'personal',
              };
            }
            break;
        }

        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    });

    return suggestions;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AIAssistantWidget({
  context,
  onApplySuggestion,
  onApplyTemplate,
  className = '',
  position = 'bottom-right',
  apiKey,
  customPrompts = {},
  disabled = false,
}: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'templates' | 'improve'>(
    'suggestions'
  );
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [improveText, setImproveText] = useState('');
  const [improveField, setImproveField] = useState('');
  const [improvingText, setImprovingText] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const assistantService = apiKey ? AIAssistantService.getInstance(apiKey) : null;

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    if (isOpen && !suggestions.length) {
      loadSuggestions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !templates.length) {
      loadTemplates();
    }
  }, [isOpen]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const loadSuggestions = useCallback(async () => {
    if (!assistantService) return;

    setLoading(true);
    try {
      const newSuggestions = await assistantService.generateSuggestions(context);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      toast.error('Failed to load AI suggestions');
    } finally {
      setLoading(false);
    }
  }, [assistantService, context]);

  const loadTemplates = useCallback(async () => {
    if (!assistantService) return;

    try {
      const newTemplates = await assistantService.generateTemplateRecommendations(context);
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    }
  }, [assistantService, context]);

  const handleApplySuggestion = useCallback(
    (suggestion: AISuggestion) => {
      onApplySuggestion?.(suggestion.field, suggestion.value);
      toast.success('Suggestion applied!');
    },
    [onApplySuggestion]
  );

  const handleApplyTemplate = useCallback(
    (template: AITemplate) => {
      onApplyTemplate?.(template);
      toast.success('Template applied!');
      setIsOpen(false);
    },
    [onApplyTemplate]
  );

  const handleImproveText = useCallback(async () => {
    if (!assistantService || !improveText.trim()) return;

    setImprovingText(true);
    try {
      const improved = await assistantService.improveText(improveText, improveField || 'text');
      setImproveText(improved);
      toast.success('Text improved!');
    } catch (error) {
      console.error('Failed to improve text:', error);
      toast.error('Failed to improve text');
    } finally {
      setImprovingText(false);
    }
  }, [assistantService, improveText, improveField]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(id));
      toast.success('Copied to clipboard!');

      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderSuggestions = () => (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-white font-semibold'>AI Suggestions</h3>
        <button
          onClick={loadSuggestions}
          disabled={loading}
          className='p-1 text-gray-400 hover:text-white transition-colors'
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
          <span className='ml-2 text-gray-400'>Generating suggestions...</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className='space-y-3 max-h-64 overflow-y-auto'>
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className='p-3 bg-gray-800 rounded-lg border border-gray-700'>
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <div className='text-white font-medium'>{suggestion.field}</div>
                  <div className='text-gray-400 text-sm'>
                    {suggestion.type} • {Math.round(suggestion.confidence * 100)}% confidence
                  </div>
                </div>
                <div className='flex items-center space-x-1'>
                  <button
                    onClick={() => handleCopy(suggestion.value, suggestion.id)}
                    className='p-1 text-gray-400 hover:text-white transition-colors'
                  >
                    {copiedItems.has(suggestion.id) ? (
                      <Check className='w-4 h-4 text-green-400' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </button>
                  <button
                    onClick={() => handleApplySuggestion(suggestion)}
                    className='px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors'
                  >
                    Apply
                  </button>
                </div>
              </div>
              <div className='text-gray-300 text-sm mb-2'>{suggestion.value}</div>
              <div className='text-gray-500 text-xs'>{suggestion.reasoning}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-8 text-gray-400'>
          <Lightbulb className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p>No suggestions available</p>
          <p className='text-sm'>Fill out some fields to get AI suggestions</p>
        </div>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className='space-y-3'>
      <h3 className='text-white font-semibold'>Form Templates</h3>

      {templates.length > 0 ? (
        <div className='space-y-3 max-h-64 overflow-y-auto'>
          {templates.map(template => (
            <div key={template.id} className='p-3 bg-gray-800 rounded-lg border border-gray-700'>
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <div className='text-white font-medium'>{template.name}</div>
                  <div className='text-gray-400 text-sm'>
                    {template.category} • {template.popularity}% popular
                  </div>
                </div>
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className='px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors'
                >
                  Use Template
                </button>
              </div>
              <div className='text-gray-300 text-sm mb-2'>{template.description}</div>
              <div className='text-gray-500 text-xs'>{template.useCase}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-8 text-gray-400'>
          <FileText className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p>No templates available</p>
          <p className='text-sm'>Templates will appear based on your form type</p>
        </div>
      )}
    </div>
  );

  const renderImprove = () => (
    <div className='space-y-3'>
      <h3 className='text-white font-semibold'>Improve Text</h3>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Field Type</label>
        <select
          value={improveField}
          onChange={e => setImproveField(e.target.value)}
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
        >
          <option value=''>Select field type</option>
          <option value='message'>Message</option>
          <option value='description'>Description</option>
          <option value='bio'>Bio</option>
          <option value='summary'>Summary</option>
          <option value='objective'>Objective</option>
          <option value='experience'>Experience</option>
        </select>
      </div>

      <div>
        <label className='block text-gray-300 text-sm mb-1'>Text to Improve</label>
        <textarea
          value={improveText}
          onChange={e => setImproveText(e.target.value)}
          className='w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
          rows={4}
          placeholder='Enter text to improve...'
        />
      </div>

      <div className='flex items-center space-x-2'>
        <button
          onClick={handleImproveText}
          disabled={!improveText.trim() || improvingText}
          className='flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2'
        >
          {improvingText ? (
            <>
              <Loader2 className='w-4 h-4 animate-spin' />
              <span>Improving...</span>
            </>
          ) : (
            <>
              <Wand2 className='w-4 h-4' />
              <span>Improve</span>
            </>
          )}
        </button>

        {improveText && (
          <button
            onClick={() => handleCopy(improveText, 'improved_text')}
            className='p-2 text-gray-400 hover:text-white transition-colors'
          >
            {copiedItems.has('improved_text') ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4' />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (disabled) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      {/* AI Assistant Button */}
      <button
        onClick={() => setIsOpen(true)}
        className='w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group'
        title='AI Assistant'
      >
        <Bot className='w-6 h-6 text-white group-hover:scale-110 transition-transform' />
        <Sparkles className='w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse' />
      </button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <div className='absolute bottom-16 right-0 w-80 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden'>
          {/* Header */}
          <div className='p-4 border-b border-gray-800 bg-gradient-to-r from-blue-600/20 to-purple-600/20'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Bot className='w-5 h-5 text-blue-400' />
                <h3 className='text-white font-semibold'>AI Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-400 hover:text-white transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className='flex border-b border-gray-800'>
            {[
              { id: 'suggestions', label: 'Suggestions', icon: <Zap className='w-4 h-4' /> },
              { id: 'templates', label: 'Templates', icon: <FileText className='w-4 h-4' /> },
              { id: 'improve', label: 'Improve', icon: <Wand2 className='w-4 h-4' /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className='p-4 max-h-96 overflow-y-auto'>
            {activeTab === 'suggestions' && renderSuggestions()}
            {activeTab === 'templates' && renderTemplates()}
            {activeTab === 'improve' && renderImprove()}
          </div>

          {/* Footer */}
          <div className='p-3 border-t border-gray-800 bg-gray-800/50'>
            <div className='flex items-center justify-between text-xs text-gray-400'>
              <span>Powered by AI</span>
              <div className='flex items-center space-x-1'>
                <Star className='w-3 h-3 text-yellow-400' />
                <span>Smart suggestions</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
