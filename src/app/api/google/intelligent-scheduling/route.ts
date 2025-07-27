import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IntelligentSchedulerService, MeetingRequest } from '@/lib/google/intelligent-scheduler';

const schedulerService = new IntelligentSchedulerService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'schedule_meeting':
        return await handleScheduleMeeting(session.user.id, data);
      case 'get_suggestions':
        return await handleGetSuggestions(session.user.id, data);
      case 'get_analytics':
        return await handleGetAnalytics(session.user.id, data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error in intelligent scheduling API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleScheduleMeeting(userId: string, data: any) {
  try {
    const meetingRequest: MeetingRequest = {
      title: data.title,
      description: data.description,
      duration: data.duration || 30,
      attendees: data.attendees || [],
      preferredTimes: data.preferredTimes,
      location: data.location,
      isVirtual: data.isVirtual || false,
      urgency: data.urgency || 'medium',
      requiredAttendees: data.requiredAttendees,
      optionalAttendees: data.optionalAttendees,
      meetingType: data.meetingType || 'other',
      source: 'api',
    };

    const result = await schedulerService.scheduleSmartMeeting(
      userId,
      meetingRequest,
      data.preferences
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Error scheduling meeting:', error);
    return NextResponse.json({ error: 'Failed to schedule meeting' }, { status: 500 });
  }
}

async function handleGetSuggestions(userId: string, data: any) {
  try {
    const meetingRequest: MeetingRequest = {
      title: data.title,
      duration: data.duration || 30,
      attendees: data.attendees || [],
      urgency: data.urgency || 'medium',
      meetingType: data.meetingType || 'other',
      source: 'api',
    };

    const result = await schedulerService.scheduleSmartMeeting(
      userId,
      meetingRequest,
      data.preferences
    );

    return NextResponse.json({
      success: true,
      data: {
        suggestions: result.alternativeTimes,
        conflicts: result.conflicts,
        attendeeAvailability: result.attendeeAvailability,
      },
    });
  } catch (error) {
    console.error('❌ Error getting suggestions:', error);
    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 });
  }
}

async function handleGetAnalytics(userId: string, data: any) {
  try {
    const analytics = await schedulerService.getSchedulingAnalytics(
      userId,
      data.startDate ? new Date(data.startDate) : undefined,
      data.endDate ? new Date(data.endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'analytics') {
      return await handleGetAnalytics(session.user.id, {
        startDate: url.searchParams.get('startDate'),
        endDate: url.searchParams.get('endDate'),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('❌ Error in intelligent scheduling GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
