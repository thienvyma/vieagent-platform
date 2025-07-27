// ✅ Phase 5 lazy load - Email Analysis Panel Component
'use client';

import { useState } from 'react';
import { Brain, TrendingUp, AlertCircle, Clock, CheckCircle, Sparkles } from 'lucide-react';

interface EmailAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'urgent' | 'normal' | 'low';
  category: string;
  keyTopics: string[];
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  meetingDetected?: {
    hasDateTime: boolean;
    suggestedEvent?: {
      title: string;
      startTime?: string;
      endTime?: string;
      location?: string;
      attendees: string[];
    };
  };
}

interface EmailAnalysisPanelProps {
  analysis: EmailAnalysis;
  loading?: boolean;
  onClose: () => void;
}

export default function EmailAnalysisPanel({
  analysis,
  loading,
  onClose,
}: EmailAnalysisPanelProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400 bg-green-400/20';
      case 'negative':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'text-red-400 bg-red-400/20';
      case 'normal':
        return 'text-yellow-400 bg-yellow-400/20';
      default:
        return 'text-green-400 bg-green-400/20';
    }
  };

  if (loading) {
    return (
      <div className='bg-gray-800 rounded-lg p-6 space-y-4'>
        <div className='flex items-center space-x-2'>
          <Brain className='w-5 h-5 text-blue-400 animate-spin' />
          <span className='text-white font-medium'>Analyzing email...</span>
        </div>
        <div className='space-y-2'>
          <div className='h-4 bg-gray-700 rounded animate-pulse'></div>
          <div className='h-4 bg-gray-700 rounded animate-pulse w-3/4'></div>
          <div className='h-4 bg-gray-700 rounded animate-pulse w-1/2'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-800 rounded-lg p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Sparkles className='w-5 h-5 text-blue-400' />
          <h3 className='text-white font-semibold'>Email Analysis</h3>
        </div>
        <button onClick={onClose} className='text-gray-400 hover:text-white transition-colors'>
          ×
        </button>
      </div>

      {/* Sentiment & Urgency */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label className='text-gray-400 text-sm'>Sentiment</label>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(analysis.sentiment)}`}
          >
            {analysis.sentiment}
          </div>
        </div>
        <div className='space-y-2'>
          <label className='text-gray-400 text-sm'>Urgency</label>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(analysis.urgency)}`}
          >
            {analysis.urgency}
          </div>
        </div>
      </div>

      {/* Category */}
      <div className='space-y-2'>
        <label className='text-gray-400 text-sm'>Category</label>
        <div className='text-white bg-gray-700 px-3 py-2 rounded'>{analysis.category}</div>
      </div>

      {/* Key Topics */}
      <div className='space-y-2'>
        <label className='text-gray-400 text-sm'>Key Topics</label>
        <div className='flex flex-wrap gap-2'>
          {analysis.keyTopics.map((topic, index) => (
            <span key={index} className='px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm'>
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Entities */}
      {analysis.entities.length > 0 && (
        <div className='space-y-2'>
          <label className='text-gray-400 text-sm'>Detected Entities</label>
          <div className='space-y-2'>
            {analysis.entities.map((entity, index) => (
              <div
                key={index}
                className='flex justify-between items-center bg-gray-700 px-3 py-2 rounded'
              >
                <div>
                  <span className='text-white font-medium'>{entity.value}</span>
                  <span className='text-gray-400 text-sm ml-2'>({entity.type})</span>
                </div>
                <div className='text-gray-400 text-sm'>{Math.round(entity.confidence * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Detection */}
      {analysis.meetingDetected?.hasDateTime && (
        <div className='space-y-2'>
          <label className='text-gray-400 text-sm'>Meeting Detected</label>
          <div className='bg-green-500/20 border border-green-500/30 rounded-lg p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              <Clock className='w-4 h-4 text-green-400' />
              <span className='text-green-400 font-medium'>Meeting Scheduled</span>
            </div>
            {analysis.meetingDetected.suggestedEvent && (
              <div className='space-y-1 text-sm'>
                <div className='text-white'>
                  <strong>Title:</strong> {analysis.meetingDetected.suggestedEvent.title}
                </div>
                {analysis.meetingDetected.suggestedEvent.startTime && (
                  <div className='text-gray-300'>
                    <strong>Time:</strong> {analysis.meetingDetected.suggestedEvent.startTime}
                  </div>
                )}
                {analysis.meetingDetected.suggestedEvent.location && (
                  <div className='text-gray-300'>
                    <strong>Location:</strong> {analysis.meetingDetected.suggestedEvent.location}
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
