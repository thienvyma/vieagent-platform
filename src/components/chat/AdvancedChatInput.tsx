/**
 * 💬 Advanced Chat Input Component - Phase 8 Day 27 Step 27.1
 * Enhanced chat input với file upload, voice recording, formatting options
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image,
  FileText,
  Smile,
  Bold,
  Italic,
  Code,
  Link,
  X,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  uploaded?: boolean;
  error?: string;
}

interface VoiceRecording {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

interface AdvancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, files?: FileUpload[], voiceNote?: Blob) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // MB
  allowedFileTypes?: string[];
  enableVoiceRecording?: boolean;
  enableFileUpload?: boolean;
  enableFormatting?: boolean;
  className?: string;
}

export default function AdvancedChatInput({
  value,
  onChange,
  onSend,
  placeholder = 'Type your message...',
  disabled = false,
  loading = false,
  maxFiles = 5,
  maxFileSize = 10, // MB
  allowedFileTypes = [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  enableVoiceRecording = true,
  enableFileUpload = true,
  enableFormatting = true,
  className = '',
}: AdvancedChatInputProps) {
  // State management
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Handle file upload
  const handleFileSelect = useCallback(
    (selectedFiles: FileList) => {
      const newFiles: FileUpload[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Check file count limit
        if (files.length + newFiles.length >= maxFiles) {
          toast.error(`Maximum ${maxFiles} files allowed`);
          break;
        }

        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
          toast.error(`File "${file.name}" is too large (max ${maxFileSize}MB)`);
          continue;
        }

        // Check file type
        const isAllowedType = allowedFileTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -2));
          }
          return file.type === type;
        });

        if (!isAllowedType) {
          toast.error(`File type "${file.type}" not allowed`);
          continue;
        }

        const fileUpload: FileUpload = {
          id: `file-${Date.now()}-${i}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadProgress: 0,
          uploaded: false,
        };

        newFiles.push(fileUpload);
      }

      setFiles(prev => [...prev, ...newFiles]);
    },
    [files.length, maxFiles, maxFileSize, allowedFileTypes]
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFileSelect(droppedFiles);
      }
    },
    [handleFileSelect]
  );

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        setVoiceRecording(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
        }));

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setVoiceRecording(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
      }));

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setVoiceRecording(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceRecording.isRecording) {
      mediaRecorderRef.current.stop();

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [voiceRecording.isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setVoiceRecording({
      isRecording: false,
      isPaused: false,
      duration: 0,
    });
  }, []);

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle send
  const handleSend = useCallback(() => {
    if ((!value.trim() && files.length === 0 && !voiceRecording.audioBlob) || disabled || loading) {
      return;
    }

    // Send message with attachments
    onSend(value, files.length > 0 ? files : undefined, voiceRecording.audioBlob);

    // Reset state
    onChange('');
    setFiles([]);
    setVoiceRecording({
      isRecording: false,
      isPaused: false,
      duration: 0,
    });
  }, [value, files, voiceRecording.audioBlob, disabled, loading, onSend, onChange]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Format text functions
  const insertFormatting = useCallback(
    (before: string, after: string = '') => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      const newText =
        value.substring(0, start) + before + selectedText + after + value.substring(end);
      onChange(newText);

      // Set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }, 0);
    },
    [value, onChange]
  );

  // Emoji picker (simplified)
  const emojis = ['😊', '😂', '❤️', '👍', '👎', '🎉', '🔥', '💯', '🤔', '😢', '😡', '🙏'];

  const insertEmoji = useCallback(
    (emoji: string) => {
      onChange(value + emoji);
      setShowEmojiPicker(false);
      textareaRef.current?.focus();
    },
    [value, onChange]
  );

  return (
    <div className={`relative ${className}`}>
      {/* Drag overlay */}
      {isDragOver && (
        <div className='absolute inset-0 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-2xl z-10 flex items-center justify-center'>
          <div className='text-center'>
            <Upload className='w-8 h-8 text-blue-400 mx-auto mb-2' />
            <p className='text-blue-400 font-medium'>Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className='mb-3 flex flex-wrap gap-2'>
          {files.map(file => (
            <div
              key={file.id}
              className='relative bg-gray-800/50 border border-gray-600 rounded-lg p-2 flex items-center space-x-2 max-w-xs'
            >
              <div className='flex-shrink-0'>
                {file.type.startsWith('image/') ? (
                  <Image className='w-4 h-4 text-blue-400' />
                ) : (
                  <FileText className='w-4 h-4 text-green-400' />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm text-white truncate'>{file.name}</p>
                <p className='text-xs text-gray-400'>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className='text-gray-400 hover:text-red-400 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voice recording preview */}
      {voiceRecording.audioUrl && !voiceRecording.isRecording && (
        <div className='mb-3 bg-gray-800/50 border border-gray-600 rounded-lg p-3'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
              <Mic className='w-4 h-4 text-white' />
            </div>
            <div className='flex-1'>
              <p className='text-sm text-white'>Voice message</p>
              <p className='text-xs text-gray-400'>
                Duration: {formatDuration(voiceRecording.duration)}
              </p>
            </div>
            <audio controls className='h-8'>
              <source src={voiceRecording.audioUrl} type='audio/wav' />
            </audio>
            <button
              onClick={() =>
                setVoiceRecording(prev => ({ ...prev, audioUrl: undefined, audioBlob: undefined }))
              }
              className='text-gray-400 hover:text-red-400 transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}

      {/* Main input area */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-gray-800/50 border border-gray-600 rounded-2xl focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all ${
          isDragOver ? 'border-blue-500 bg-blue-500/10' : ''
        }`}
      >
        {/* Formatting toolbar */}
        {enableFormatting && showFormatting && (
          <div className='border-b border-gray-600 px-4 py-2'>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => insertFormatting('**', '**')}
                className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
                title='Bold'
              >
                <Bold className='w-4 h-4' />
              </button>
              <button
                onClick={() => insertFormatting('*', '*')}
                className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
                title='Italic'
              >
                <Italic className='w-4 h-4' />
              </button>
              <button
                onClick={() => insertFormatting('`', '`')}
                className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
                title='Code'
              >
                <Code className='w-4 h-4' />
              </button>
              <button
                onClick={() => insertFormatting('[', '](url)')}
                className='p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors'
                title='Link'
              >
                <Link className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}

        {/* Text input */}
        <div className='flex items-end space-x-3 p-4'>
          <div className='flex-1'>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || voiceRecording.isRecording}
              className='w-full resize-none bg-transparent text-white placeholder-gray-400 focus:outline-none min-h-[40px] max-h-32'
              rows={1}
            />
          </div>

          {/* Action buttons */}
          <div className='flex items-center space-x-2'>
            {/* File upload */}
            {enableFileUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept={allowedFileTypes.join(',')}
                  onChange={e => e.target.files && handleFileSelect(e.target.files)}
                  className='hidden'
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || voiceRecording.isRecording}
                  className='p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50'
                  title='Attach file'
                >
                  <Paperclip className='w-5 h-5' />
                </button>
              </>
            )}

            {/* Voice recording */}
            {enableVoiceRecording && (
              <div className='relative'>
                {voiceRecording.isRecording ? (
                  <div className='flex items-center space-x-2'>
                    <div className='text-xs text-red-400'>
                      {formatDuration(voiceRecording.duration)}
                    </div>
                    <button
                      onClick={stopRecording}
                      className='p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors'
                      title='Stop recording'
                    >
                      <MicOff className='w-5 h-5' />
                    </button>
                    <button
                      onClick={cancelRecording}
                      className='p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors'
                      title='Cancel recording'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={disabled}
                    className='p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50'
                    title='Record voice message'
                  >
                    <Mic className='w-5 h-5' />
                  </button>
                )}
              </div>
            )}

            {/* Emoji picker */}
            <div className='relative'>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled || voiceRecording.isRecording}
                className='p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50'
                title='Add emoji'
              >
                <Smile className='w-5 h-5' />
              </button>

              {showEmojiPicker && (
                <div className='absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg z-10'>
                  <div className='grid grid-cols-6 gap-2'>
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className='p-2 hover:bg-gray-700 rounded text-lg transition-colors'
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={
                disabled ||
                loading ||
                (!value.trim() && files.length === 0 && !voiceRecording.audioBlob)
              }
              className='p-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              title='Send message'
            >
              {loading ? (
                <Loader2 className='w-5 h-5 animate-spin' />
              ) : (
                <Send className='w-5 h-5' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Formatting toggle */}
      {enableFormatting && (
        <div className='mt-2 flex justify-between items-center text-xs text-gray-400'>
          <button
            onClick={() => setShowFormatting(!showFormatting)}
            className='hover:text-white transition-colors'
          >
            {showFormatting ? 'Hide' : 'Show'} formatting
          </button>
          <div className='flex items-center space-x-4'>
            <span>Enter to send, Shift+Enter for new line</span>
            {files.length > 0 && (
              <span>
                {files.length}/{maxFiles} files
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export types for use in other components
export type { FileUpload, VoiceRecording, AdvancedChatInputProps };
