import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleCalendarService, CalendarEvent } from '@/lib/google/calendar';

const calendarService = new GoogleCalendarService();

// POST /api/google/calendar/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    // Validate required fields
    const { calendarId, summary, startTime, endTime } = body;
    if (!calendarId || !summary || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: calendarId, summary, startTime, endTime',
        },
        { status: 400 }
      );
    }

    // Build event data
    const eventData: CalendarEvent = {
      calendarId,
      summary,
      description: body.description,
      location: body.location,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      timezone: body.timezone,
      isAllDay: body.isAllDay || false,
      attendees: body.attendees,
      reminders: body.reminders,
      recurrence: body.recurrence,
      visibility: body.visibility,
      status: body.status,
    };

    // Check for conflicts if requested
    if (body.checkConflicts) {
      const conflicts = await calendarService.detectConflicts(
        userId,
        eventData.startTime,
        eventData.endTime,
        calendarId
      );

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Schedule conflict detected',
            conflicts,
          },
          { status: 409 }
        );
      }
    }

    // Create the event
    const createdEvent = await calendarService.createEvent(userId, eventData);

    return NextResponse.json({
      success: true,
      data: createdEvent,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create event',
      },
      { status: 500 }
    );
  }
}

// PUT /api/google/calendar/events - Update existing event
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    // Validate required fields
    const { calendarId, eventId } = body;
    if (!calendarId || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: calendarId, eventId' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Partial<CalendarEvent> = {};

    if (body.summary) updateData.summary = body.summary;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);
    if (body.timezone) updateData.timezone = body.timezone;
    if (body.isAllDay !== undefined) updateData.isAllDay = body.isAllDay;
    if (body.attendees) updateData.attendees = body.attendees;
    if (body.reminders) updateData.reminders = body.reminders;
    if (body.recurrence) updateData.recurrence = body.recurrence;
    if (body.visibility) updateData.visibility = body.visibility;
    if (body.status) updateData.status = body.status;

    // Check for conflicts if time is being changed
    if (body.checkConflicts && (updateData.startTime || updateData.endTime)) {
      const startTime = updateData.startTime || new Date(); // Would need to get existing time
      const endTime = updateData.endTime || new Date(); // Would need to get existing time

      const conflicts = await calendarService.detectConflicts(
        userId,
        startTime,
        endTime,
        calendarId,
        eventId // Exclude this event from conflict check
      );

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Schedule conflict detected',
            conflicts,
          },
          { status: 409 }
        );
      }
    }

    // Update the event
    const updatedEvent = await calendarService.updateEvent(userId, calendarId, eventId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update event',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/google/calendar/events - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);

    const calendarId = searchParams.get('calendarId');
    const eventId = searchParams.get('eventId');

    if (!calendarId || !eventId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: calendarId, eventId' },
        { status: 400 }
      );
    }

    await calendarService.deleteEvent(userId, calendarId, eventId);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete event',
      },
      { status: 500 }
    );
  }
}
