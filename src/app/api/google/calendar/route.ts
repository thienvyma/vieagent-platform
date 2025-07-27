import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleCalendarService } from '@/lib/google/calendar';

const calendarService = new GoogleCalendarService();

// GET /api/google/calendar - List calendars and recent events
export async function GET(request: NextRequest) {
  try {
    console.log('📅 Calendar API called with URL:', request.url);
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log('❌ No session or user found');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log('👤 User authenticated - userId:', userId, 'email:', session.user.email);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const calendarId = searchParams.get('calendarId') || 'primary';

    console.log('🎯 Calendar API action:', action, 'calendarId:', calendarId);

    switch (action) {
      case 'calendars':
        const calendars = await calendarService.listCalendars(userId);
        return NextResponse.json({
          success: true,
          data: calendars,
        });

      case 'events':
        const startDate = searchParams.get('startDate')
          ? new Date(searchParams.get('startDate')!)
          : undefined;
        const endDate = searchParams.get('endDate')
          ? new Date(searchParams.get('endDate')!)
          : undefined;
        const maxResults = parseInt(searchParams.get('maxResults') || '20');

        const events = await calendarService.getEvents(
          userId,
          calendarId,
          startDate,
          endDate,
          maxResults
        );

        return NextResponse.json({
          success: true,
          data: events,
        });

      case 'conflicts':
        const conflictStart = searchParams.get('startTime');
        const conflictEnd = searchParams.get('endTime');

        if (!conflictStart || !conflictEnd) {
          return NextResponse.json(
            { success: false, error: 'Start time and end time required' },
            { status: 400 }
          );
        }

        const conflicts = await calendarService.detectConflicts(
          userId,
          new Date(conflictStart),
          new Date(conflictEnd),
          calendarId
        );

        return NextResponse.json({
          success: true,
          data: conflicts,
        });

      case 'suggestions':
        const duration = parseInt(searchParams.get('duration') || '60');
        const preferredTimesParam = searchParams.get('preferredTimes');
        const attendeesParam = searchParams.get('attendees');

        let preferredTimes;
        if (preferredTimesParam) {
          try {
            preferredTimes = JSON.parse(preferredTimesParam).map((time: any) => ({
              start: new Date(time.start),
              end: new Date(time.end),
            }));
          } catch (e) {
            preferredTimes = undefined;
          }
        }

        let attendeeEmails;
        if (attendeesParam) {
          try {
            attendeeEmails = JSON.parse(attendeesParam);
          } catch (e) {
            attendeeEmails = undefined;
          }
        }

        const suggestions = await calendarService.getSmartSuggestions(
          userId,
          duration,
          preferredTimes,
          attendeeEmails,
          calendarId
        );

        return NextResponse.json({
          success: true,
          data: suggestions,
        });

      default:
        // Default: return both calendars and recent events
        const [calendarsData, eventsData] = await Promise.all([
          calendarService.listCalendars(userId),
          calendarService.getEvents(userId, 'primary', new Date(), undefined, 10),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            calendars: calendarsData,
            recentEvents: eventsData,
          },
        });
    }
  } catch (error) {
    console.error('Error in calendar API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
