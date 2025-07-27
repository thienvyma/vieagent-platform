/**
 * 💬 Message Reactions & Threading Component - Phase 8 Day 27 Step 27.3
 * Emoji reactions, message threading, chat export functionality
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Smile,
  Reply,
  MoreHorizontal,
  Download,
  Copy,
  Trash2,
  Edit3,
  Pin,
  Flag,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Angry,
  X,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Reaction {
  id: string;
  emoji: string;
  count: number;
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  hasReacted: boolean;
}

interface MessageThread {
  id: string;
  parentMessageId: string;
  messages: Array<{
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    timestamp: Date;
    reactions?: Reaction[];
  }>;
  isOpen: boolean;
  unreadCount: number;
}

interface MessageAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions?: Reaction[];
  thread?: MessageThread;
  actions?: MessageAction[];
  canReact?: boolean;
  canReply?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  showQuickReactions?: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onThreadToggle?: (messageId: string) => void;
  onExport?: (messageId: string) => void;
  className?: string;
}

// Quick reaction emojis
const QUICK_REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

// Extended emoji picker
const EMOJI_CATEGORIES = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
  ],
  Gestures: [
    '👍',
    '👎',
    '👌',
    '✌️',
    '🤞',
    '🤟',
    '🤘',
    '🤙',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👏',
    '🙌',
    '🤲',
    '🤝',
    '🙏',
  ],
  Hearts: [
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '🤍',
    '🤎',
    '💔',
    '❣️',
    '💕',
    '💞',
    '💓',
    '💗',
    '💖',
    '💘',
    '💝',
    '💟',
  ],
  Objects: [
    '🔥',
    '⭐',
    '🌟',
    '✨',
    '💫',
    '💥',
    '💢',
    '💦',
    '💨',
    '🕳️',
    '💣',
    '💬',
    '👁️‍🗨️',
    '🗨️',
    '🗯️',
    '💭',
    '💤',
  ],
};

export default function MessageReactions({
  messageId,
  reactions = [],
  thread,
  actions = [],
  canReact = true,
  canReply = true,
  canEdit = false,
  canDelete = false,
  showQuickReactions = true,
  onReaction,
  onReply,
  onEdit,
  onDelete,
  onThreadToggle,
  onExport,
  className = '',
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Handle reaction click
  const handleReaction = useCallback(
    (emoji: string) => {
      onReaction?.(messageId, emoji);
      setShowEmojiPicker(false);
    },
    [messageId, onReaction]
  );

  // Handle quick reaction
  const handleQuickReaction = useCallback(
    (emoji: string) => {
      handleReaction(emoji);
    },
    [handleReaction]
  );

  // Default actions
  const defaultActions: MessageAction[] = [
    ...(canReply
      ? [
          {
            id: 'reply',
            label: 'Reply',
            icon: <Reply className='w-4 h-4' />,
            onClick: () => onReply?.(messageId),
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            id: 'edit',
            label: 'Edit',
            icon: <Edit3 className='w-4 h-4' />,
            onClick: () => onEdit?.(messageId),
          },
        ]
      : []),
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className='w-4 h-4' />,
      onClick: () => {
        navigator.clipboard.writeText(messageId);
        toast.success('Message copied to clipboard');
      },
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className='w-4 h-4' />,
      onClick: () => onExport?.(messageId),
    },
    ...(canDelete
      ? [
          {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 className='w-4 h-4' />,
            onClick: () => onDelete?.(messageId),
            variant: 'danger' as const,
          },
        ]
      : []),
  ];

  const allActions = [...defaultActions, ...actions];

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Existing Reactions */}
      {reactions.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {reactions.map(reaction => (
            <button
              key={reaction.id}
              onClick={() => handleReaction(reaction.emoji)}
              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border transition-colors ${
                reaction.hasReacted
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:bg-gray-700/50'
              }`}
              title={`${reaction.users.map(u => u.name).join(', ')} reacted with ${reaction.emoji}`}
            >
              <span className='text-sm'>{reaction.emoji}</span>
              <span className='text-xs'>{reaction.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          {/* Quick Reactions */}
          {canReact && showQuickReactions && (
            <div className='flex items-center space-x-1'>
              {QUICK_REACTIONS.slice(0, 3).map(reaction => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleQuickReaction(reaction.emoji)}
                  className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
                  title={reaction.label}
                >
                  <span className='text-sm'>{reaction.emoji}</span>
                </button>
              ))}
            </div>
          )}

          {/* Emoji Picker Toggle */}
          {canReact && (
            <div className='relative'>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
                title='Add reaction'
              >
                <Smile className='w-4 h-4' />
              </button>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className='absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 w-80'
                >
                  {/* Category tabs */}
                  <div className='flex border-b border-gray-600'>
                    {Object.keys(EMOJI_CATEGORIES).map(category => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                          activeCategory === category
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Emoji grid */}
                  <div className='p-3 max-h-48 overflow-y-auto'>
                    <div className='grid grid-cols-8 gap-1'>
                      {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map(
                        emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(emoji)}
                            className='p-2 hover:bg-gray-700 rounded text-lg transition-colors'
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reply Button */}
          {canReply && (
            <button
              onClick={() => onReply?.(messageId)}
              className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
              title='Reply'
            >
              <Reply className='w-4 h-4' />
            </button>
          )}

          {/* Thread Toggle */}
          {thread && (
            <button
              onClick={() => onThreadToggle?.(messageId)}
              className='flex items-center space-x-1 p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
              title={`${thread.isOpen ? 'Hide' : 'Show'} thread`}
            >
              <Reply className='w-4 h-4' />
              <span className='text-xs'>{thread.messages.length}</span>
              {thread.unreadCount > 0 && <span className='w-2 h-2 bg-red-500 rounded-full'></span>}
            </button>
          )}
        </div>

        {/* More Actions */}
        {allActions.length > 0 && (
          <div className='relative'>
            <button
              onClick={() => setShowActions(!showActions)}
              className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
              title='More actions'
            >
              <MoreHorizontal className='w-4 h-4' />
            </button>

            {showActions && (
              <div className='absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-32'>
                {allActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      action.onClick();
                      setShowActions(false);
                    }}
                    disabled={action.disabled}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm text-left transition-colors ${
                      action.variant === 'danger'
                        ? 'text-red-400 hover:bg-red-500/10'
                        : action.variant === 'warning'
                          ? 'text-yellow-400 hover:bg-yellow-500/10'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thread Messages */}
      {thread && thread.isOpen && (
        <div className='ml-4 border-l-2 border-gray-600 pl-4 space-y-2'>
          {thread.messages.map(message => (
            <div key={message.id} className='bg-gray-800/30 rounded-lg p-3'>
              <div className='flex items-start space-x-2'>
                <div className='w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center'>
                  <span className='text-xs text-white'>
                    {message.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className='flex-1'>
                  <div className='flex items-center space-x-2 mb-1'>
                    <span className='text-sm font-medium text-white'>{message.author.name}</span>
                    <span className='text-xs text-gray-400'>
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className='text-sm text-gray-300'>{message.content}</p>

                  {/* Thread message reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-2'>
                      {message.reactions.map(reaction => (
                        <button
                          key={reaction.id}
                          onClick={() => handleReaction(reaction.emoji)}
                          className={`inline-flex items-center space-x-1 px-1 py-0.5 rounded text-xs transition-colors ${
                            reaction.hasReacted
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                          }`}
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Reaction Summary Component
export function ReactionSummary({
  reactions,
  onReactionClick,
  className = '',
}: {
  reactions: Reaction[];
  onReactionClick?: (emoji: string) => void;
  className?: string;
}) {
  if (reactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {reactions.map(reaction => (
        <button
          key={reaction.id}
          onClick={() => onReactionClick?.(reaction.emoji)}
          className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs transition-colors ${
            reaction.hasReacted
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:bg-gray-700/50'
          }`}
          title={`${reaction.users.map(u => u.name).join(', ')} reacted with ${reaction.emoji}`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

// Thread Preview Component
export function ThreadPreview({
  thread,
  onToggle,
  className = '',
}: {
  thread: MessageThread;
  onToggle?: (threadId: string) => void;
  className?: string;
}) {
  return (
    <button
      onClick={() => onToggle?.(thread.id)}
      className={`flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded transition-colors ${className}`}
    >
      <Reply className='w-4 h-4 text-gray-400' />
      <span className='text-sm text-gray-400'>
        {thread.messages.length} {thread.messages.length === 1 ? 'reply' : 'replies'}
      </span>
      {thread.unreadCount > 0 && <span className='w-2 h-2 bg-red-500 rounded-full'></span>}
    </button>
  );
}

// Quick Reaction Bar Component
export function QuickReactionBar({
  onReaction,
  className = '',
}: {
  onReaction: (emoji: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {QUICK_REACTIONS.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => onReaction(reaction.emoji)}
          className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
          title={reaction.label}
        >
          <span className='text-sm'>{reaction.emoji}</span>
        </button>
      ))}
    </div>
  );
}

// Export Chat Component
export function ExportChatButton({
  onExport,
  loading = false,
  className = '',
}: {
  onExport: () => void;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onExport}
      disabled={loading}
      className={`flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50 ${className}`}
    >
      <Download className='w-4 h-4' />
      <span>{loading ? 'Exporting...' : 'Export Chat'}</span>
    </button>
  );
}

// Export types
export type { Reaction, MessageThread, MessageAction, MessageReactionsProps };
