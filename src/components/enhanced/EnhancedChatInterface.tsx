'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Brain,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { EnhancedChatRequest, EnhancedChatResponse, PredictiveInsight } from '@/lib/context/types';

interface EnhancedChatInterfaceProps {
  agentId: string;
  agentName: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ContextVisualization {
  topics: string[];
  sentiment: number;
  intent: string;
  stage: string;
  confidence: number;
  insights: PredictiveInsight[];
}

export default function EnhancedChatInterface({ agentId, agentName }: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showEnhancedMode, setShowEnhancedMode] = useState(true);
  const [contextData, setContextData] = useState<ContextVisualization | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const request: EnhancedChatRequest = {
        message: inputMessage,
        conversationId: conversationId || undefined,
        agentId,
        userId: 'current-user',
        contextOptions: {
          includeHistory: true,
          analyzeSentiment: true,
          detectIntent: true,
          extractTopics: true,
          extractEntities: true,
          generatePredictions: true,
          personalize: true,
          maxHistoryLength: 10,
        },
      };

      const response = await fetch(`/api/agents/${agentId}/enhanced-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EnhancedChatResponse = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: data.message.id,
        content: data.message.content,
        role: 'assistant',
        timestamp: data.message.createdAt,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversation.id);

      // Update enhanced context visualization
      if (showEnhancedMode && data.context) {
        setContextData({
          topics: data.context.extractedTopics || [],
          sentiment: data.context.sentimentScore || 0,
          intent: data.context.userIntent || 'unknown',
          stage: data.context.conversationFlow?.currentStage || 'unknown',
          confidence: data.context.contextRelevanceScore || 0,
          insights: data.insights || [],
        });
        setQualityMetrics(data.qualityMetrics);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-500';
    if (score < -0.3) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSentimentEmoji = (score: number) => {
    if (score > 0.3) return '😊';
    if (score < -0.3) return '😔';
    return '😐';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'escalation_risk':
        return <AlertTriangle className='w-4 h-4 text-red-500' />;
      case 'next_question':
        return <Target className='w-4 h-4 text-blue-500' />;
      case 'resolution_path':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'user_need':
        return <TrendingUp className='w-4 h-4 text-purple-500' />;
      default:
        return <Brain className='w-4 h-4 text-gray-500' />;
    }
  };

  return (
    <div className='flex h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Chat Area */}
      <div className='flex-1 flex flex-col'>
        {/* Header */}
        <div className='bg-black/20 backdrop-blur-sm border-b border-purple-500/20 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-purple-500/20 rounded-xl'>
                <Bot className='w-6 h-6 text-purple-400' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-white'>{agentName}</h2>
                <p className='text-purple-300 text-sm'>Enhanced AI Assistant</p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <button
                onClick={() => setShowEnhancedMode(!showEnhancedMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  showEnhancedMode
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🧠 Enhanced Mode
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {messages.length === 0 && (
            <div className='text-center py-12'>
              <div className='p-4 bg-purple-500/10 rounded-2xl inline-block mb-4'>
                <Brain className='w-12 h-12 text-purple-400' />
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>Enhanced AI Chat</h3>
              <p className='text-purple-300 max-w-md mx-auto'>
                Start a conversation with AI-powered context analysis, sentiment detection, and
                predictive insights.
              </p>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-black/40 backdrop-blur-sm border border-purple-500/20 text-white'
                }`}
              >
                <div className='flex items-start space-x-3'>
                  {message.role === 'assistant' && (
                    <div className='p-1 bg-purple-500/20 rounded-lg'>
                      <Bot className='w-4 h-4 text-purple-400' />
                    </div>
                  )}
                  {message.role === 'user' && (
                    <div className='p-1 bg-white/20 rounded-lg'>
                      <User className='w-4 h-4 text-white' />
                    </div>
                  )}

