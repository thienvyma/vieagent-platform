import { GoogleCalendarService, CalendarEvent, ConflictEvent, SmartSuggestion } from './calendar';
import { GmailService, EmailData, EmailAnalysis } from './gmail';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SchedulingPreferences {
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  workingDays: number[]; // 0-6 (Sunday-Saturday)
  meetingDuration: {
    default: number; // minutes
    buffer: number; // minutes between meetings
  };
  preferredTimes: Array<{
    start: string; // HH:MM
    end: string; // HH:MM
    priority: 'high' | 'medium' | 'low';
  }>;
  blackoutTimes: Array<{
    start: Date;
    end: Date;
    reason: string;
  }>;
  autoAcceptMeetings: boolean;
  requireConfirmation: boolean;
  maxMeetingsPerDay: number;
  travelTimeBuffer: number; // minutes
}

export interface MeetingRequest {
  id?: string;
  title: string;
  description?: string;
  duration: number; // minutes
  attendees: string[];
  preferredTimes?: Array<{
    start: Date;
    end: Date;
    priority: number; // 1-10
  }>;
  location?: string;
  isVirtual?: boolean;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  requiredAttendees?: string[];
  optionalAttendees?: string[];
  meetingType: 'interview' | 'standup' | 'review' | 'presentation' | 'brainstorm' | 'other';
  source: 'email' | 'manual' | 'api' | 'calendar';
}

export interface SchedulingResult {
  success: boolean;
  suggestedTime?: Date;
  alternativeTimes: Array<{
    start: Date;
    end: Date;
    confidence: number;
    conflicts: ConflictEvent[];
    reasoning: string;
  }>;
  conflicts: ConflictEvent[];
  reasoning: string;
  calendarEvent?: CalendarEvent;
  requiresApproval: boolean;
  attendeeAvailability: Array<{
    email: string;
    available: boolean;
    conflicts: ConflictEvent[];
    suggestedAlternatives: Date[];
  }>;
}

export interface SchedulingAnalytics {
  totalMeetingsScheduled: number;
  averageSchedulingTime: number; // seconds
  conflictResolutionRate: number; // percentage
  attendeeResponseRate: number; // percentage
  meetingEfficiencyScore: number; // 0-100
  commonConflictTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  peakSchedulingTimes: Array<{
    hour: number;
    count: number;
  }>;
  meetingTypeDistribution: Array<{
    type: string;
    count: number;
    averageDuration: number;
  }>;
}

export class IntelligentSchedulerService {
  private calendarService: GoogleCalendarService;
  private gmailService: GmailService;

  constructor() {
    this.calendarService = new GoogleCalendarService();
    this.gmailService = new GmailService();
  }

