import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthManager } from './auth';

const prisma = new PrismaClient();

export interface CalendarEvent {
  id?: string;
  googleEventId?: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timezone?: string;
  isAllDay?: boolean;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  reminders?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
  recurrence?: string[]; // RRULE format
  visibility?: 'default' | 'public' | 'private';
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

export interface ConflictEvent {
  id: string;
  summary: string;
  startTime: Date;
  endTime: Date;
  conflictType: 'overlap' | 'adjacent' | 'travel_time';
  severity: 'high' | 'medium' | 'low';
}

export interface SmartSuggestion {
  suggestedTime: Date;
  duration: number; // minutes
  confidence: number; // 0-1
  reason: string;
  conflicts: ConflictEvent[];
}

export class GoogleCalendarService {
  private authManager: GoogleAuthManager;

  constructor() {
    this.authManager = new GoogleAuthManager();
  }

  /**
   * Get authenticated Calendar API client
   */
  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
    try {
      console.log('🔐 Getting authenticated client for userId:', userId);
      const oauth2Client = await this.authManager.getAuthenticatedClient(userId);
      if (!oauth2Client) {
        console.error('❌ No authenticated OAuth2 client found for user:', userId);
        return null;
      }

      console.log('✅ OAuth2 client obtained, creating Calendar API client');
      return google.calendar({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      console.error('❌ Error getting calendar client:', error);
      return null;
    }
  }

  /**
   * List user's calendars
   */
  async listCalendars(userId: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    try {
      console.log('📅 Listing calendars for userId:', userId);
      const calendar = await this.getCalendarClient(userId);
      if (!calendar) {
        console.error('❌ Failed to get calendar client - no authentication');
        throw new Error(
          'No Google Calendar authentication found. Please reconnect your Google account.'
        );
      }

      console.log('📡 Calling Google Calendar API - calendarList.list()');
      const response = await calendar.calendarList.list();
      console.log(
        '✅ Calendar list response:',
        response.data.items?.length || 0,
        'calendars found'
      );
      return response.data.items || [];
    } catch (error) {
      console.error('❌ Error listing calendars:', error);
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          throw new Error('Google Calendar authentication failed. Please reconnect your account.');
        }
        if (error.message.includes('insufficient')) {
          throw new Error(
            'Insufficient permissions for Google Calendar. Please reconnect with Calendar access.'
          );
        }
        throw new Error(`Calendar API error: ${error.message}`);
      }
      throw new Error('Failed to list calendars');
    }
  }

