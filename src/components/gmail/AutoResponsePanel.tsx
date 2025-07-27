// ✅ Phase 5 lazy load - Auto Response Panel Component
'use client';

import { useState } from 'react';
import { Send, Edit, CheckCircle, AlertCircle, Zap, MessageSquare } from 'lucide-react';

interface AutoResponse {
  type: 'acknowledgment' | 'information' | 'meeting_confirmation' | 'escalation';
  content: string;
  confidence: number;
  shouldSend: boolean;
  reasoning: string;
}

interface AutoResponsePanelProps {
  autoResponse: AutoResponse;
  customReply: string;
  onCustomReplyChange: (value: string) => void;
  onSendReply: () => void;
  loading?: boolean;
  onClose: () => void;
}

export default function AutoResponsePanel({
  autoResponse,
  customReply,
  onCustomReplyChange,
  onSendReply,
  loading,
  onClose,
}: AutoResponsePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(autoResponse.content);

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'acknowledgment':
        return 'text-green-400 bg-green-400/20';
      case 'information':
        return 'text-blue-400 bg-blue-400/20';
      case 'meeting_confirmation':
        return 'text-purple-400 bg-purple-400/20';
      case 'escalation':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // Here you would typically update the autoResponse content
  };

  if (loading) {
    return (
      <div className='bg-gray-800 rounded-lg p-6 space-y-4'>
        <div className='flex items-center space-x-2'>
          <Zap className='w-5 h-5 text-blue-400 animate-spin' />
          <span className='text-white font-medium'>Generating response...</span>
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
          <MessageSquare className='w-5 h-5 text-blue-400' />
          <h3 className='text-white font-semibold'>Auto Response</h3>
        </div>
        <button onClick={onClose} className='text-gray-400 hover:text-white transition-colors'>
          ×
        </button>
      </div>

      {/* Response Type & Confidence */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <label className='text-gray-400 text-sm'>Response Type</label>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getResponseTypeColor(autoResponse.type)}`}
          >
            {autoResponse.type.replace('_', ' ')}
          </div>
        </div>
        <div className='space-y-2'>
          <label className='text-gray-400 text-sm'>Confidence</label>
          <div className={`font-medium ${getConfidenceColor(autoResponse.confidence)}`}>
            {Math.round(autoResponse.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className='space-y-2'>
        <label className='text-gray-400 text-sm'>AI Reasoning</label>
        <div className='text-gray-300 bg-gray-700 px-3 py-2 rounded text-sm'>
          {autoResponse.reasoning}
        </div>
      </div>

      {/* Generated Response */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <label className='text-gray-400 text-sm'>Generated Response</label>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className='text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center space-x-1'
          >
            <Edit className='w-4 h-4' />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {isEditing ? (
          <div className='space-y-2'>
            <textarea
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
              className='w-full h-32 bg-gray-700 text-white rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Edit the response...'
            />
            <div className='flex space-x-2'>
              <button
                onClick={handleSaveEdit}
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm'
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm'
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className='text-white bg-gray-700 px-3 py-2 rounded whitespace-pre-wrap'>
            {autoResponse.content}
          </div>
        )}
      </div>

      {/* Custom Reply Section */}
      <div className='space-y-2'>
        <label className='text-gray-400 text-sm'>Custom Reply (Optional)</label>
        <textarea
          value={customReply}
          onChange={e => onCustomReplyChange(e.target.value)}
          className='w-full h-24 bg-gray-700 text-white rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Add your custom reply or modifications...'
        />
      </div>

      {/* Send Recommendation */}
      <div
        className={`p-4 rounded-lg border ${
          autoResponse.shouldSend
            ? 'bg-green-500/20 border-green-500/30'
            : 'bg-yellow-500/20 border-yellow-500/30'
        }`}
      >
        <div className='flex items-center space-x-2 mb-2'>
          {autoResponse.shouldSend ? (
            <CheckCircle className='w-4 h-4 text-green-400' />
          ) : (
            <AlertCircle className='w-4 h-4 text-yellow-400' />
          )}
          <span
            className={`font-medium ${
              autoResponse.shouldSend ? 'text-green-400' : 'text-yellow-400'
            }`}
          >
            {autoResponse.shouldSend ? 'Recommended to Send' : 'Review Before Sending'}
          </span>
        </div>
        <p className='text-sm text-gray-300'>
          {autoResponse.shouldSend
            ? 'This response appears appropriate and professional. You can send it directly or make modifications.'
            : 'This response may need review. Consider customizing it or adding personal touches before sending.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className='flex space-x-3'>
        <button
          onClick={onSendReply}
          disabled={loading}
          className='flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2'
        >
          <Send className='w-4 h-4' />
          <span>{loading ? 'Sending...' : 'Send Reply'}</span>
        </button>
        <button
          onClick={onClose}
          className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