  /**
   * AI-powered smart meeting scheduling
   */
  async scheduleSmartMeeting(
    userId: string,
    request: MeetingRequest,
    preferences?: SchedulingPreferences
  ): Promise<SchedulingResult> {
    try {
      console.log('🧠 Starting AI-powered meeting scheduling for:', request.title);

      // Get user preferences or use defaults
      const userPrefs = preferences || (await this.getUserPreferences(userId));

      // Analyze meeting request with AI
      const requestAnalysis = await this.analyzeMeetingRequest(request);

      // Get attendee availability
      const attendeeAvailability = await this.analyzeAttendeeAvailability(
        userId,
        request.attendees,
        request.duration,
        userPrefs
      );

      // Generate smart time suggestions
      const suggestions = await this.generateSmartTimeSuggestions(
        userId,
        request,
        userPrefs,
        attendeeAvailability,
        requestAnalysis
      );

      // Select best time slot
      const bestSuggestion = this.selectBestTimeSlot(suggestions, request, userPrefs);

      // Create calendar event if auto-accept is enabled
      let calendarEvent: CalendarEvent | undefined;
      const requiresApproval = userPrefs.requireConfirmation;

      if (bestSuggestion && !requiresApproval && userPrefs.autoAcceptMeetings) {
        calendarEvent = await this.createCalendarEvent(userId, request, bestSuggestion);

        // Send meeting invitations
        await this.sendMeetingInvitations(userId, calendarEvent, request);
      }

      // Store scheduling analytics
      await this.recordSchedulingAnalytics(userId, request, bestSuggestion, suggestions);

      return {
        success: bestSuggestion !== null,
        suggestedTime: bestSuggestion?.suggestedTime,
        alternativeTimes: suggestions.map(s => ({
          start: s.suggestedTime,
          end: new Date(s.suggestedTime.getTime() + request.duration * 60000),
          confidence: s.confidence,
          conflicts: s.conflicts,
          reasoning: s.reason,
        })),
        conflicts: bestSuggestion?.conflicts || [],
        reasoning: bestSuggestion?.reason || 'No suitable time slots found',
        calendarEvent,
        requiresApproval,
        attendeeAvailability,
      };
    } catch (error) {
      console.error('❌ Error in smart meeting scheduling:', error);
      throw new Error(
        `Failed to schedule meeting: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Analyze meeting request with AI to extract insights
   */
  private async analyzeMeetingRequest(request: MeetingRequest): Promise<{
    suggestedDuration: number;
    meetingType: string;
    urgencyLevel: number;
    requiredPreparation: number;
    idealTimeOfDay: 'morning' | 'afternoon' | 'evening';
    locationPreference: 'office' | 'remote' | 'hybrid';
  }> {
    try {
      const prompt = `
        Analyze this meeting request and provide scheduling insights:
        
        Title: ${request.title}
        Description: ${request.description || 'No description'}
        Duration: ${request.duration} minutes
        Attendees: ${request.attendees.length} people
        Meeting Type: ${request.meetingType}
        Urgency: ${request.urgency}
        
        Please analyze and respond with JSON containing:
        - suggestedDuration: optimal duration in minutes
        - meetingType: refined meeting type
        - urgencyLevel: 1-10 scale
        - requiredPreparation: minutes needed before meeting
        - idealTimeOfDay: morning/afternoon/evening
        - locationPreference: office/remote/hybrid
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI scheduling assistant. Analyze meeting requests and provide optimal scheduling recommendations in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      console.log('🧠 AI Meeting Analysis:', analysis);

      return {
        suggestedDuration: analysis.suggestedDuration || request.duration,
        meetingType: analysis.meetingType || request.meetingType,
        urgencyLevel: analysis.urgencyLevel || 5,
        requiredPreparation: analysis.requiredPreparation || 0,
        idealTimeOfDay: analysis.idealTimeOfDay || 'morning',
        locationPreference: analysis.locationPreference || 'office',
      };
    } catch (error) {
      console.error('❌ Error analyzing meeting request:', error);
      // Return defaults if AI analysis fails
      return {
        suggestedDuration: request.duration,
        meetingType: request.meetingType,
        urgencyLevel: request.urgency === 'urgent' ? 10 : request.urgency === 'high' ? 8 : 5,
        requiredPreparation: 0,
        idealTimeOfDay: 'morning',
        locationPreference: 'office',
      };
    }
  }

  /**
   * Analyze attendee availability across calendars
   */
  private async analyzeAttendeeAvailability(
    userId: string,
    attendees: string[],
    duration: number,
    preferences: SchedulingPreferences
  ): Promise<SchedulingResult['attendeeAvailability']> {
    const availability: SchedulingResult['attendeeAvailability'] = [];

    for (const attendeeEmail of attendees) {
      try {
        // Check if attendee is internal (has calendar access)
        const attendeeCalendars = await this.calendarService.listCalendars(userId);
        const hasAccess = attendeeCalendars.some(cal =>
          cal.summary?.toLowerCase().includes(attendeeEmail.toLowerCase())
        );

        if (hasAccess) {
          // Get attendee's calendar events for next 2 weeks
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 14);

          const events = await this.calendarService.getEvents(
            userId,
            'primary',
            startDate,
            endDate,
            100
          );

          // Analyze conflicts and suggest alternatives
          const conflicts = this.analyzeAttendeeConflicts(events, duration, preferences);
          const alternatives = this.generateAttendeeAlternatives(events, duration, preferences);

          availability.push({
            email: attendeeEmail,
            available: conflicts.length === 0,
            conflicts,
            suggestedAlternatives: alternatives,
          });
        } else {
          // External attendee - assume limited availability
          availability.push({
            email: attendeeEmail,
            available: true, // Assume available unless specified
            conflicts: [],
            suggestedAlternatives: [],
          });
        }
      } catch (error) {
        console.error(`❌ Error analyzing availability for ${attendeeEmail}:`, error);
        availability.push({
          email: attendeeEmail,
          available: false,
          conflicts: [],
          suggestedAlternatives: [],
        });
      }
    }

    return availability;
  }

