'use client';

import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Download, Trash2, RefreshCw, Cloud, HardDrive } from 'lucide-react';
import { TouchButton } from './TouchOptimizedComponents';

interface OfflineMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  synced: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    data: string; // base64 encoded
  }>;
}

interface OfflineData {
  messages: OfflineMessage[];
  agents: any[];
  userPreferences: any;
  lastSync: Date;
}

// Offline Status Component
export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check for offline data
    checkOfflineData();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const checkOfflineData = async () => {
    try {
      const offlineData = await OfflineStorage.getOfflineData();
      setHasOfflineData(offlineData.messages.length > 0);
    } catch (error) {
      console.error('Error checking offline data:', error);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline) return;

    setSyncStatus('syncing');
    try {
      await OfflineStorage.syncOfflineData();
      setHasOfflineData(false);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Error syncing offline data:', error);
      setSyncStatus('error');
    }
  };

  if (!isOnline) {
    return (
      <div className='fixed top-4 left-4 right-4 z-50 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-4'>
        <div className='flex items-center space-x-3'>
          <WifiOff className='w-5 h-5 text-yellow-400' />
          <div className='flex-1'>
            <p className='text-yellow-300 font-medium'>You're offline</p>
            <p className='text-yellow-400 text-sm'>Messages will be saved locally</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasOfflineData) {
    return (
      <div className='fixed top-4 left-4 right-4 z-50 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4'>
        <div className='flex items-center space-x-3'>
          <Cloud className='w-5 h-5 text-blue-400' />
          <div className='flex-1'>
            <p className='text-blue-300 font-medium'>Offline data available</p>
            <p className='text-blue-400 text-sm'>Tap to sync with server</p>
          </div>
          <TouchButton
            onClick={syncOfflineData}
            variant='primary'
            size='sm'
            disabled={syncStatus === 'syncing'}
          >
            {syncStatus === 'syncing' ? <RefreshCw className='w-4 h-4 animate-spin' /> : 'Sync'}
          </TouchButton>
        </div>
      </div>
    );
  }

  return null;
}

