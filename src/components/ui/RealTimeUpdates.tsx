'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Activity,
  Bell,
  Pause,
  Play,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Users,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Signal,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface RealTimeConfig {
  pollingInterval: number;
  maxRetries: number;
  reconnectDelay: number;
  enableWebSocket: boolean;
  enablePolling: boolean;
  endpoints: {
    [key: string]: string;
  };
  channels: RealTimeChannel[];
}

export interface RealTimeChannel {
  id: string;
  name: string;
  endpoint: string;
  interval: number;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  type: 'chat' | 'analytics' | 'system' | 'notifications' | 'custom';
  icon: React.ReactNode;
  description: string;
  dataProcessor?: (data: any) => any;
}

export interface RealTimeUpdate {
  id: string;
  channel: string;
  timestamp: string;
  type: 'data' | 'status' | 'error' | 'connection';
  data: any;
  priority: 'high' | 'medium' | 'low';
  processed: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  method: 'websocket' | 'polling' | 'offline';
  lastUpdate: string;
  retryCount: number;
  latency: number;
  errors: string[];
}

export interface RealTimeUpdatesProps {
  config: RealTimeConfig;
  onUpdate?: (update: RealTimeUpdate) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  className?: string;
  showStatus?: boolean;
  showControls?: boolean;
  autoStart?: boolean;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CHANNELS: RealTimeChannel[] = [
  {
    id: 'chat',
    name: 'Chat Messages',
    endpoint: '/api/chat/updates',
    interval: 2000,
    enabled: true,
    priority: 'high',
    type: 'chat',
    icon: <MessageSquare className='w-4 h-4' />,
    description: 'Real-time chat message updates',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    endpoint: '/api/analytics/updates',
    interval: 10000,
    enabled: true,
    priority: 'medium',
    type: 'analytics',
    icon: <BarChart3 className='w-4 h-4' />,
    description: 'Analytics and metrics updates',
  },
  {
    id: 'system',
    name: 'System Status',
    endpoint: '/api/system/status',
    interval: 30000,
    enabled: true,
    priority: 'low',
    type: 'system',
    icon: <Activity className='w-4 h-4' />,
    description: 'System health and status',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    endpoint: '/api/notifications/updates',
    interval: 5000,
    enabled: true,
    priority: 'high',
    type: 'notifications',
    icon: <Bell className='w-4 h-4' />,
    description: 'User notifications and alerts',
  },
  {
    id: 'users',
    name: 'User Activity',
    endpoint: '/api/users/activity',
    interval: 15000,
    enabled: false,
    priority: 'low',
    type: 'custom',
    icon: <Users className='w-4 h-4' />,
    description: 'User activity and presence',
  },
];

const DEFAULT_CONFIG: RealTimeConfig = {
  pollingInterval: 5000,
  maxRetries: 3,
  reconnectDelay: 1000,
  enableWebSocket: true,
  enablePolling: true,
  endpoints: {
    websocket: '/api/websocket',
    polling: '/api/realtime/poll',
  },
  channels: DEFAULT_CHANNELS,
};

// =============================================================================
// REAL-TIME SERVICE
// =============================================================================

class RealTimeService {
  private config: RealTimeConfig;
  private websocket: WebSocket | null = null;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private connectionStatus: ConnectionStatus = {
    connected: false,
    method: 'offline',
    lastUpdate: '',
    retryCount: 0,
    latency: 0,
    errors: [],
  };
  private listeners: Map<string, (update: RealTimeUpdate) => void> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private updateQueue: RealTimeUpdate[] = [];
  private isProcessing = false;