  /**
   * Generate smart time suggestions using AI and calendar analysis
   */
  private async generateSmartTimeSuggestions(
    userId: string,
    request: MeetingRequest,
    preferences: SchedulingPreferences,
    attendeeAvailability: SchedulingResult['attendeeAvailability'],
    analysis: Awaited<ReturnType<typeof this.analyzeMeetingRequest>>
  ): Promise<SmartSuggestion[]> {
    try {
      // Get existing calendar events for context
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Look ahead 2 weeks

      const existingEvents = await this.calendarService.getEvents(
        userId,
        'primary',
        startDate,
        endDate
      );

      // Generate time slots based on preferences and constraints
      const timeSlots = this.generatePotentialTimeSlots(
        startDate,
        endDate,
        request.duration,
        preferences,
        analysis
      );

      // Score each time slot
      const scoredSlots = await Promise.all(
        timeSlots.map(async slot => {
          const conflicts = await this.calendarService.detectConflicts(
            userId,
            slot,
            new Date(slot.getTime() + request.duration * 60000)
          );

          const confidence = this.calculateSlotConfidence(
            slot,
            conflicts,
            preferences,
            analysis,
            attendeeAvailability
          );

          const reason = this.generateSlotReasoning(slot, conflicts, preferences, analysis);

          return {
            suggestedTime: slot,
            duration: request.duration,
            confidence,
            reason,
            conflicts,
          };
        })
      );

      // Sort by confidence and return top suggestions
      return scoredSlots.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('❌ Error generating smart time suggestions:', error);
      return [];
    }
  }

