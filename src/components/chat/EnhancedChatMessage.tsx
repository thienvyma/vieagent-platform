/**
 * 💬 Enhanced Chat Message Component - Phase 4 Day 16 Step 16.3
 * Advanced chat message với RAG indicators, source documents, follow-up suggestions
 */

'use client';

import { useState, useEffect } from 'react';

export interface RAGMetadata {
  enabled: boolean;
  hasContext: boolean;
  sources?: number;
  tokens?: number;
  searchTime?: number;
  contextBuildTime?: number;
  averageRelevance?: number;
  usedFallback?: boolean;
}

export interface RAGSource {
  id: string;
  title: string;
  type: string;
  relevance: number;
  preview: string;
  filename?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;

  // RAG-specific fields
  rag?: RAGMetadata;
  sources?: RAGSource[];
  confidenceScore?: number;
  suggestedQuestions?: string[];
  processingTime?: number;
}

interface EnhancedChatMessageProps {
  message: ChatMessage;
  onSuggestedQuestionClick?: (question: string) => void;
  onSourceClick?: (source: RAGSource) => void;
  showRAGDetails?: boolean;
}

export default function EnhancedChatMessage({
  message,
  onSuggestedQuestionClick,
  onSourceClick,
  showRAGDetails = true,
}: EnhancedChatMessageProps) {
  const [showSources, setShowSources] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isAssistant = message.role === 'assistant';
  const hasRAG = message.rag?.enabled && message.rag?.hasContext;
  const confidence = message.confidenceScore || 0;

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceIcon = (score: number): string => {
    if (score >= 0.8) return '🟢';
    if (score >= 0.6) return '🟡';
    return '🔴';
  };

  const formatRelevance = (relevance: number): string => {
    return `${(relevance * 100).toFixed(1)}%`;
  };

  const formatProcessingTime = (time: number): string => {
    return `${time}ms`;
  };

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-6`}>
      <div
        className={`flex items-start space-x-3 max-w-4xl ${
          isAssistant ? '' : 'flex-row-reverse space-x-reverse'
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isAssistant
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }`}
        >
          <span className='text-lg'>{isAssistant ? 'AI' : '👤'}</span>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col space-y-3 ${isAssistant ? '' : 'items-end'}`}>
          {/* Main Message */}
          <div
            className={`relative px-4 py-3 rounded-2xl ${
              isAssistant
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            }`}
          >
            <div className='whitespace-pre-wrap'>{message.content}</div>

            {/* Message Footer */}
            <div className='flex items-center justify-between mt-3 pt-2 border-t border-white/10'>
              <div className={`text-xs ${isAssistant ? 'text-gray-400' : 'text-blue-100'}`}>
                {message.timestamp.toLocaleTimeString()}
                {message.processingTime && (
                  <span className='ml-2'>• {formatProcessingTime(message.processingTime)}</span>
                )}
              </div>

              {/* Confidence Score */}
              {isAssistant && confidence > 0 && (
                <div className='flex items-center space-x-1 text-xs'>
                  <span>{getConfidenceIcon(confidence)}</span>
                  <span className={getConfidenceColor(confidence)}>
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RAG Information Panel */}
          {showRAGDetails && isAssistant && message.rag && (
            <div className='bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-full max-w-2xl'>
              <div className='flex items-center justify-between mb-3'>
                <h4 className='text-sm font-medium text-white flex items-center space-x-2'>
                  <span>🧠</span>
                  <span>RAG Information</span>
                </h4>
                <div className='flex items-center space-x-2'>
                  {message.rag.enabled ? (
                    <div className='flex items-center space-x-1'>
                      <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                      <span className='text-xs text-green-400'>Active</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-1'>
                      <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                      <span className='text-xs text-gray-400'>Disabled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RAG Metrics */}
              {hasRAG && (
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4'>
                  <div className='bg-white/5 rounded-lg p-3'>
                    <div className='text-xs text-gray-400'>Sources</div>
                    <div className='text-sm font-medium text-white'>{message.rag.sources || 0}</div>
                  </div>
                  <div className='bg-white/5 rounded-lg p-3'>
                    <div className='text-xs text-gray-400'>Tokens</div>
                    <div className='text-sm font-medium text-white'>{message.rag.tokens || 0}</div>
                  </div>
                  <div className='bg-white/5 rounded-lg p-3'>
                    <div className='text-xs text-gray-400'>Search Time</div>
                    <div className='text-sm font-medium text-white'>
                      {message.rag.searchTime || 0}ms
                    </div>
                  </div>
                  <div className='bg-white/5 rounded-lg p-3'>
                    <div className='text-xs text-gray-400'>Relevance</div>
                    <div className='text-sm font-medium text-white'>
                      {message.rag.averageRelevance
                        ? formatRelevance(message.rag.averageRelevance)
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback Warning */}
              {message.rag.usedFallback && (
                <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-yellow-400'>⚠️</span>
                    <span className='text-sm text-yellow-300'>
                      Fallback mode used - limited context available
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className='flex items-center space-x-2'>
                {message.sources && message.sources.length > 0 && (
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className='text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/20 transition-colors'
                  >
                    📄 Sources ({message.sources.length})
                  </button>
                )}
                {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className='text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/20 transition-colors'
                  >
                    💡 Suggestions ({message.suggestedQuestions.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Source Documents */}
          {showSources && message.sources && message.sources.length > 0 && (
            <div className='bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-full max-w-2xl'>
              <h4 className='text-sm font-medium text-white mb-3 flex items-center space-x-2'>
                <span>📄</span>
                <span>Source Documents</span>
              </h4>
              <div className='space-y-3'>
                {message.sources.map(source => (
                  <div
                    key={source.id}
                    className='bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors'
                    onClick={() => onSourceClick?.(source)}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex-1'>
                        <div className='text-sm font-medium text-white truncate'>
                          {source.title}
                        </div>
                        <div className='text-xs text-gray-400 mt-1'>
                          {source.type.toUpperCase()} •{' '}
                          {new Date(source.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          source.relevance >= 0.8
                            ? 'bg-green-500/20 text-green-400'
                            : source.relevance >= 0.6
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {formatRelevance(source.relevance)}
                      </div>
                    </div>
                    <div className='text-xs text-gray-300 line-clamp-2'>{source.preview}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          {showSuggestions &&
            message.suggestedQuestions &&
            message.suggestedQuestions.length > 0 && (
              <div className='bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-full max-w-2xl'>
                <h4 className='text-sm font-medium text-white mb-3 flex items-center space-x-2'>
                  <span>💡</span>
                  <span>Suggested Follow-up Questions</span>
                </h4>
                <div className='space-y-2'>
                  {message.suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => onSuggestedQuestionClick?.(question)}
                      className='w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm text-white'
                    >
                      <div className='flex items-start space-x-2'>
                        <span className='text-blue-400 flex-shrink-0'>❓</span>
                        <span>{question}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

/**
 * Component for displaying RAG status indicator
 */
export function RAGStatusIndicator({
  enabled,
  hasContext,
  sources = 0,
  confidence = 0,
}: {
  enabled: boolean;
  hasContext: boolean;
  sources?: number;
  confidence?: number;
}) {
  const getStatusColor = () => {
    if (!enabled) return 'text-gray-400';
    if (hasContext && confidence >= 0.8) return 'text-green-400';
    if (hasContext && confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = () => {
    if (!enabled) return '🔴';
    if (hasContext && confidence >= 0.8) return '🟢';
    if (hasContext && confidence >= 0.6) return '🟡';
    return '🔴';
  };

  const getStatusText = () => {
    if (!enabled) return 'RAG Disabled';
    if (!hasContext) return 'No Context';
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className='flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10'>
      <span className='text-sm'>{getStatusIcon()}</span>
      <span className={`text-xs font-medium ${getStatusColor()}`}>{getStatusText()}</span>
      {sources > 0 && <span className='text-xs text-gray-400'>• {sources} sources</span>}
    </div>
  );
}

/**
 * Component for displaying confidence score
 */
export function ConfidenceScore({
  score,
  showLabel = true,
}: {
  score: number;
  showLabel?: boolean;
}) {
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number): string => {
    if (score >= 0.8) return '🟢';
    if (score >= 0.6) return '🟡';
    return '🔴';
  };

  const percentage = Math.round(score * 100);

  return (
    <div className='flex items-center space-x-2'>
      <span className='text-sm'>{getScoreIcon(score)}</span>
      <span className={`text-sm font-medium ${getScoreColor(score)}`}>{percentage}%</span>
      {showLabel && <span className='text-xs text-gray-400'>confidence</span>}
    </div>
  );
}

/**
 * Component for displaying processing time
 */
export function ProcessingTime({
  searchTime,
  contextTime,
  totalTime,
}: {
  searchTime?: number;
  contextTime?: number;
  totalTime?: number;
}) {
  return (
    <div className='flex items-center space-x-3 text-xs text-gray-400'>
      {searchTime && <span>🔍 {searchTime}ms</span>}
      {contextTime && <span>🧠 {contextTime}ms</span>}
      {totalTime && <span>⏱️ {totalTime}ms</span>}
    </div>
  );
}
