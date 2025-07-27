/**
 * 💬 Real-time Indicators Component - Phase 8 Day 27 Step 27.2
 * Typing indicators, online status, message delivery status
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Circle,
  Wifi,
  WifiOff,
  Check,
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  Zap,
  Signal,
  SignalHigh,
  SignalLow,
  X,
} from 'lucide-react';

// Types
interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
  timestamp: number;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
}

interface MessageStatus {
  id: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  readBy?: Array<{
    userId: string;
    name: string;
    readAt: Date;
  }>;
}

interface RealTimeIndicatorsProps {
  // Typing indicators
  typingUsers?: TypingUser[];
  onTypingStart?: (userId: string) => void;
  onTypingStop?: (userId: string) => void;

  // Online status
  onlineUsers?: OnlineUser[];
  currentUserId?: string;
  showOnlineCount?: boolean;

  // Message status
  messageStatuses?: MessageStatus[];

  // Connection status
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  latency?: number;

  // Settings
  showTypingIndicators?: boolean;
  showOnlineStatus?: boolean;
  showMessageStatus?: boolean;
  showConnectionStatus?: boolean;

  className?: string;
}

export default function RealTimeIndicators({
  typingUsers = [],
  onTypingStart,
  onTypingStop,
  onlineUsers = [],
  currentUserId,
  showOnlineCount = true,
  messageStatuses = [],
  connectionStatus = 'connected',
  latency = 0,
  showTypingIndicators = true,
  showOnlineStatus = true,
  showMessageStatus = true,
  showConnectionStatus = true,
  className = '',
}: RealTimeIndicatorsProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.(currentUserId || 'current-user');
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.(currentUserId || 'current-user');
    }, 3000);

    setTypingTimeout(timeout);
  }, [isTyping, typingTimeout, onTypingStart, onTypingStop, currentUserId]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Filter out current user from typing users
  const otherTypingUsers = typingUsers.filter(user => user.id !== currentUserId);

  // Count online users
  const onlineCount = onlineUsers.filter(user => user.status === 'online').length;

  // Get connection status icon and color
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className='w-4 h-4 text-green-400' />;
      case 'connecting':
        return <Signal className='w-4 h-4 text-yellow-400 animate-pulse' />;
      case 'disconnected':
        return <WifiOff className='w-4 h-4 text-red-400' />;
      default:
        return <Wifi className='w-4 h-4 text-gray-400' />;
    }
  };

  // Get latency color
  const getLatencyColor = () => {
    if (latency < 100) return 'text-green-400';
    if (latency < 300) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get message status icon
  const getMessageStatusIcon = (status: MessageStatus['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className='w-3 h-3 text-gray-400 animate-spin' />;
      case 'sent':
        return <Check className='w-3 h-3 text-gray-400' />;
      case 'delivered':
        return <CheckCheck className='w-3 h-3 text-blue-400' />;
      case 'read':
        return <CheckCheck className='w-3 h-3 text-green-400' />;
      case 'failed':
        return <X className='w-3 h-3 text-red-400' />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <div className='flex items-center justify-between text-xs'>
          <div className='flex items-center space-x-2'>
            {getConnectionStatusIcon()}
            <span className='text-gray-400'>
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'disconnected' && 'Disconnected'}
            </span>
            {connectionStatus === 'connected' && latency > 0 && (
              <span className={`${getLatencyColor()}`}>{latency}ms</span>
            )}
          </div>

          {/* Online users count */}
          {showOnlineStatus && showOnlineCount && (
            <div className='flex items-center space-x-1'>
              <Circle className='w-2 h-2 text-green-400 fill-current' />
              <span className='text-gray-400'>{onlineCount} online</span>
            </div>
          )}
        </div>
      )}

      {/* Typing Indicators */}
      {showTypingIndicators && otherTypingUsers.length > 0 && (
        <div className='flex items-center space-x-2 text-sm text-gray-400'>
          <div className='flex items-center space-x-1'>
            <div className='flex space-x-1'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-bounce'></div>
              <div
                className='w-2 h-2 bg-green-400 rounded-full animate-bounce'
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className='w-2 h-2 bg-green-400 rounded-full animate-bounce'
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            <span>
              {otherTypingUsers.length === 1
                ? `${otherTypingUsers[0].name} is typing...`
                : `${otherTypingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Online Status List */}
      {showOnlineStatus && onlineUsers.length > 0 && (
        <div className='space-y-1'>
          {onlineUsers.slice(0, 5).map(user => (
            <div key={user.id} className='flex items-center space-x-2 text-xs'>
              <div className='relative'>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className='w-6 h-6 rounded-full' />
                ) : (
                  <div className='w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center'>
                    <span className='text-xs text-white'>{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                    user.status === 'online'
                      ? 'bg-green-400'
                      : user.status === 'away'
                        ? 'bg-yellow-400'
                        : user.status === 'busy'
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                  }`}
                ></div>
              </div>
              <span className='text-gray-400'>{user.name}</span>
              {user.status !== 'online' && user.lastSeen && (
                <span className='text-gray-500 text-xs'>{formatLastSeen(user.lastSeen)}</span>
              )}
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className='text-xs text-gray-500'>+{onlineUsers.length - 5} more</div>
          )}
        </div>
      )}

      {/* Message Status */}
      {showMessageStatus && messageStatuses.length > 0 && (
        <div className='space-y-1'>
          {messageStatuses.slice(-3).map(status => (
            <div key={status.id} className='flex items-center space-x-2 text-xs'>
              {getMessageStatusIcon(status.status)}
              <span className='text-gray-400'>
                {status.status === 'sending' && 'Sending...'}
                {status.status === 'sent' && 'Sent'}
                {status.status === 'delivered' && 'Delivered'}
                {status.status === 'read' && `Read by ${status.readBy?.length || 0}`}
                {status.status === 'failed' && 'Failed to send'}
              </span>
              <span className='text-gray-500'>{formatTimestamp(status.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Typing Indicator Component
export function TypingIndicator({
  users,
  className = '',
}: {
  users: TypingUser[];
  className?: string;
}) {
  if (users.length === 0) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className='flex space-x-1'>
        <div className='w-2 h-2 bg-green-400 rounded-full animate-bounce'></div>
        <div
          className='w-2 h-2 bg-green-400 rounded-full animate-bounce'
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div
          className='w-2 h-2 bg-green-400 rounded-full animate-bounce'
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      <span className='text-sm text-gray-400'>
        {users.length === 1
          ? `${users[0].name} is typing...`
          : `${users.length} people are typing...`}
      </span>
    </div>
  );
}

// Online Status Badge Component
export function OnlineStatusBadge({
  status,
  size = 'sm',
  className = '',
}: {
  status: OnlineUser['status'];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-green-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400',
    offline: 'bg-gray-400',
  };

  return (
    <div className={`${sizeClasses[size]} ${statusColors[status]} rounded-full ${className}`}></div>
  );
}

// Message Status Badge Component
export function MessageStatusBadge({
  status,
  className = '',
}: {
  status: MessageStatus['status'];
  className?: string;
}) {
  const icon = getMessageStatusIcon(status);

  if (!icon) return null;

  return <div className={`inline-flex items-center ${className}`}>{icon}</div>;
}

// Connection Status Component
export function ConnectionStatus({
  status,
  latency,
  className = '',
}: {
  status: 'connected' | 'connecting' | 'disconnected';
  latency?: number;
  className?: string;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'connecting':
        return 'text-yellow-400';
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return latency && latency > 300 ? (
          <SignalLow className='w-4 h-4' />
        ) : (
          <SignalHigh className='w-4 h-4' />
        );
      case 'connecting':
        return <Signal className='w-4 h-4 animate-pulse' />;
      case 'disconnected':
        return <WifiOff className='w-4 h-4' />;
      default:
        return <Wifi className='w-4 h-4' />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className='text-sm'>
        {status === 'connected' && 'Connected'}
        {status === 'connecting' && 'Connecting...'}
        {status === 'disconnected' && 'Disconnected'}
      </span>
      {status === 'connected' && latency && <span className='text-xs'>({latency}ms)</span>}
    </div>
  );
}

// Utility functions
function formatLastSeen(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getMessageStatusIcon(status: MessageStatus['status']) {
  switch (status) {
    case 'sending':
      return <Clock className='w-3 h-3 text-gray-400 animate-spin' />;
    case 'sent':
      return <Check className='w-3 h-3 text-gray-400' />;
    case 'delivered':
      return <CheckCheck className='w-3 h-3 text-blue-400' />;
    case 'read':
      return <CheckCheck className='w-3 h-3 text-green-400' />;
    case 'failed':
      return <X className='w-3 h-3 text-red-400' />;
    default:
      return null;
  }
}

// Export types
export type { TypingUser, OnlineUser, MessageStatus, RealTimeIndicatorsProps };