                  <div className='flex-1'>
                    <div className='prose prose-invert max-w-none'>
                      <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                        {message.content}
                      </p>
                    </div>
                    <div className='text-xs opacity-60 mt-2'>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className='flex justify-start'>
              <div className='bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4'>
                <div className='flex items-center space-x-3'>
                  <div className='p-1 bg-purple-500/20 rounded-lg'>
                    <Bot className='w-4 h-4 text-purple-400' />
                  </div>
                  <div className='flex space-x-1'>
                    <div
                      className='w-2 h-2 bg-purple-400 rounded-full animate-bounce'
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className='w-2 h-2 bg-purple-400 rounded-full animate-bounce'
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className='w-2 h-2 bg-purple-400 rounded-full animate-bounce'
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className='p-4 bg-black/20 backdrop-blur-sm border-t border-purple-500/20'>
          <div className='flex items-end space-x-3'>
            <div className='flex-1'>
              <textarea
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Type your message...'
                className='w-full bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400 resize-none'
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className='p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors'
            >
              <Send className='w-5 h-5 text-white' />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Context Panel */}
      {showEnhancedMode && (
        <div className='w-80 bg-black/40 backdrop-blur-sm border-l border-purple-500/20 overflow-y-auto'>
          <div className='p-4'>
            <h3 className='text-lg font-semibold text-white mb-4 flex items-center'>
              <Brain className='w-5 h-5 text-purple-400 mr-2' />
              Context Analysis
            </h3>

            {!contextData && (
              <div className='text-center py-8'>
                <div className='p-3 bg-purple-500/10 rounded-xl inline-block mb-3'>
                  <Brain className='w-8 h-8 text-purple-400' />
                </div>
                <p className='text-purple-300 text-sm'>
                  Send a message to see enhanced context analysis
                </p>
              </div>
            )}

            {contextData && (
              <div className='space-y-4'>
                {/* Sentiment Analysis */}
                <div className='bg-black/40 rounded-xl p-4'>
                  <h4 className='text-white font-medium mb-2'>Sentiment Analysis</h4>
                  <div className='flex items-center justify-between'>
                    <span className={`text-lg ${getSentimentColor(contextData.sentiment)}`}>
                      {getSentimentEmoji(contextData.sentiment)}
                    </span>
                    <div className='text-right'>
                      <div
                        className={`text-sm font-medium ${getSentimentColor(contextData.sentiment)}`}
                      >
                        {contextData.sentiment > 0
                          ? 'Positive'
                          : contextData.sentiment < 0
                            ? 'Negative'
                            : 'Neutral'}
                      </div>
                      <div className='text-xs text-gray-400'>
                        Score: {contextData.sentiment.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversation Flow */}
                <div className='bg-black/40 rounded-xl p-4'>
                  <h4 className='text-white font-medium mb-2'>Conversation Flow</h4>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-400 text-sm'>Stage:</span>
                      <span className='text-purple-300 text-sm capitalize'>
                        {contextData.stage}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400 text-sm'>Intent:</span>
                      <span className='text-purple-300 text-sm capitalize'>
                        {contextData.intent}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-400 text-sm'>Confidence:</span>
                      <span className='text-green-300 text-sm'>
                        {(contextData.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                {contextData.topics.length > 0 && (
                  <div className='bg-black/40 rounded-xl p-4'>
                    <h4 className='text-white font-medium mb-2'>Detected Topics</h4>
                    <div className='flex flex-wrap gap-2'>
                      {contextData.topics.map((topic, index) => (
                        <span
                          key={index}
                          className='px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg'
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Metrics */}
                {qualityMetrics && (
                  <div className='bg-black/40 rounded-xl p-4'>
                    <h4 className='text-white font-medium mb-2'>Quality Metrics</h4>
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-gray-400 text-sm'>Response Relevance:</span>
                        <span className='text-green-300 text-sm'>
                          {(qualityMetrics.responseRelevance * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400 text-sm'>Context Utilization:</span>
                        <span className='text-blue-300 text-sm'>
                          {(qualityMetrics.contextUtilization * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-400 text-sm'>Satisfaction Prediction:</span>
                        <span className='text-yellow-300 text-sm'>
                          {(qualityMetrics.userSatisfactionPrediction * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Predictive Insights */}
                {contextData.insights.length > 0 && (
                  <div className='bg-black/40 rounded-xl p-4'>
                    <h4 className='text-white font-medium mb-3'>Predictive Insights</h4>
                    <div className='space-y-3'>
                      {contextData.insights.map((insight, index) => (
                        <div key={index} className='border border-purple-500/20 rounded-lg p-3'>
                          <div className='flex items-start space-x-2'>
                            {getInsightIcon(insight.type)}
                            <div className='flex-1'>
                              <div className='text-white text-sm font-medium capitalize mb-1'>
                                {insight.type.replace('_', ' ')}
                              </div>
                              <div className='text-gray-300 text-xs mb-2'>{insight.prediction}</div>
                              <div className='flex justify-between items-center'>
                                <span className='text-xs text-gray-400'>
                                  Confidence: {(insight.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
