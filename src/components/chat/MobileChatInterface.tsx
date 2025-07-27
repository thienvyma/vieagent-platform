'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  X,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  MoreHorizontal,
  Square,
} from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

interface MobileChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  reactions?: MessageReaction[];
  isEditing?: boolean;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MobileChatInterfaceProps {
  messages: MobileChatMessage[];
  onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  loading?: boolean;
  placeholder?: string;
  enableVoiceRecording?: boolean;
  enableFileUpload?: boolean;
  enableSwipeActions?: boolean;
  agentName?: string;
}

export default function MobileChatInterface({
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  loading = false,
  placeholder = 'Type a message...',
  enableVoiceRecording = true,
  enableFileUpload = true,
  enableSwipeActions = true,
  agentName = 'AI Assistant',
}: MobileChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState(40);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '✨'];

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 40), 120);
      textareaRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!inputMessage.trim() && selectedFiles.length === 0) return;

    onSendMessage(inputMessage, selectedFiles);
    setInputMessage('');
    setSelectedFiles([]);
    setTextareaHeight(40);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const fileAttachments: FileAttachment[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    }));

    setSelectedFiles(prev => [...prev, ...fileAttachments]);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Here you would implement actual recording logic
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    console.log('Recording stopped');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReaction = (messageId: string, emoji: string) => {
    onReactToMessage?.(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const CreateSwipeHandlers = (messageId: string) => {
    if (!enableSwipeActions) return {};

    return useSwipeable({
      onSwipedLeft: () => {
        setSwipedMessageId(messageId);
        setTimeout(() => setSwipedMessageId(null), 3000);
      },
      onSwipedRight: () => {
        setSwipedMessageId(null);
      },
      preventScrollOnSwipe: true,
      trackMouse: true,
    });
  };

  return (
    <div className='flex flex-col h-full bg-gray-900/50 backdrop-blur-sm'>
      {/* Chat Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-sm'>
        <div className='flex items-center space-x-3'>
          <VIEAgentLogo size='small' className='rounded-full' />
          <div>
            <h3 className='font-bold text-white'>{agentName}</h3>
            <p className='text-sm text-gray-400'>Online • Mobile Optimized</p>
          </div>
        </div>

        <button className='p-2 text-gray-400 hover:text-white transition-colors'>
          <MoreHorizontal className='w-5 h-5' />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className='flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth'
      >
        {messages.length === 0 ? (
          <div className='text-center py-16'>
            <div className='w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4'>
              <span className='text-2xl'>💬</span>
            </div>
            <h3 className='text-lg font-bold text-white mb-2'>Start chatting with {agentName}!</h3>
            <p className='text-gray-400 text-sm'>Tap to type, swipe for actions, hold to record</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
                                {...CreateSwipeHandlers(message.id)}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} relative`}
            >
              {/* Swipe Actions */}
              {enableSwipeActions && swipedMessageId === message.id && (
                <div className='absolute right-0 top-0 bottom-0 flex items-center space-x-2 bg-red-500/20 backdrop-blur-sm rounded-l-2xl px-4 z-10'>
                  <button
                    onClick={() => onDeleteMessage?.(message.id)}
                    className='p-2 bg-red-500 text-white rounded-full'
                  >
                    <X className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(message.id)}
                    className='p-2 bg-blue-500 text-white rounded-full'
                  >
                    😊
                  </button>
                </div>
              )}

              <div
                className={`flex items-start space-x-3 max-w-[85%] ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600'
                  }`}
                >
                  <span className='text-sm'>{message.role === 'user' ? '👤' : 'AI'}</span>
                </div>

                {/* Message Content */}
                <div
                  className={`px-4 py-3 rounded-2xl relative ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-gray-800/80 text-white border border-gray-700/50'
                  }`}
                >
                  <p className='whitespace-pre-wrap text-sm leading-relaxed'>{message.content}</p>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className='mt-2 space-y-2'>
                      {message.attachments.map(attachment => (
                        <div
                          key={attachment.id}
                          className='flex items-center space-x-2 p-2 bg-black/20 rounded-lg'
                        >
                          <Paperclip className='w-4 h-4' />
                          <span className='text-xs truncate'>{attachment.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-2'>
                      {message.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() => handleReaction(message.id, reaction.emoji)}
                          className='flex items-center space-x-1 px-2 py-1 bg-black/20 rounded-full text-xs'
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker === message.id && (
                <div className='absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-3 z-20'>
                  <div className='flex space-x-2'>
                    {commonEmojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className='p-2 hover:bg-gray-700/50 rounded-lg transition-colors'
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className='flex justify-start'>
            <div className='flex items-center space-x-3'>
              <div className='w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center'>
                <span className='text-sm'>AI</span>
              </div>
              <div className='bg-gray-800/80 rounded-2xl px-4 py-3 border border-gray-700/50'>
                <div className='flex space-x-1'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100'></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200'></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className='absolute bottom-24 right-4 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors z-10'
        >
          <ArrowDown className='w-5 h-5' />
        </button>
      )}

      {/* File Attachments Preview */}
      {selectedFiles.length > 0 && (
        <div className='p-4 border-t border-gray-800/50 bg-gray-900/80'>
          <div className='flex flex-wrap gap-2'>
            {selectedFiles.map(file => (
              <div
                key={file.id}
                className='flex items-center space-x-2 bg-gray-800/80 rounded-lg p-2'
              >
                <Paperclip className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-white truncate max-w-32'>{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className='p-1 text-gray-400 hover:text-red-400 transition-colors'
                >
                  <X className='w-3 h-3' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className='p-4 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm'>
        {/* Recording Indicator */}
        {isRecording && (
          <div className='mb-4 flex items-center justify-center space-x-3 p-3 bg-red-500/20 rounded-2xl border border-red-500/30'>
            <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
            <span className='text-red-400 font-medium'>Recording: {formatTime(recordingTime)}</span>
            <button onClick={stopRecording} className='p-2 bg-red-500 text-white rounded-full'>
              <Square className='w-4 h-4' />
            </button>
          </div>
        )}

        <div className='flex items-end space-x-3'>
          {/* File Upload */}
          {enableFileUpload && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className='p-3 bg-gray-800/80 text-gray-400 hover:text-white rounded-2xl transition-colors'
            >
              <Paperclip className='w-5 h-5' />
            </button>
          )}

          {/* Message Input */}
          <div className='flex-1 relative'>
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className='w-full resize-none bg-gray-800/80 border border-gray-700/50 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              style={{ height: `${textareaHeight}px` }}
              disabled={loading || isRecording}
            />
          </div>

          {/* Voice Recording */}
          {enableVoiceRecording && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-3 rounded-2xl transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white'
              }`}
            >
              {isRecording ? <MicOff className='w-5 h-5' /> : <Mic className='w-5 h-5' />}
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading || (!inputMessage.trim() && selectedFiles.length === 0)}
            className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? (
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            ) : (
              <Send className='w-5 h-5' />
            )}
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        onChange={handleFileSelect}
        className='hidden'
        accept='image/*,video/*,audio/*,.pdf,.doc,.docx,.txt'
      />
    </div>
  );
}