  constructor(config: RealTimeConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // =============================================================================
  // CONNECTION MANAGEMENT
  // =============================================================================

  async start(): Promise<void> {
    // Try WebSocket first if enabled
    if (this.config.enableWebSocket) {
      try {
        await this.connectWebSocket();
        return;
      } catch (error) {
        console.warn('WebSocket connection failed, falling back to polling:', error);
        this.addError('WebSocket connection failed');
      }
    }

    // Fallback to polling
    if (this.config.enablePolling) {
      this.startPolling();
    } else {
      throw new Error('No connection methods available');
    }
  }

  stop(): void {
    console.log('🛑 Stopping Real-Time Service...');

    // Close WebSocket
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Clear polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();

    // Update status
    this.updateConnectionStatus({
      connected: false,
      method: 'offline',
      lastUpdate: new Date().toISOString(),
      retryCount: 0,
      latency: 0,
      errors: [],
    });
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.config.endpoints.websocket}`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('✅ WebSocket connected');
        this.updateConnectionStatus({
          connected: true,
          method: 'websocket',
          lastUpdate: new Date().toISOString(),
          retryCount: 0,
          latency: 0,
          errors: [],
        });
        resolve();
      };

      this.websocket.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this.handleUpdate(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
          this.addError('Failed to parse WebSocket message');
        }
      };

      this.websocket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.handleDisconnection();
      };

      this.websocket.onerror = error => {
        console.error('WebSocket error:', error);
        this.addError('WebSocket connection error');
        reject(error);
      };

      // Timeout for connection
      setTimeout(() => {
        if (this.websocket?.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  private startPolling(): void {
    console.log('📡 Starting polling for enabled channels...');

    const enabledChannels = this.config.channels.filter(channel => channel.enabled);

    enabledChannels.forEach(channel => {
      const interval = setInterval(async () => {
        try {
          const startTime = Date.now();
          const response = await fetch(channel.endpoint);
          const latency = Date.now() - startTime;

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          // Update latency
          this.updateConnectionStatus({
            ...this.connectionStatus,
            connected: true,
            method: 'polling',
            lastUpdate: new Date().toISOString(),
            latency,
            retryCount: 0,
          });

          // Process data
          const processedData = channel.dataProcessor ? channel.dataProcessor(data) : data;

          this.handleUpdate({
            id: `${channel.id}_${Date.now()}`,
            channel: channel.id,
            timestamp: new Date().toISOString(),
            type: 'data',
            data: processedData,
            priority: channel.priority,
            processed: false,
          });
        } catch (error) {
          console.error(`Polling error for ${channel.name}:`, error);
          // ✅ FIXED in Phase 4D cleanup - Fixed unknown error type
          this.addError(
            `${channel.name}: ${error instanceof Error ? error.message : String(error)}`
          );
          this.handleRetry(channel);
        }
      }, channel.interval);

      this.pollingIntervals.set(channel.id, interval);
    });

    // Initial status update
    this.updateConnectionStatus({
      connected: true,
      method: 'polling',
      lastUpdate: new Date().toISOString(),
      retryCount: 0,
      latency: 0,
      errors: [],
    });
  }

  // ✅ Phase 5 socket optimize - Enhanced reconnection logic with exponential backoff
  private handleDisconnection(): void {
    this.updateConnectionStatus({
      connected: false,
      method: 'offline',
      lastUpdate: new Date().toISOString(),
      retryCount: this.connectionStatus.retryCount + 1,
      latency: 0,
      errors: [...this.connectionStatus.errors, 'Connection lost'],
    });

    // Enhanced reconnection with exponential backoff and jitter
    if (this.connectionStatus.retryCount < this.config.maxRetries) {
      const baseDelay = this.config.reconnectDelay * Math.pow(2, this.connectionStatus.retryCount);
      const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
      const totalDelay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds

      console.log(
        `🔄 Attempting reconnection in ${totalDelay}ms (attempt ${this.connectionStatus.retryCount + 1}/${this.config.maxRetries})`
      );

      setTimeout(() => {
        this.start().catch(error => {
          console.error('Reconnection failed:', error);
          this.addError(`Reconnection attempt ${this.connectionStatus.retryCount} failed`);
        });
      }, totalDelay);
    } else {
      console.error('🚫 Max reconnection attempts reached. Switching to polling mode.');
      this.fallbackToPolling();
    }
  }

  // ✅ Phase 5 socket optimize - Fallback to polling when WebSocket fails
  private fallbackToPolling(): void {
    if (this.config.enablePolling) {
      console.log('📡 Falling back to polling mode...');
      this.startPolling();
    }
  }

  private handleRetry(channel: RealTimeChannel): void {
    const currentRetries = this.connectionStatus.retryCount + 1;

    if (currentRetries >= this.config.maxRetries) {
      console.error(`Max retries reached for ${channel.name}`);
      this.updateConnectionStatus({
        ...this.connectionStatus,
        connected: false,
        retryCount: currentRetries,
      });
      return;
    }

    this.updateConnectionStatus({
      ...this.connectionStatus,
      retryCount: currentRetries,
    });
  }

  // =============================================================================
  // UPDATE HANDLING
  // =============================================================================

  private handleUpdate(update: RealTimeUpdate): void {
    this.updateQueue.push(update);

    if (!this.isProcessing) {
      this.processUpdateQueue();
    }
  }

  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) return;

    this.isProcessing = true;

    while (this.updateQueue.length > 0) {
      const update = this.updateQueue.shift()!;

      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(update);
        } catch (error) {
          console.error('Update listener error:', error);
        }
      });

      // Mark as processed
      update.processed = true;

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isProcessing = false;
  }

  // =============================================================================
  // STATUS MANAGEMENT
  // =============================================================================

  private updateConnectionStatus(status: Partial<ConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...status };

    // Notify status listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(this.connectionStatus);
      } catch (error) {
        console.error('Status listener error:', error);
      }
    });
  }

  private addError(error: string): void {
    const errors = [...this.connectionStatus.errors, error];
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }

    this.updateConnectionStatus({ errors });
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  onUpdate(listener: (update: RealTimeUpdate) => void): () => void {
    const id = Math.random().toString(36);
    this.listeners.set(id, listener);
    return () => this.listeners.delete(id);
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  updateChannelConfig(channelId: string, config: Partial<RealTimeChannel>): void {
    const channelIndex = this.config.channels.findIndex(c => c.id === channelId);
    if (channelIndex >= 0) {
      this.config.channels[channelIndex] = { ...this.config.channels[channelIndex], ...config };

      // Restart polling for this channel if needed
      if (this.connectionStatus.method === 'polling') {
        const interval = this.pollingIntervals.get(channelId);
        if (interval) {
          clearInterval(interval);
          this.pollingIntervals.delete(channelId);
        }

        if (config.enabled !== false) {
          this.startChannelPolling(this.config.channels[channelIndex]);
        }
      }
    }
  }

  private startChannelPolling(channel: RealTimeChannel): void {
    if (!channel.enabled) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(channel.endpoint);
        const data = await response.json();
        const processedData = channel.dataProcessor ? channel.dataProcessor(data) : data;

        this.handleUpdate({
          id: `${channel.id}_${Date.now()}`,
          channel: channel.id,
          timestamp: new Date().toISOString(),
          type: 'data',
          data: processedData,
          priority: channel.priority,
          processed: false,
        });
      } catch (error) {
        console.error(`Polling error for ${channel.name}:`, error);
        // ✅ FIXED in Phase 4D cleanup - Fixed unknown error type
        this.addError(`${channel.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, channel.interval);

    this.pollingIntervals.set(channel.id, interval);
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RealTimeUpdates({
  config,
  onUpdate,
  onConnectionChange,
  className = '',
  showStatus = true,
  showControls = true,
  autoStart = true,
}: RealTimeUpdatesProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    method: 'offline',
    lastUpdate: '',
    retryCount: 0,
    latency: 0,
    errors: [],
  });
  const [recentUpdates, setRecentUpdates] = useState<RealTimeUpdate[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [channels, setChannels] = useState<RealTimeChannel[]>(config.channels);

  const serviceRef = useRef<RealTimeService | null>(null);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    serviceRef.current = new RealTimeService(config);

    // Set up listeners
    const unsubscribeUpdate = serviceRef.current.onUpdate(update => {
      setRecentUpdates(prev => [update, ...prev.slice(0, 9)]);
      onUpdate?.(update);
    });

    const unsubscribeStatus = serviceRef.current.onStatusChange(status => {
      setConnectionStatus(status);
      onConnectionChange?.(status);
    });

    // Auto-start if enabled
    if (autoStart) {
      handleStart();
    }

    return () => {
      unsubscribeUpdate();
      unsubscribeStatus();
      serviceRef.current?.stop();
    };
  }, [config, autoStart, onUpdate, onConnectionChange]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleStart = useCallback(async () => {
    if (!serviceRef.current) return;

    try {
      setIsRunning(true);
      await serviceRef.current.start();
      toast.success('Real-time updates started');
    } catch (error) {
      console.error('Failed to start real-time updates:', error);
      toast.error('Failed to start real-time updates');
      setIsRunning(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    if (!serviceRef.current) return;

    serviceRef.current.stop();
    setIsRunning(false);
    toast.success('Real-time updates stopped');
  }, []);

  const handleChannelToggle = useCallback(
    (channelId: string) => {
      const channel = channels.find(c => c.id === channelId);
      if (!channel) return;

      const updatedChannel = { ...channel, enabled: !channel.enabled };
      const updatedChannels = channels.map(c => (c.id === channelId ? updatedChannel : c));

      setChannels(updatedChannels);
      serviceRef.current?.updateChannelConfig(channelId, { enabled: updatedChannel.enabled });
    },
    [channels]
  );

  const handleChannelIntervalChange = useCallback(
    (channelId: string, interval: number) => {
      const updatedChannels = channels.map(c => (c.id === channelId ? { ...c, interval } : c));

      setChannels(updatedChannels);
      serviceRef.current?.updateChannelConfig(channelId, { interval });
    },
    [channels]
  );

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getStatusIcon = () => {
    if (!connectionStatus.connected) {
      return <WifiOff className='w-4 h-4 text-red-400' />;
    }

    switch (connectionStatus.method) {
      case 'websocket':
        return <Wifi className='w-4 h-4 text-green-400' />;
      case 'polling':
        return <RefreshCw className='w-4 h-4 text-blue-400' />;
      default:
        return <WifiOff className='w-4 h-4 text-gray-400' />;
    }
  };

  const getStatusColor = () => {
    if (!connectionStatus.connected) return 'text-red-400';
    if (connectionStatus.method === 'websocket') return 'text-green-400';
    if (connectionStatus.method === 'polling') return 'text-blue-400';
    return 'text-gray-400';
  };

  const renderStatus = () => (
    <div className='flex items-center space-x-2'>
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {connectionStatus.connected ? (
          <>
            {connectionStatus.method === 'websocket' ? 'WebSocket' : 'Polling'}
            {connectionStatus.latency > 0 && (
              <span className='text-gray-400 ml-1'>({connectionStatus.latency}ms)</span>
            )}
          </>
        ) : (
          'Offline'
        )}
      </span>
      {connectionStatus.retryCount > 0 && (
        <span className='text-yellow-400 text-xs'>Retry {connectionStatus.retryCount}</span>
      )}
    </div>
  );

  const renderControls = () => (
    <div className='flex items-center space-x-2'>
      <button
        onClick={isRunning ? handleStop : handleStart}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          isRunning
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isRunning ? (
          <>
            <Pause className='w-3 h-3 mr-1' />
            Stop
          </>
        ) : (
          <>
            <Play className='w-3 h-3 mr-1' />
            Start
          </>
        )}
      </button>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className='p-1 text-gray-400 hover:text-white transition-colors'
      >
        <Settings className='w-4 h-4' />
      </button>
    </div>
  );

  const renderChannelSettings = () => (
    <div className='space-y-3'>
      <h4 className='text-white font-medium'>Channel Settings</h4>

      {channels.map(channel => (
        <div key={channel.id} className='p-3 bg-gray-800 rounded-lg'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center space-x-2'>
              {channel.icon}
              <span className='text-white font-medium'>{channel.name}</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  channel.priority === 'high'
                    ? 'bg-red-500/20 text-red-300'
                    : channel.priority === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-gray-500/20 text-gray-300'
                }`}
              >
                {channel.priority}
              </span>
            </div>
            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={channel.enabled}
                onChange={() => handleChannelToggle(channel.id)}
                className='text-blue-500'
              />
            </label>
          </div>

          <p className='text-gray-400 text-sm mb-2'>{channel.description}</p>

          {channel.enabled && (
            <div className='flex items-center space-x-2'>
              <label className='text-gray-300 text-sm'>Interval:</label>
              <input
                type='number'
                value={channel.interval / 1000}
                onChange={e =>
                  handleChannelIntervalChange(channel.id, parseInt(e.target.value) * 1000)
                }
                className='w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm'
                min='1'
                max='300'
              />
              <span className='text-gray-400 text-sm'>seconds</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderRecentUpdates = () => (
    <div className='space-y-2'>
      <h4 className='text-white font-medium'>Recent Updates</h4>

      {recentUpdates.length > 0 ? (
        <div className='space-y-1 max-h-32 overflow-y-auto'>
          {recentUpdates.map(update => (
            <div key={update.id} className='flex items-center space-x-2 text-sm'>
              <span
                className={`w-2 h-2 rounded-full ${
                  update.priority === 'high'
                    ? 'bg-red-400'
                    : update.priority === 'medium'
                      ? 'bg-yellow-400'
                      : 'bg-gray-400'
                }`}
              />
              <span className='text-gray-300'>{update.channel}</span>
              <span className='text-gray-500'>•</span>
              <span className='text-gray-400'>
                {new Date(update.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-gray-400 text-sm'>No recent updates</p>
      )}
    </div>
  );

  const renderErrors = () =>
    connectionStatus.errors.length > 0 && (
      <div className='space-y-2'>
        <h4 className='text-white font-medium flex items-center space-x-2'>
          <AlertCircle className='w-4 h-4 text-red-400' />
          <span>Errors</span>
        </h4>
        <div className='space-y-1 max-h-24 overflow-y-auto'>
          {connectionStatus.errors.slice(-5).map((error, index) => (
            <p key={index} className='text-red-300 text-sm'>
              {error}
            </p>
          ))}
        </div>
      </div>
    );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 p-4 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center space-x-3'>
          <Signal className='w-5 h-5 text-blue-400' />
          <h3 className='text-white font-semibold'>Real-Time Updates</h3>
          {showStatus && renderStatus()}
        </div>
        {showControls && renderControls()}
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className='space-y-4 border-t border-gray-800 pt-4'>
          {renderChannelSettings()}
          {renderRecentUpdates()}
          {renderErrors()}
        </div>
      )}

      {/* Connection Info */}
      {!showDetails && connectionStatus.lastUpdate && (
        <div className='text-gray-400 text-sm'>
          Last update: {new Date(connectionStatus.lastUpdate).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

export function useRealTimeUpdates(config: RealTimeConfig) {
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    method: 'offline',
    lastUpdate: '',
    retryCount: 0,
    latency: 0,
    errors: [],
  });

  const serviceRef = useRef<RealTimeService | null>(null);

  useEffect(() => {
    serviceRef.current = new RealTimeService(config);

    const unsubscribeUpdate = serviceRef.current.onUpdate(update => {
      setUpdates(prev => [update, ...prev.slice(0, 99)]);
    });

    const unsubscribeStatus = serviceRef.current.onStatusChange(status => {
      setConnectionStatus(status);
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeStatus();
      serviceRef.current?.stop();
    };
  }, [config]);

  const start = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
  }, []);

  return {
    updates,
    connectionStatus,
    start,
    stop,
    service: serviceRef.current,
  };
}
