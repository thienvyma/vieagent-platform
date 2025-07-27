'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  htmlLink?: string;
}

interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
}

interface ConflictEvent {
  id: string;
  summary: string;
  startTime: string;
  endTime: string;
  conflictType: string;
  severity: string;
}

interface SmartSuggestion {
  suggestedTime: string;
  duration: number;
  confidence: number;
  reason: string;
  conflicts: ConflictEvent[];
}

export default function CalendarDashboard() {
  const { data: session } = useSession();

  // State management
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Event creation states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    summary: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    attendees: [] as string[],
    isAllDay: false,
  });

  // Smart scheduling states
  const [showSmartScheduling, setShowSmartScheduling] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [schedulingPrefs, setSchedulingPrefs] = useState({
    duration: 60,
    attendees: [] as string[],
    preferredTimes: [] as Array<{ start: string; end: string }>,
  });

  // Conflict detection
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Load calendar data
  useEffect(() => {
    if (session?.user) {
      loadCalendarData();
    }
  }, [session]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🗓️ Loading calendar data...');

      // First check if user has connected Google account
      const accountsResponse = await fetch('/api/google/accounts');
      console.log('🔍 Checking Google accounts:', accountsResponse.status);

      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        console.log('📋 Found Google accounts:', accounts.length);

        if (accounts.length === 0) {
          console.log('ℹ️  No Google accounts found - showing connect UI');
          setError('No Google account found. Please connect your Google account first.');
          setLoading(false);
          return;
        }
      } else {
        console.error('❌ Failed to check Google accounts');
        setError('Failed to check Google account status');
        setLoading(false);
        return;
      }

      // If we have accounts, proceed with calendar API
      const response = await fetch('/api/google/calendar');
      console.log('📡 Calendar API response status:', response.status);

      const result = await response.json();
      console.log('📊 Calendar API result:', result);

      if (result.success) {
        setCalendars(result.data.calendars || []);
        setEvents(result.data.recentEvents || []);
        console.log('✅ Calendar data loaded successfully');
      } else {
        const errorMsg = result.error || 'Failed to load calendar data';
        console.error('❌ Calendar API error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg =
        'Failed to connect to calendar service: ' +
        (err instanceof Error ? err.message : String(err));
      console.error('❌ Calendar connection error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (calendarId: string) => {
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

      const response = await fetch(
        `/api/google/calendar?action=events&calendarId=${calendarId}&startDate=${startDate}&endDate=${endDate}&maxResults=50`
      );
      const result = await response.json();

      if (result.success) {
        setEvents(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load events');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Check for conflicts first
      if (newEvent.startTime && newEvent.endTime) {
        await checkConflicts(newEvent.startTime, newEvent.endTime);
      }

      const eventData = {
        calendarId: selectedCalendar,
        summary: newEvent.summary,
        description: newEvent.description,
        location: newEvent.location,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        isAllDay: newEvent.isAllDay,
        attendees: newEvent.attendees.map(email => ({ email })),
        checkConflicts: true,
      };

      const response = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        setNewEvent({
          summary: '',
          description: '',
          location: '',
          startTime: '',
          endTime: '',
          attendees: [],
          isAllDay: false,
        });
        loadEvents(selectedCalendar);
      } else {
        if (result.conflicts) {
          setConflicts(result.conflicts);
        }
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create event');
    }
  };

  const checkConflicts = async (startTime: string, endTime: string) => {
    try {
      setCheckingConflicts(true);

      const response = await fetch(
        `/api/google/calendar?action=conflicts&calendarId=${selectedCalendar}&startTime=${startTime}&endTime=${endTime}`
      );
      const result = await response.json();

      if (result.success) {
        setConflicts(result.data);
      }
    } catch (err) {
      console.error('Failed to check conflicts:', err);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const getSmartSuggestions = async () => {
    try {
      const params = new URLSearchParams({
        action: 'suggestions',
        calendarId: selectedCalendar,
        duration: schedulingPrefs.duration.toString(),
      });

      if (schedulingPrefs.attendees.length > 0) {
        params.append('attendees', JSON.stringify(schedulingPrefs.attendees));
      }

      if (schedulingPrefs.preferredTimes.length > 0) {
        params.append('preferredTimes', JSON.stringify(schedulingPrefs.preferredTimes));
      }

      const response = await fetch(`/api/google/calendar?${params}`);
      const result = await response.json();

      if (result.success) {
        setSmartSuggestions(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to get smart suggestions');
    }
  };

  const selectSuggestion = (suggestion: SmartSuggestion) => {
    const startTime = new Date(suggestion.suggestedTime);
    const endTime = new Date(startTime.getTime() + suggestion.duration * 60000);

    setNewEvent({
      ...newEvent,
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16),
    });
    setShowSmartScheduling(false);
    setShowCreateForm(true);
  };

  const formatDateTime = (dateTime?: string, date?: string, timeZone?: string) => {
    if (dateTime) {
      return new Date(dateTime).toLocaleString();
    } else if (date) {
      return new Date(date).toLocaleDateString();
    }
    return 'No date';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'tentative':
        return 'text-yellow-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 border-red-500/50 text-red-300';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
      case 'low':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-white'>Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error && !calendars.length) {
    // Check if error is about authentication - show connect UI instead of error
    const isAuthError =
      error.includes('authentication') ||
      error.includes('reconnect') ||
      error.includes('No Google');

    if (isAuthError) {
      return (
        <div className='bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-8 text-center'>
          <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>📅</span>
          </div>
          <h3 className='text-2xl font-bold text-white mb-3'>Kết nối Google Calendar</h3>
          <p className='text-gray-300 mb-6 max-w-md mx-auto'>
            Để sử dụng tính năng Calendar, bạn cần kết nối tài khoản Google của mình.
          </p>
          <button
            onClick={() => (window.location.href = '/api/auth/google/connect')}
            className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105'
          >
            🔗 Kết nối Google Calendar
          </button>
          <div className='mt-6 text-sm text-gray-400'>
            <p>Sau khi kết nối, bạn có thể:</p>
            <ul className='mt-2 space-y-1 text-left max-w-xs mx-auto'>
              <li>• Xem lịch và sự kiện</li>
              <li>• Tạo sự kiện mới</li>
              <li>• Kiểm tra xung đột lịch</li>
              <li>• Nhận gợi ý thời gian thông minh</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className='bg-red-500/20 border border-red-500/50 rounded-2xl p-6'>
        <div className='flex items-center space-x-3'>
          <span className='text-2xl'>⚠️</span>
          <div className='flex-1'>
            <h3 className='text-red-300 font-semibold'>Calendar Error</h3>
            <p className='text-red-200 mb-3'>{error}</p>
            <div className='bg-red-500/10 rounded-lg p-3 mb-3'>
              <h4 className='text-red-300 text-sm font-medium mb-2'>Debug Information:</h4>
              <div className='text-red-200 text-xs space-y-1'>
                <div>• API Endpoint: /api/google/calendar</div>
                <div>• Check browser console for detailed error logs</div>
                <div>• Verify Google account has Calendar permissions</div>
                <div>• Ensure OAuth scopes include calendar access</div>
              </div>
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={loadCalendarData}
                className='text-sm bg-red-500/30 text-red-200 px-3 py-1 rounded-lg hover:bg-red-500/50 transition-colors'
              >
                🔄 Retry
              </button>
              <button
                onClick={() => window.open('/api/google/calendar', '_blank')}
                className='text-sm bg-red-500/30 text-red-200 px-3 py-1 rounded-lg hover:bg-red-500/50 transition-colors'
              >
                🔍 Test API
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Calendar Selector */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>📅 Calendar Management</h3>
          <div className='flex space-x-2'>
            <button
              onClick={() => setShowSmartScheduling(true)}
              className='bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all'
            >
              🧠 Smart Schedule
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className='bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all'
            >
              ➕ New Event
            </button>
          </div>
        </div>

        {calendars.length > 0 && (
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-300 mb-2'>Select Calendar</label>
            <select
              value={selectedCalendar}
              onChange={e => {
                setSelectedCalendar(e.target.value);
                loadEvents(e.target.value);
              }}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
            >
              {calendars.map(calendar => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'>
        <h3 className='text-lg font-semibold text-white mb-4'>📋 Upcoming Events</h3>

        {events.length === 0 ? (
          <div className='text-center py-12'>
            <span className='text-6xl mb-4 block'>📅</span>
            <p className='text-gray-400'>No events found</p>
            <p className='text-gray-500 text-sm'>Create your first event to get started</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {events.slice(0, 10).map(event => (
              <div key={event.id} className='bg-white/5 rounded-xl p-4 border border-white/5'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h4 className='text-white font-medium'>{event.summary}</h4>
                    {event.description && (
                      <p className='text-gray-400 text-sm mt-1'>{event.description}</p>
                    )}
                    <div className='flex items-center space-x-4 mt-2 text-sm text-gray-300'>
                      <span>
                        🕐{' '}
                        {formatDateTime(
                          event.start.dateTime,
                          event.start.date,
                          event.start.timeZone
                        )}
                      </span>
                      {event.location && <span>📍 {event.location}</span>}
                      <span className={`${getStatusColor(event.status)} font-medium`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-400 hover:text-blue-300 text-sm'
                    >
                      Open in Google
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conflict Detection */}
      {conflicts.length > 0 && (
        <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6'>
          <h3 className='text-yellow-300 font-semibold mb-4'>⚠️ Schedule Conflicts Detected</h3>
          <div className='space-y-3'>
            {conflicts.map(conflict => (
              <div
                key={conflict.id}
                className={`p-3 rounded-xl border ${getConflictColor(conflict.severity)}`}
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <h4 className='font-medium'>{conflict.summary}</h4>
                    <p className='text-sm opacity-80'>
                      {new Date(conflict.startTime).toLocaleString()} -{' '}
                      {new Date(conflict.endTime).toLocaleString()}
                    </p>
                    <p className='text-xs opacity-60 mt-1'>
                      Conflict Type: {conflict.conflictType} | Severity: {conflict.severity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Event Form */}
      {showCreateForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4'>
            <h3 className='text-white font-semibold mb-4'>Create New Event</h3>
            <form onSubmit={handleCreateEvent} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Title</label>
                <input
                  type='text'
                  value={newEvent.summary}
                  onChange={e => setNewEvent({ ...newEvent, summary: e.target.value })}
                  className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                  rows={3}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Location</label>
                <input
                  type='text'
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>Start Time</label>
                  <input
                    type='datetime-local'
                    value={newEvent.startTime}
                    onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>End Time</label>
                  <input
                    type='datetime-local'
                    value={newEvent.endTime}
                    onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                    required
                  />
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={newEvent.isAllDay}
                  onChange={e => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                  className='rounded border-gray-600 text-purple-500 focus:ring-purple-500'
                />
                <label className='text-sm text-gray-300'>All Day Event</label>
              </div>

              <div className='flex space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowCreateForm(false)}
                  className='flex-1 bg-gray-700 text-white py-2 rounded-xl hover:bg-gray-600 transition-colors'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all'
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Scheduling Modal */}
      {showSmartScheduling && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto'>
            <h3 className='text-white font-semibold mb-4'>🧠 Smart Scheduling Assistant</h3>

            <div className='space-y-4 mb-6'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Meeting Duration (minutes)
                </label>
                <input
                  type='number'
                  min='15'
                  max='480'
                  step='15'
                  value={schedulingPrefs.duration}
                  onChange={e =>
                    setSchedulingPrefs({ ...schedulingPrefs, duration: parseInt(e.target.value) })
                  }
                  className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500'
                />
              </div>

              <button
                onClick={getSmartSuggestions}
                className='w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all'
              >
                Get Smart Suggestions
              </button>
            </div>

            {smartSuggestions.length > 0 && (
              <div className='space-y-3'>
                <h4 className='text-white font-medium'>Suggested Times:</h4>
                {smartSuggestions.map((suggestion, index) => (
                  <div key={index} className='bg-white/5 rounded-xl p-4 border border-white/5'>
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <span className='text-white font-medium'>
                            {new Date(suggestion.suggestedTime).toLocaleString()}
                          </span>
                          <span className='text-gray-400'>({suggestion.duration} min)</span>
                          <div className='flex items-center space-x-1'>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                suggestion.confidence > 0.8
                                  ? 'bg-green-500'
                                  : suggestion.confidence > 0.6
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                            ></div>
                            <span className='text-xs text-gray-400'>
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                        <p className='text-gray-400 text-sm'>{suggestion.reason}</p>
                      </div>
                      <button
                        onClick={() => selectSuggestion(suggestion)}
                        className='bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all text-sm'
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='flex justify-end pt-4'>
              <button
                onClick={() => setShowSmartScheduling(false)}
                className='bg-gray-700 text-white px-6 py-2 rounded-xl hover:bg-gray-600 transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='bg-red-500/20 border border-red-500/50 rounded-2xl p-4'>
          <div className='flex items-center space-x-2'>
            <span className='text-red-400'>⚠️</span>
            <span className='text-red-300'>{error}</span>
            <button
              onClick={() => setError('')}
              className='ml-auto text-red-400 hover:text-red-300'
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