// Offline Chat History Component
export function OfflineChatHistory() {
  const [offlineMessages, setOfflineMessages] = useState<OfflineMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOfflineMessages();
  }, []);

  const loadOfflineMessages = async () => {
    try {
      const offlineData = await OfflineStorage.getOfflineData();
      setOfflineMessages(offlineData.messages);
    } catch (error) {
      console.error('Error loading offline messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const deleteSelectedMessages = async () => {
    try {
      await OfflineStorage.deleteMessages(Array.from(selectedMessages));
      setOfflineMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  const syncSelectedMessages = async () => {
    if (!navigator.onLine) return;

    try {
      const messagesToSync = offlineMessages.filter(msg => selectedMessages.has(msg.id));
      await OfflineStorage.syncMessages(messagesToSync);
      setOfflineMessages(prev =>
        prev.map(msg => (selectedMessages.has(msg.id) ? { ...msg, synced: true } : msg))
      );
      setSelectedMessages(new Set());
    } catch (error) {
      console.error('Error syncing messages:', error);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <HardDrive className='w-5 h-5 text-gray-400' />
          <h3 className='text-lg font-bold text-white'>Offline Messages</h3>
          <span className='px-2 py-1 bg-gray-800/80 rounded-lg text-sm text-gray-400'>
            {offlineMessages.length}
          </span>
        </div>

        {selectedMessages.size > 0 && (
          <div className='flex items-center space-x-2'>
            <TouchButton
              onClick={syncSelectedMessages}
              variant='primary'
              size='sm'
              disabled={!navigator.onLine}
            >
              <Cloud className='w-4 h-4 mr-1' />
              Sync ({selectedMessages.size})
            </TouchButton>
            <TouchButton onClick={deleteSelectedMessages} variant='danger' size='sm'>
              <Trash2 className='w-4 h-4' />
            </TouchButton>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className='space-y-3'>
        {offlineMessages.map(message => (
          <div
            key={message.id}
            className={`p-4 rounded-2xl border transition-all ${
              selectedMessages.has(message.id)
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-gray-800/50 bg-gray-900/50'
            }`}
            onClick={() => toggleMessageSelection(message.id)}
          >
            <div className='flex items-start space-x-3'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}
              >
                <span className='text-sm'>{message.role === 'user' ? '👤' : 'AI'}</span>
              </div>

              <div className='flex-1 min-w-0'>
                <div className='flex items-center space-x-2 mb-1'>
                  <span className='text-sm font-medium text-gray-300 capitalize'>
                    {message.role}
                  </span>
                  <span className='text-xs text-gray-500'>
                    {message.timestamp.toLocaleString()}
                  </span>
                  {!message.synced && (
                    <span className='px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full'>
                      Not synced
                    </span>
                  )}
                </div>

                <p className='text-white text-sm leading-relaxed'>{message.content}</p>

                {message.attachments && message.attachments.length > 0 && (
                  <div className='mt-2 space-y-1'>
                    {message.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className='flex items-center space-x-2 text-xs text-gray-400'
                      >
                        <span>📎</span>
                        <span>{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='flex items-center space-x-2'>
                {message.synced ? (
                  <Cloud className='w-4 h-4 text-green-400' />
                ) : (
                  <HardDrive className='w-4 h-4 text-yellow-400' />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {offlineMessages.length === 0 && (
        <div className='text-center py-8'>
          <HardDrive className='w-12 h-12 text-gray-600 mx-auto mb-3' />
          <p className='text-gray-400'>No offline messages</p>
        </div>
      )}
    </div>
  );
}

// Cache Management Component
export function CacheManagement() {
  const [cacheSize, setCacheSize] = useState(0);
  const [cacheItems, setCacheItems] = useState<
    Array<{
      type: string;
      size: number;
      count: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      const info = await OfflineStorage.getCacheInfo();
      setCacheSize(info.totalSize);
      setCacheItems(info.items);
    } catch (error) {
      console.error('Error loading cache info:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (type?: string) => {
    try {
      if (type) {
        await OfflineStorage.clearCacheType(type);
      } else {
        await OfflineStorage.clearAllCache();
      }
      await loadCacheInfo();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <HardDrive className='w-5 h-5 text-gray-400' />
          <h3 className='text-lg font-bold text-white'>Cache Management</h3>
        </div>

        <div className='text-sm text-gray-400'>Total: {formatSize(cacheSize)}</div>
      </div>

      {/* Cache Items */}
      <div className='space-y-3'>
        {cacheItems.map(item => (
          <div key={item.type} className='p-4 bg-gray-900/50 rounded-2xl border border-gray-800/50'>
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='font-medium text-white capitalize'>{item.type}</h4>
                <p className='text-sm text-gray-400'>
                  {item.count} items • {formatSize(item.size)}
                </p>
              </div>

              <TouchButton onClick={() => clearCache(item.type)} variant='danger' size='sm'>
                <Trash2 className='w-4 h-4 mr-1' />
                Clear
              </TouchButton>
            </div>
          </div>
        ))}
      </div>

      {/* Clear All */}
      <div className='pt-4 border-t border-gray-800/50'>
        <TouchButton onClick={() => clearCache()} variant='danger' size='md' className='w-full'>
          <Trash2 className='w-4 h-4 mr-2' />
          Clear All Cache
        </TouchButton>
      </div>
    </div>
  );
}

// Offline Storage Service
export class OfflineStorage {
  private static DB_NAME = 'ai-agent-offline';
  private static DB_VERSION = 1;
  private static MESSAGE_STORE = 'messages';
  private static CACHE_STORE = 'cache';
  private static SETTINGS_STORE = 'settings';

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Messages store
        if (!db.objectStoreNames.contains(this.MESSAGE_STORE)) {
          const messageStore = db.createObjectStore(this.MESSAGE_STORE, { keyPath: 'id' });
          messageStore.createIndex('timestamp', 'timestamp');
          messageStore.createIndex('synced', 'synced');
        }

        // Cache store
        if (!db.objectStoreNames.contains(this.CACHE_STORE)) {
          const cacheStore = db.createObjectStore(this.CACHE_STORE, { keyPath: 'key' });
          cacheStore.createIndex('type', 'type');
          cacheStore.createIndex('timestamp', 'timestamp');
        }

        // Settings store
        if (!db.objectStoreNames.contains(this.SETTINGS_STORE)) {
          db.createObjectStore(this.SETTINGS_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  static async saveMessage(message: OfflineMessage): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.MESSAGE_STORE], 'readwrite');
    const store = transaction.objectStore(this.MESSAGE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put(message);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static async getOfflineData(): Promise<OfflineData> {
    const db = await this.getDB();
    const transaction = db.transaction([this.MESSAGE_STORE, this.SETTINGS_STORE], 'readonly');

    const messages = await new Promise<OfflineMessage[]>((resolve, reject) => {
      const request = transaction.objectStore(this.MESSAGE_STORE).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    return {
      messages,
      agents: [],
      userPreferences: {},
      lastSync: new Date(),
    };
  }

  static async deleteMessages(messageIds: string[]): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.MESSAGE_STORE], 'readwrite');
    const store = transaction.objectStore(this.MESSAGE_STORE);

    await Promise.all(
      messageIds.map(
        id =>
          new Promise<void>((resolve, reject) => {
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          })
      )
    );
  }

  static async syncMessages(messages: OfflineMessage[]): Promise<void> {
    // Here you would implement the actual sync logic with your API
    console.log('Syncing messages:', messages);

    // Mark messages as synced
    const db = await this.getDB();
    const transaction = db.transaction([this.MESSAGE_STORE], 'readwrite');
    const store = transaction.objectStore(this.MESSAGE_STORE);

    await Promise.all(
      messages.map(
        message =>
          new Promise<void>((resolve, reject) => {
            const request = store.put({ ...message, synced: true });
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
          })
      )
    );
  }

  static async syncOfflineData(): Promise<void> {
    const offlineData = await this.getOfflineData();

    if (offlineData.messages.length > 0) {
      await this.syncMessages(offlineData.messages);
    }
  }

  static async getCacheInfo(): Promise<{
    totalSize: number;
    items: Array<{ type: string; size: number; count: number }>;
  }> {
    const db = await this.getDB();
    const transaction = db.transaction([this.CACHE_STORE], 'readonly');
    const store = transaction.objectStore(this.CACHE_STORE);

    const allItems = await new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const itemsByType = allItems.reduce(
      (acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = { count: 0, size: 0 };
        }
        acc[item.type].count++;
        acc[item.type].size += item.size || 0;
        return acc;
      },
      {} as Record<string, { count: number; size: number }>
    );

    return {
      totalSize: allItems.reduce((sum, item) => sum + (item.size || 0), 0),
      items: Object.entries(itemsByType).map(([type, data]) => ({
        type,
        ...data,
      })),
    };
  }

  static async clearCacheType(type: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.CACHE_STORE], 'readwrite');
    const store = transaction.objectStore(this.CACHE_STORE);
    const index = store.index('type');

    const request = index.openCursor(IDBKeyRange.only(type));

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  static async clearAllCache(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.CACHE_STORE], 'readwrite');
    const store = transaction.objectStore(this.CACHE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