  /**
   * Generate potential time slots based on preferences
   */
  private generatePotentialTimeSlots(
    startDate: Date,
    endDate: Date,
    duration: number,
    preferences: SchedulingPreferences,
    analysis: Awaited<ReturnType<typeof this.analyzeMeetingRequest>>
  ): Date[] {
    const slots: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Check if current day is a working day
      if (preferences.workingDays.includes(current.getDay())) {
        // Generate slots within working hours
        const workStart = this.parseTime(preferences.workingHours.start);
        const workEnd = this.parseTime(preferences.workingHours.end);

        for (let hour = workStart.hour; hour < workEnd.hour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            // 30-minute intervals
            const slotTime = new Date(current);
            slotTime.setHours(hour, minute, 0, 0);

            // Check if slot is within working hours and not in blackout times
            if (this.isValidTimeSlot(slotTime, duration, preferences)) {
              slots.push(new Date(slotTime));
            }
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  /**
   * Calculate confidence score for a time slot
   */
  private calculateSlotConfidence(
    slot: Date,
    conflicts: ConflictEvent[],
    preferences: SchedulingPreferences,
    analysis: Awaited<ReturnType<typeof this.analyzeMeetingRequest>>,
    attendeeAvailability: SchedulingResult['attendeeAvailability']
  ): number {
    let confidence = 1.0;

    // Penalize conflicts
    confidence -= conflicts.length * 0.2;

    // Boost preferred times
    const slotHour = slot.getHours();
    const preferredTime = preferences.preferredTimes.find(pt => {
      const start = this.parseTime(pt.start);
      const end = this.parseTime(pt.end);
      return slotHour >= start.hour && slotHour < end.hour;
    });

    if (preferredTime) {
      confidence +=
        preferredTime.priority === 'high' ? 0.3 : preferredTime.priority === 'medium' ? 0.2 : 0.1;
    }

    // Consider ideal time of day from AI analysis
    if (analysis.idealTimeOfDay === 'morning' && slotHour < 12) {
      confidence += 0.2;
    } else if (analysis.idealTimeOfDay === 'afternoon' && slotHour >= 12 && slotHour < 17) {
      confidence += 0.2;
    } else if (analysis.idealTimeOfDay === 'evening' && slotHour >= 17) {
      confidence += 0.2;
    }

    // Consider attendee availability
    const availableAttendees = attendeeAvailability.filter(a => a.available).length;
    const totalAttendees = attendeeAvailability.length;
    confidence += (availableAttendees / totalAttendees) * 0.3;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate reasoning for time slot selection
   */
  private generateSlotReasoning(
    slot: Date,
    conflicts: ConflictEvent[],
    preferences: SchedulingPreferences,
    analysis: Awaited<ReturnType<typeof this.analyzeMeetingRequest>>
  ): string {
    const reasons: string[] = [];

    if (conflicts.length === 0) {
      reasons.push('No scheduling conflicts');
    } else {
      reasons.push(`${conflicts.length} potential conflicts detected`);
    }

    const slotHour = slot.getHours();
    const preferredTime = preferences.preferredTimes.find(pt => {
      const start = this.parseTime(pt.start);
      const end = this.parseTime(pt.end);
      return slotHour >= start.hour && slotHour < end.hour;
    });

    if (preferredTime) {
      reasons.push(`Matches ${preferredTime.priority} priority time preference`);
    }

    if (analysis.idealTimeOfDay === 'morning' && slotHour < 12) {
      reasons.push('Optimal morning time for this meeting type');
    } else if (analysis.idealTimeOfDay === 'afternoon' && slotHour >= 12 && slotHour < 17) {
      reasons.push('Optimal afternoon time for this meeting type');
    }

    return reasons.join('; ');
  }

  /**
   * Select the best time slot from suggestions
   */
  private selectBestTimeSlot(
    suggestions: SmartSuggestion[],
    request: MeetingRequest,
    preferences: SchedulingPreferences
  ): SmartSuggestion | null {
    if (suggestions.length === 0) return null;

    // Sort by confidence and select the best
    const sorted = suggestions.sort((a, b) => b.confidence - a.confidence);

    // Apply additional filters based on urgency
    if (request.urgency === 'urgent') {
      // For urgent meetings, accept lower confidence if it's sooner
      const urgentSlots = sorted.filter(s => {
        const hoursFromNow = (s.suggestedTime.getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursFromNow <= 24; // Within 24 hours
      });

      if (urgentSlots.length > 0) {
        return urgentSlots[0];
      }
    }

    // Return highest confidence slot
    return sorted[0];
  }

  /**
   * Create calendar event from meeting request
   */
  private async createCalendarEvent(
    userId: string,
    request: MeetingRequest,
    suggestion: SmartSuggestion
  ): Promise<CalendarEvent> {
    const startTime = suggestion.suggestedTime;
    const endTime = new Date(startTime.getTime() + request.duration * 60000);

    const eventData: CalendarEvent = {
      calendarId: 'primary',
      summary: request.title,
      description: request.description,
      location: request.location,
      startTime,
      endTime,
      attendees: request.attendees.map(email => ({
        email,
        responseStatus: 'needsAction' as const,
      })),
      reminders: [
        { method: 'email', minutes: 15 },
        { method: 'popup', minutes: 5 },
      ],
    };

    return await this.calendarService.createEvent(userId, eventData);
  }

  /**
   * Send meeting invitations via email
   */
  private async sendMeetingInvitations(
    userId: string,
    calendarEvent: CalendarEvent,
    request: MeetingRequest
  ): Promise<void> {
    try {
      const invitationContent = this.generateInvitationContent(calendarEvent, request);

      for (const attendeeEmail of request.attendees) {
        await this.gmailService.sendReply(
          userId,
          '', // No original email ID for new invitation
          invitationContent,
          `Meeting Invitation: ${request.title}`
        );
      }

      console.log('✅ Meeting invitations sent successfully');
    } catch (error) {
      console.error('❌ Error sending meeting invitations:', error);
    }
  }

  /**
   * Generate invitation email content
   */
  private generateInvitationContent(calendarEvent: CalendarEvent, request: MeetingRequest): string {
    return `
      <h2>Meeting Invitation: ${calendarEvent.summary}</h2>
      
      <p><strong>Date & Time:</strong> ${calendarEvent.startTime.toLocaleString()} - ${calendarEvent.endTime.toLocaleString()}</p>
      
      ${calendarEvent.location ? `<p><strong>Location:</strong> ${calendarEvent.location}</p>` : ''}
      
      ${calendarEvent.description ? `<p><strong>Description:</strong><br>${calendarEvent.description}</p>` : ''}
      
      <p><strong>Attendees:</strong></p>
      <ul>
        ${request.attendees.map(email => `<li>${email}</li>`).join('')}
      </ul>
      
      <p>This meeting was automatically scheduled by the AI Assistant. Please confirm your attendance.</p>
      
      <p>Best regards,<br>AI Scheduling Assistant</p>
    `;
  }

  /**
   * Record scheduling analytics
   */
  private async recordSchedulingAnalytics(
    userId: string,
    request: MeetingRequest,
    selectedSuggestion: SmartSuggestion | null,
    allSuggestions: SmartSuggestion[]
  ): Promise<void> {
    try {
      await prisma.schedulingAnalytics.create({
        data: {
          userId,
          meetingTitle: request.title,
          meetingType: request.meetingType,
          duration: request.duration,
          attendeeCount: request.attendees.length,
          urgency: request.urgency,
          schedulingSuccess: selectedSuggestion !== null,
          selectedTime: selectedSuggestion?.suggestedTime,
          confidence: selectedSuggestion?.confidence || 0,
          conflictCount: selectedSuggestion?.conflicts.length || 0,
          alternativeCount: allSuggestions.length,
          source: request.source,
          createdAt: new Date(),
        },
      });

      console.log('✅ Scheduling analytics recorded');
    } catch (error) {
      console.error('❌ Error recording scheduling analytics:', error);
    }
  }

  /**
   * Get user scheduling preferences
   */
  private async getUserPreferences(userId: string): Promise<SchedulingPreferences> {
    try {
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId },
        select: { schedulingPreferences: true },
      });

      if (preferences?.schedulingPreferences) {
        return JSON.parse(preferences.schedulingPreferences as string);
      }
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
    }

    // Return default preferences
    return {
      workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC',
      },
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      meetingDuration: {
        default: 30,
        buffer: 15,
      },
      preferredTimes: [
        { start: '09:00', end: '11:00', priority: 'high' },
        { start: '14:00', end: '16:00', priority: 'medium' },
      ],
      blackoutTimes: [],
      autoAcceptMeetings: false,
      requireConfirmation: true,
      maxMeetingsPerDay: 8,
      travelTimeBuffer: 30,
    };
  }

  /**
   * Analyze attendee conflicts
   */
  private analyzeAttendeeConflicts(
    events: any[],
    duration: number,
    preferences: SchedulingPreferences
  ): ConflictEvent[] {
    const conflicts: ConflictEvent[] = [];

    // Implementation would analyze calendar events for conflicts
    // This is a simplified version

    return conflicts;
  }

  /**
   * Generate alternative times for attendees
   */
  private generateAttendeeAlternatives(
    events: any[],
    duration: number,
    preferences: SchedulingPreferences
  ): Date[] {
    const alternatives: Date[] = [];

    // Implementation would generate alternative time slots
    // This is a simplified version

    return alternatives;
  }

  /**
   * Parse time string to hour/minute object
   */
  private parseTime(timeStr: string): { hour: number; minute: number } {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
  }

  /**
   * Check if time slot is valid
   */
  private isValidTimeSlot(
    slot: Date,
    duration: number,
    preferences: SchedulingPreferences
  ): boolean {
    // Check blackout times
    const isBlackedOut = preferences.blackoutTimes.some(
      blackout => slot >= blackout.start && slot <= blackout.end
    );

    if (isBlackedOut) return false;

    // Check if slot + duration fits within working hours
    const slotEnd = new Date(slot.getTime() + duration * 60000);
    const workEnd = this.parseTime(preferences.workingHours.end);
    const workEndTime = new Date(slot);
    workEndTime.setHours(workEnd.hour, workEnd.minute, 0, 0);

    return slotEnd <= workEndTime;
  }

  /**
   * Get scheduling analytics for user
   */
  async getSchedulingAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SchedulingAnalytics> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      const analytics = await prisma.schedulingAnalytics.findMany({
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      const totalMeetings = analytics.length;
      const successfulMeetings = analytics.filter(a => a.schedulingSuccess).length;
      const totalConflicts = analytics.reduce((sum, a) => sum + (a.conflictCount || 0), 0);

      // Calculate metrics
      const conflictResolutionRate =
        totalMeetings > 0 ? ((totalMeetings - totalConflicts) / totalMeetings) * 100 : 0;

      const averageSchedulingTime =
        analytics.reduce((sum, a) => sum + (a.createdAt.getTime() - a.createdAt.getTime()), 0) /
        totalMeetings;

      const meetingEfficiencyScore = (successfulMeetings / totalMeetings) * 100;

      // Group by meeting type
      const meetingTypes = analytics.reduce(
        (acc, a) => {
          acc[a.meetingType] = acc[a.meetingType] || { count: 0, totalDuration: 0 };
          acc[a.meetingType].count++;
          acc[a.meetingType].totalDuration += a.duration;
          return acc;
        },
        {} as Record<string, { count: number; totalDuration: number }>
      );

      const meetingTypeDistribution = Object.entries(meetingTypes).map(([type, data]) => ({
        type,
        count: data.count,
        averageDuration: data.totalDuration / data.count,
      }));

      // Peak scheduling times
      const hourCounts = analytics.reduce(
        (acc, a) => {
          const hour = a.selectedTime?.getHours() || 0;
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      );

      const peakSchedulingTimes = Object.entries(hourCounts).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }));

      return {
        totalMeetingsScheduled: totalMeetings,
        averageSchedulingTime,
        conflictResolutionRate,
        attendeeResponseRate: 85, // This would be calculated from actual responses
        meetingEfficiencyScore,
        commonConflictTypes: [{ type: 'overlap', count: totalConflicts, percentage: 100 }],
        peakSchedulingTimes,
        meetingTypeDistribution,
      };
    } catch (error) {
      console.error('❌ Error getting scheduling analytics:', error);
      throw new Error('Failed to get scheduling analytics');
    }
  }
}