  /**
   * Get events from calendar within date range
   */
  async getEvents(
    userId: string,
    calendarId: string = 'primary',
    startDate?: Date,
    endDate?: Date,
    maxResults: number = 50
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      console.log('🗓️ Getting events for userId:', userId, 'calendarId:', calendarId);
      const calendar = await this.getCalendarClient(userId);
      if (!calendar) {
        console.error('❌ Failed to get calendar client - no authentication');
        throw new Error(
          'No Google Calendar authentication found. Please reconnect your Google account.'
        );
      }

      const timeMin = startDate ? startDate.toISOString() : new Date().toISOString();
      const timeMax = endDate ? endDate.toISOString() : undefined;

      console.log('📡 Calling Google Calendar API - events.list() with params:', {
        calendarId,
        timeMin,
        timeMax,
        maxResults,
      });

      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      console.log('✅ Events response:', response.data.items?.length || 0, 'events found');
      return response.data.items || [];
    } catch (error) {
      console.error('❌ Error getting events:', error);
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          throw new Error('Google Calendar authentication failed. Please reconnect your account.');
        }
        if (error.message.includes('insufficient')) {
          throw new Error(
            'Insufficient permissions for Google Calendar. Please reconnect with Calendar access.'
          );
        }
        throw new Error(`Calendar API error: ${error.message}`);
      }
      throw new Error('Failed to get events');
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(userId: string, eventData: CalendarEvent): Promise<calendar_v3.Schema$Event> {
    try {
      const calendar = await this.getCalendarClient(userId);
      if (!calendar) {
        throw new Error('Failed to authenticate with Google Calendar');
      }

      // Build event object for Google Calendar API
      const googleEvent: calendar_v3.Schema$Event = {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        start: eventData.isAllDay
          ? { date: eventData.startTime.toISOString().split('T')[0] }
          : {
              dateTime: eventData.startTime.toISOString(),
              timeZone: eventData.timezone || 'UTC',
            },
        end: eventData.isAllDay
          ? { date: eventData.endTime.toISOString().split('T')[0] }
          : {
              dateTime: eventData.endTime.toISOString(),
              timeZone: eventData.timezone || 'UTC',
            },
        attendees: eventData.attendees?.map(attendee => ({
          email: attendee.email,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus || 'needsAction',
        })),
        reminders: eventData.reminders
          ? {
              useDefault: false,
              overrides: eventData.reminders.map(reminder => ({
                method: reminder.method,
                minutes: reminder.minutes,
              })),
            }
          : undefined,
        recurrence: eventData.recurrence,
        visibility: eventData.visibility || 'default',
        status: eventData.status || 'confirmed',
      };

      // Create event in Google Calendar
      const response = await calendar.events.insert({
        calendarId: eventData.calendarId,
        requestBody: googleEvent,
        sendUpdates: 'all', // Send invitations to attendees
      });

      // Save to database
      await this.saveEventToDatabase(userId, eventData.calendarId, response.data);

      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    eventData: Partial<CalendarEvent>
  ): Promise<calendar_v3.Schema$Event> {
    try {
      const calendar = await this.getCalendarClient(userId);
      if (!calendar) {
        throw new Error('Failed to authenticate with Google Calendar');
      }

      // Get existing event first
      const existingEvent = await calendar.events.get({
        calendarId,
        eventId,
      });

      // Merge updates with existing event
      const updatedEvent: calendar_v3.Schema$Event = {
        ...existingEvent.data,
        summary: eventData.summary || existingEvent.data.summary,
        description:
          eventData.description !== undefined
            ? eventData.description
            : existingEvent.data.description,
        location:
          eventData.location !== undefined ? eventData.location : existingEvent.data.location,
        start: eventData.startTime
          ? eventData.isAllDay
            ? { date: eventData.startTime.toISOString().split('T')[0] }
            : {
                dateTime: eventData.startTime.toISOString(),
                timeZone: eventData.timezone || 'UTC',
              }
          : existingEvent.data.start,
        end: eventData.endTime
          ? eventData.isAllDay
            ? { date: eventData.endTime.toISOString().split('T')[0] }
            : {
                dateTime: eventData.endTime.toISOString(),
                timeZone: eventData.timezone || 'UTC',
              }
          : existingEvent.data.end,
        status: eventData.status || existingEvent.data.status,
      };

      // Update event in Google Calendar
      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: updatedEvent,
        sendUpdates: 'all',
      });

      // Update in database
      await this.updateEventInDatabase(userId, calendarId, response.data);

      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(userId: string, calendarId: string, eventId: string): Promise<void> {
    try {
      const calendar = await this.getCalendarClient(userId);
      if (!calendar) {
        throw new Error('Failed to authenticate with Google Calendar');
      }

      // Delete from Google Calendar
      await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all',
      });

      // Delete from database
      await prisma.googleCalendarEvent.deleteMany({
        where: {
          userId,
          googleEventId: eventId,
        },
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Detect conflicts for a proposed event time
   */
  async detectConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    calendarId: string = 'primary',
    excludeEventId?: string
  ): Promise<ConflictEvent[]> {
    try {
      const conflicts: ConflictEvent[] = [];

      // Get events in the time range (with buffer for travel time)
      const bufferMinutes = 30;
      const bufferStart = new Date(startTime.getTime() - bufferMinutes * 60000);
      const bufferEnd = new Date(endTime.getTime() + bufferMinutes * 60000);

      const events = await this.getEvents(userId, calendarId, bufferStart, bufferEnd);

      for (const event of events) {
        if (excludeEventId && event.id === excludeEventId) {
          continue;
        }

        if (!event.start || !event.end) continue;

        const eventStart = new Date(event.start.dateTime || event.start.date || '');
        const eventEnd = new Date(event.end.dateTime || event.end.date || '');

        // Check for overlaps
        if (startTime < eventEnd && endTime > eventStart) {
          conflicts.push({
            id: event.id || '',
            summary: event.summary || 'Untitled Event',
            startTime: eventStart,
            endTime: eventEnd,
            conflictType: 'overlap',
            severity: 'high',
          });
        }
        // Check for adjacent events (potential travel time issues)
        else if (
          Math.abs(eventEnd.getTime() - startTime.getTime()) < bufferMinutes * 60000 ||
          Math.abs(endTime.getTime() - eventStart.getTime()) < bufferMinutes * 60000
        ) {
          conflicts.push({
            id: event.id || '',
            summary: event.summary || 'Untitled Event',
            startTime: eventStart,
            endTime: eventEnd,
            conflictType: 'travel_time',
            severity: 'medium',
          });
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * AI-powered smart scheduling suggestions
   */
  async getSmartSuggestions(
    userId: string,
    duration: number, // minutes
    preferredTimes?: Array<{ start: Date; end: Date }>,
    attendeeEmails?: string[],
    calendarId: string = 'primary'
  ): Promise<SmartSuggestion[]> {
    try {
      const suggestions: SmartSuggestion[] = [];
      const now = new Date();
      const searchEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks ahead

      // Get existing events for analysis
      const events = await this.getEvents(userId, calendarId, now, searchEnd);

      // Business hours (9 AM - 6 PM)
      const businessHours = { start: 9, end: 18 };

      // Analyze user's typical meeting patterns
      const meetingPatterns = this.analyzeMeetingPatterns(events);

      // Generate time slots for next 2 weeks
      for (let day = 0; day < 14; day++) {
        const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);

        // Skip weekends unless user has weekend meetings
        if (date.getDay() === 0 || date.getDay() === 6) {
          if (!meetingPatterns.hasWeekendMeetings) continue;
        }

        // Generate hourly slots during business hours
        for (
          let hour = businessHours.start;
          hour <= businessHours.end - Math.ceil(duration / 60);
          hour++
        ) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);

          // Check for conflicts
          const conflicts = await this.detectConflicts(userId, slotStart, slotEnd, calendarId);

          if (conflicts.length === 0) {
            // Calculate confidence based on user patterns
            let confidence = this.calculateTimeSlotConfidence(slotStart, meetingPatterns);

            // Boost confidence for preferred times
            if (preferredTimes) {
              for (const preferred of preferredTimes) {
                if (slotStart >= preferred.start && slotEnd <= preferred.end) {
                  confidence += 0.3;
                }
              }
            }

            suggestions.push({
              suggestedTime: slotStart,
              duration,
              confidence: Math.min(confidence, 1),
              reason: this.generateSuggestionReason(slotStart, meetingPatterns),
              conflicts: [],
            });
          }
        }
      }

      // Sort by confidence and return top suggestions
      return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      return [];
    }
  }

  /**
   * Save event to database
   */
  private async saveEventToDatabase(
    userId: string,
    calendarId: string,
    googleEvent: calendar_v3.Schema$Event
  ): Promise<void> {
    try {
      const googleAccount = await prisma.googleAccount.findFirst({
        where: { userId, isActive: true },
      });

      if (!googleAccount || !googleEvent.id) return;

      const startTime = new Date(googleEvent.start?.dateTime || googleEvent.start?.date || '');
      const endTime = new Date(googleEvent.end?.dateTime || googleEvent.end?.date || '');

      await prisma.googleCalendarEvent.upsert({
        where: { googleEventId: googleEvent.id },
        create: {
          userId,
          googleAccountId: googleAccount.id,
          googleEventId: googleEvent.id,
          calendarId,
          summary: googleEvent.summary || '',
          description: googleEvent.description,
          location: googleEvent.location,
          startTime,
          endTime,
          timezone: googleEvent.start?.timeZone,
          isAllDay: !!googleEvent.start?.date,
          attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : null,
          organizer: googleEvent.organizer ? JSON.stringify(googleEvent.organizer) : null,
          status: googleEvent.status || 'confirmed',
          visibility: googleEvent.visibility || 'default',
        },
        update: {
          summary: googleEvent.summary || '',
          description: googleEvent.description,
          location: googleEvent.location,
          startTime,
          endTime,
          timezone: googleEvent.start?.timeZone,
          isAllDay: !!googleEvent.start?.date,
          attendees: googleEvent.attendees ? JSON.stringify(googleEvent.attendees) : null,
          status: googleEvent.status || 'confirmed',
          lastSync: new Date(),
        },
      });
    } catch (error) {
      console.error('Error saving event to database:', error);
    }
  }

  /**
   * Update event in database
   */
  private async updateEventInDatabase(
    userId: string,
    calendarId: string,
    googleEvent: calendar_v3.Schema$Event
  ): Promise<void> {
    await this.saveEventToDatabase(userId, calendarId, googleEvent);
  }

  /**
   * Analyze user's meeting patterns
   */
  private analyzeMeetingPatterns(events: calendar_v3.Schema$Event[]) {
    const patterns = {
      preferredHours: new Map<number, number>(),
      preferredDays: new Map<number, number>(),
      averageDuration: 0,
      hasWeekendMeetings: false,
      commonLocations: new Map<string, number>(),
    };

    let totalDuration = 0;
    let validEvents = 0;

    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;

      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const duration = (end.getTime() - start.getTime()) / 60000; // minutes

      // Track preferred hours
      const hour = start.getHours();
      patterns.preferredHours.set(hour, (patterns.preferredHours.get(hour) || 0) + 1);

      // Track preferred days
      const day = start.getDay();
      patterns.preferredDays.set(day, (patterns.preferredDays.get(day) || 0) + 1);

      // Track weekend meetings
      if (day === 0 || day === 6) {
        patterns.hasWeekendMeetings = true;
      }

      // Track locations
      if (event.location) {
        patterns.commonLocations.set(
          event.location,
          (patterns.commonLocations.get(event.location) || 0) + 1
        );
      }

      totalDuration += duration;
      validEvents++;
    }

    patterns.averageDuration = validEvents > 0 ? totalDuration / validEvents : 60;

    return patterns;
  }

  /**
   * Calculate confidence score for a time slot
   */
  private calculateTimeSlotConfidence(
    slotStart: Date,
    patterns: ReturnType<typeof this.analyzeMeetingPatterns>
  ): number {
    let confidence = 0.5; // Base confidence

    const hour = slotStart.getHours();
    const day = slotStart.getDay();

    // Boost for preferred hours
    const hourFreq = patterns.preferredHours.get(hour) || 0;
    const maxHourFreq = Math.max(...Array.from(patterns.preferredHours.values()));
    if (maxHourFreq > 0) {
      confidence += (hourFreq / maxHourFreq) * 0.3;
    }

    // Boost for preferred days
    const dayFreq = patterns.preferredDays.get(day) || 0;
    const maxDayFreq = Math.max(...Array.from(patterns.preferredDays.values()));
    if (maxDayFreq > 0) {
      confidence += (dayFreq / maxDayFreq) * 0.2;
    }

    // Penalty for early morning or late evening
    if (hour < 8 || hour > 18) {
      confidence -= 0.2;
    }

    // Boost for mid-morning and early afternoon (typically good times)
    if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 15)) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate human-readable reason for suggestion
   */
  private generateSuggestionReason(
    slotStart: Date,
    patterns: ReturnType<typeof this.analyzeMeetingPatterns>
  ): string {
    const hour = slotStart.getHours();
    const day = slotStart.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const reasons = [];

    // Time-based reasons
    if (hour >= 10 && hour <= 11) {
      reasons.push('Mid-morning is typically a productive time');
    } else if (hour >= 14 && hour <= 15) {
      reasons.push('Early afternoon works well for most people');
    } else if (hour >= 9 && hour <= 17) {
      reasons.push('During business hours');
    }

    // Pattern-based reasons
    const hourFreq = patterns.preferredHours.get(hour) || 0;
    if (hourFreq > 0) {
      reasons.push(`You often have meetings at ${hour}:00`);
    }

    const dayFreq = patterns.preferredDays.get(day) || 0;
    if (dayFreq > 0) {
      reasons.push(`${dayNames[day]}s work well for you`);
    }

    // Default reason
    if (reasons.length === 0) {
      reasons.push('No conflicts detected');
    }

    return reasons.join(', ');
  }
}
