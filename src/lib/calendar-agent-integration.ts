import { GoogleCalendarService, CalendarEvent } from './google/calendar';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const calendarService = new GoogleCalendarService();

export interface SchedulingIntent {
  action: 'schedule' | 'reschedule' | 'cancel' | 'check_availability';
  title?: string;
  date?: string;
  time?: string;
  duration?: number; // minutes
  attendees?: string[];
  location?: string;
  description?: string;
  eventId?: string; // for reschedule/cancel
}

export interface SchedulingResponse {
  success: boolean;
  message: string;
  event?: any;
  suggestions?: any[];
  error?: string;
}

export class CalendarAgentIntegration {
  /**
   * Phát hiện intent lên lịch từ tin nhắn người dùng
   */
  static detectSchedulingIntent(message: string): SchedulingIntent | null {
    const lowerMessage = message.toLowerCase();

    // Keywords cho các action khác nhau
    const scheduleKeywords = [
      'lên lịch',
      'đặt lịch',
      'schedule',
      'book',
      'tạo cuộc họp',
      'meeting',
      'hẹn',
    ];
    const rescheduleKeywords = ['đổi lịch', 'reschedule', 'thay đổi', 'move'];
    const cancelKeywords = ['hủy lịch', 'cancel', 'xóa lịch', 'delete'];
    const checkKeywords = [
      'kiểm tra lịch',
      'xem lịch',
      'check calendar',
      'available',
      'free time',
      'rảnh',
    ];

    let action: SchedulingIntent['action'] = 'schedule';

    if (rescheduleKeywords.some(keyword => lowerMessage.includes(keyword))) {
      action = 'reschedule';
    } else if (cancelKeywords.some(keyword => lowerMessage.includes(keyword))) {
      action = 'cancel';
    } else if (checkKeywords.some(keyword => lowerMessage.includes(keyword))) {
      action = 'check_availability';
    } else if (!scheduleKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return null; // Không phải lệnh lên lịch
    }

    // Extract thông tin từ tin nhắn
    const intent: SchedulingIntent = { action };

    // Extract title/subject
    const titleMatches = message.match(/(?:cuộc họp|meeting|lịch)\s+([^,.\n]+)/i);
    if (titleMatches) {
      intent.title = titleMatches[1].trim();
    }

    // Extract date
    const datePatterns = [
      /(?:ngày mai|tomorrow)/i,
      /(?:hôm nay|today)/i,
      /(?:thứ\s+\w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/,
      /\d{1,2}-\d{1,2}(?:-\d{2,4})?/,
    ];

    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        intent.date = match[0];
        break;
      }
    }

    // Extract time
    const timePatterns = [
      /\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?/,
      /\d{1,2}\s*(?:giờ|h)\s*(?:\d{2}\s*(?:phút|m))?/,
      /(?:sáng|chiều|tối)\s*\d{1,2}(?::\d{2})?/,
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        intent.time = match[0];
        break;
      }
    }

    // Extract duration - improved parsing
    const durationPatterns = [
      /từ\s+(\d{1,2})(?::(\d{2})|h(\d{2}))?\s*(?:h|giờ)?\s*(?:đến|to|-)\s+(\d{1,2})(?::(\d{2})|h(\d{2}))?\s*(?:h|giờ)?/i, // Time range with h30 support
      /(\d+)\s*(?:tiếng|hours?)\s*(?:(\d+)\s*(?:phút|minutes?|min))?/i,
      /(\d+)\s*(?:phút|minutes?|min)/i,
      /(\d+)\s*(?:giờ|h)(?!\s*(?:đến|\d))/i, // Avoid matching "9h đến" and "9h30"
    ];

    for (const pattern of durationPatterns) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('từ')) {
          // Parse time range (từ 9h đến 11h, từ 9h30 đến 12h)
          const startHour = parseInt(match[1]);
          // match[2] = :minutes, match[3] = h+minutes (9h30)
          const startMinute = parseInt(match[2] || match[3] || '0');
          const endHour = parseInt(match[4]);
          // match[5] = :minutes, match[6] = h+minutes (12h30)
          const endMinute = parseInt(match[5] || match[6] || '0');

          const startTotalMinutes = startHour * 60 + startMinute;
          const endTotalMinutes = endHour * 60 + endMinute;

          intent.duration = endTotalMinutes - startTotalMinutes;
        } else {
          const value = parseInt(match[1]);
          const minutes = match[2] ? parseInt(match[2]) : 0;

          if (pattern.source.includes('tiếng|hours')) {
            intent.duration = value * 60 + minutes;
          } else if (pattern.source.includes('giờ|h')) {
            intent.duration = value * 60;
          } else {
            intent.duration = value; // phút
          }
        }
        break;
      }
    }

    // Không set default duration ở đây, sẽ sử dụng smartSchedulingDuration trong handleScheduleEvent
    // intent.duration sẽ là undefined nếu không parse được từ message

    // Extract location
    const locationMatch = message.match(/(?:tại|at|in|ở)\s+([^,.\n]+)/i);
    if (locationMatch) {
      intent.location = locationMatch[1].trim();
    }

    return intent;
  }

  /**
   * Xử lý intent lên lịch và thực hiện action
   */
  static async processSchedulingIntent(
    userId: string,
    agentId: string,
    intent: SchedulingIntent,
    originalMessage: string
  ): Promise<SchedulingResponse> {
    try {
      // Kiểm tra agent có kết nối Google Calendar không
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
        include: {
          user: {
            include: {
              googleAccounts: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      if (!agent) {
        return {
          success: false,
          message: 'Không tìm thấy agent.',
          error: 'Agent not found',
        };
      }

      // Parse Google services
      let googleServices = {};
      try {
        googleServices = agent.googleServices ? JSON.parse(agent.googleServices) : {};
      } catch (e) {
        googleServices = {};
      }

      if (!(googleServices as any).calendar) {
        return {
          success: false,
          message:
            'Agent chưa được kết nối với Google Calendar. Vui lòng kích hoạt tính năng Calendar trong cài đặt agent.',
          error: 'Calendar not enabled',
        };
      }

      if (agent.user.googleAccounts.length === 0) {
        return {
          success: false,
          message:
            'Chưa kết nối tài khoản Google. Vui lòng kết nối Google account để sử dụng tính năng lên lịch.',
          error: 'No Google account connected',
        };
      }

      const googleAccount = agent.user.googleAccounts[0];
      if (!googleAccount.scopes?.includes('https://www.googleapis.com/auth/calendar')) {
        return {
          success: false,
          message:
            'Tài khoản Google chưa có quyền truy cập Calendar. Vui lòng kết nối lại với quyền Calendar.',
          error: 'No calendar permission',
        };
      }

      // Xử lý theo action
      switch (intent.action) {
        case 'schedule':
          return await this.handleScheduleEvent(userId, agentId, intent, originalMessage);

        case 'check_availability':
          return await this.handleCheckAvailability(userId, agentId, intent);

        case 'reschedule':
          return await this.handleRescheduleEvent(userId, intent);

        case 'cancel':
          return await this.handleCancelEvent(userId, intent);

        default:
          return {
            success: false,
            message: 'Không hiểu yêu cầu. Vui lòng thử lại.',
            error: 'Unknown action',
          };
      }
    } catch (error) {
      console.error('Error processing scheduling intent:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi xử lý yêu cầu lên lịch. Vui lòng thử lại.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Xử lý tạo event mới
   */
  private static async handleScheduleEvent(
    userId: string,
    agentId: string,
    intent: SchedulingIntent,
    originalMessage: string
  ): Promise<SchedulingResponse> {
    try {
      // Lấy thông tin agent để lấy smartSchedulingDuration
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      if (!agent) {
        return {
          success: false,
          message: 'Không tìm thấy agent.',
          error: 'Agent not found',
        };
      }

      // Lấy smartSchedulingDuration từ agent settings (mặc định 60 phút nếu không có)
      const smartSchedulingDuration = agent.smartSchedulingDuration || 60;

      // Chỉ sử dụng smartSchedulingDuration khi KHÔNG có thời gian kết thúc cụ thể
      const hasSpecificTimeRange = this.hasSpecificTimeRange(originalMessage, intent.duration);
      const finalDuration = hasSpecificTimeRange ? intent.duration : smartSchedulingDuration;

      console.log('🧠 Smart Scheduling Logic:', {
        originalMessage,
        originalDuration: intent.duration,
        smartSchedulingDuration,
        hasSpecificTimeRange,
        finalDuration,
        timeStr: intent.time,
      });

      // Parse date và time với duration đã được điều chỉnh
      const { startTime, endTime } = this.parseDateTime(intent.date, intent.time, finalDuration);

      if (!startTime || !endTime) {
        // Nếu không parse được thời gian, đề xuất thời gian với smartSchedulingDuration
        const suggestions = await calendarService.getSmartSuggestions(
          userId,
          smartSchedulingDuration,
          undefined,
          intent.attendees
        );

        return {
          success: false,
          message:
            'Không thể xác định thời gian chính xác. Dưới đây là một số gợi ý thời gian phù hợp:',
          suggestions: suggestions.slice(0, 3).map(s => ({
            time: s.suggestedTime.toLocaleString('vi-VN'),
            confidence: Math.round(s.confidence * 100),
            reason: s.reason,
          })),
        };
      }

      // Kiểm tra conflicts
      const conflicts = await calendarService.detectConflicts(userId, startTime, endTime);

      if (conflicts.length > 0) {
        const conflictMessages = conflicts
          .map(
            c =>
              `- ${c.summary} (${c.startTime.toLocaleTimeString()} - ${c.endTime.toLocaleTimeString()})`
          )
          .join('\n');

        return {
          success: false,
          message: `Thời gian này đã có lịch trình khác:\n${conflictMessages}\n\nVui lòng chọn thời gian khác hoặc tôi có thể đề xuất thời gian phù hợp.`,
        };
      }

      // Tạo event
      const eventData: CalendarEvent = {
        calendarId: 'primary',
        summary: intent.title || 'Cuộc họp',
        description: `Được tạo tự động từ AI Agent.\nYêu cầu gốc: "${originalMessage}"\n\n🧠 Smart Scheduling: ${hasSpecificTimeRange ? 'Sử dụng thời gian cụ thể' : `Sử dụng thời gian mặc định ${smartSchedulingDuration} phút`}`,
        location: intent.location,
        startTime,
        endTime,
        attendees: intent.attendees?.map(email => ({ email })),
        reminders: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 },
        ],
      };

      const createdEvent = await calendarService.createEvent(userId, eventData);

      // Lưu vào database với AI generated flag
      await prisma.googleCalendarEvent.updateMany({
        where: { googleEventId: createdEvent.id! },
        data: {
          aiGenerated: true,
          aiContext: JSON.stringify({
            originalMessage,
            intent,
            agentGenerated: true,
            smartSchedulingUsed: !hasSpecificTimeRange,
            smartSchedulingDuration: hasSpecificTimeRange ? null : smartSchedulingDuration,
          }),
        },
      });

      const durationText = hasSpecificTimeRange
        ? `(thời gian cụ thể: ${Math.round((endTime.getTime() - startTime.getTime()) / 60000)} phút)`
        : `(🧠 Smart Scheduling: ${smartSchedulingDuration} phút)`;

      return {
        success: true,
        message: `✅ Đã tạo lịch thành công!\n\n📅 ${eventData.summary}\n🕐 ${startTime.toLocaleString('vi-VN')} - ${endTime.toLocaleString('vi-VN')} ${durationText}\n📍 ${eventData.location || 'Không có địa điểm'}\n\nBạn sẽ nhận được thông báo 15 phút và 1 giờ trước cuộc họp.`,
        event: {
          id: createdEvent.id,
          title: eventData.summary,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          location: eventData.location,
        },
      };
    } catch (error) {
      console.error('Error creating event:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi tạo lịch. Vui lòng thử lại.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Kiểm tra xem có thời gian cụ thể bắt đầu và kết thúc không
   */
  private static hasSpecificTimeRange(message: string, duration?: number): boolean {
    if (!message) return false;

    // Kiểm tra xem có time range pattern không (từ X đến Y)
    const hasTimeRange =
      /(?:từ|from)\s+(\d{1,2})(?::(\d{2}))?\s*(?:h|giờ|am|pm)?\s*(?:đến|to|-)\s+(\d{1,2})(?::(\d{2}))?\s*(?:h|giờ|am|pm)?/i.test(
        message
      );

    // Kiểm tra có duration được parse từ message KHÔNG PHẢI là thời gian bắt đầu
    // Duration patterns: "2 tiếng", "90 phút", "3 giờ" (không có số cụ thể như "9h")
    const hasParsedDuration = duration && this.isDurationNotStartTime(message, duration);

    return hasTimeRange || Boolean(hasParsedDuration);
  }

  /**
   * Kiểm tra xem duration có phải là duration thật sự hay chỉ là thời gian bắt đầu
   */
  private static isDurationNotStartTime(message: string, duration: number): boolean {
    // Nếu có các từ khóa duration rõ ràng thì là duration thật
    const durationKeywords = /(\d+)\s*(?:tiếng|hours?|phút|minutes?|min)/i;
    if (durationKeywords.test(message)) {
      return true;
    }

    // Nếu chỉ có pattern "Xh" hoặc "X giờ" mà không có từ khóa duration
    // và X là số giờ hợp lý (0-23) thì đây là thời gian bắt đầu, không phải duration
    const timeOnlyPattern = /(\d{1,2})\s*(?:giờ|h)(?!\s*(?:\d+|phút|tiếng|đến))/i;
    const match = message.match(timeOnlyPattern);

    if (match) {
      const hour = parseInt(match[1]);
      // Nếu là giờ hợp lý (0-23) và duration tương ứng với giờ đó * 60
      // thì đây là thời gian bắt đầu, không phải duration
      if (hour >= 0 && hour <= 23 && duration === hour * 60) {
        return false; // Đây là thời gian bắt đầu
      }
    }

    return true; // Default: coi như duration thật
  }

  /**
   * Xử lý kiểm tra lịch trống
   */
  private static async handleCheckAvailability(
    userId: string,
    agentId: string,
    intent: SchedulingIntent
  ): Promise<SchedulingResponse> {
    try {
      // Lấy thông tin agent để lấy smartSchedulingDuration
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, userId },
      });

      const smartSchedulingDuration = agent?.smartSchedulingDuration || 60;

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let startDate = today;
      let endDate = tomorrow;

      // Parse date nếu có
      if (intent.date) {
        const parsedDate = this.parseDate(intent.date);
        if (parsedDate) {
          startDate = parsedDate;
          endDate = new Date(parsedDate);
          endDate.setDate(endDate.getDate() + 1);
        }
      }

      // Lấy events trong khoảng thời gian
      const events = await calendarService.getEvents(userId, 'primary', startDate, endDate);

      if (events.length === 0) {
        return {
          success: true,
          message: `📅 Bạn hoàn toàn rảnh vào ${startDate.toLocaleDateString('vi-VN')}. Có thể đặt lịch bất kỳ thời gian nào!`,
        };
      }

      const eventList = events
        .map(event => {
          const start = new Date(event.start?.dateTime || event.start?.date || '');
          const end = new Date(event.end?.dateTime || event.end?.date || '');
          return `- ${event.summary} (${start.toLocaleTimeString()} - ${end.toLocaleTimeString()})`;
        })
        .join('\n');

      // Đề xuất thời gian trống với smartSchedulingDuration
      const suggestions = await calendarService.getSmartSuggestions(
        userId,
        smartSchedulingDuration,
        undefined,
        undefined,
        'primary'
      );

      const suggestionText = suggestions
        .slice(0, 3)
        .map(
          s =>
            `- ${s.suggestedTime.toLocaleString('vi-VN')} (${Math.round(s.confidence * 100)}% phù hợp, ${smartSchedulingDuration} phút)`
        )
        .join('\n');

      return {
        success: true,
        message: `📅 Lịch của bạn vào ${startDate.toLocaleDateString('vi-VN')}:\n\n${eventList}\n\n💡 Thời gian trống được đề xuất (🧠 Smart Scheduling: ${smartSchedulingDuration} phút):\n${suggestionText}`,
        suggestions: suggestions.slice(0, 3),
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi kiểm tra lịch. Vui lòng thử lại.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Xử lý đổi lịch (placeholder)
   */
  private static async handleRescheduleEvent(
    userId: string,
    intent: SchedulingIntent
  ): Promise<SchedulingResponse> {
    return {
      success: false,
      message: 'Tính năng đổi lịch đang được phát triển. Vui lòng hủy lịch cũ và tạo lịch mới.',
      error: 'Feature not implemented',
    };
  }

  /**
   * Xử lý hủy lịch (placeholder)
   */
  private static async handleCancelEvent(
    userId: string,
    intent: SchedulingIntent
  ): Promise<SchedulingResponse> {
    return {
      success: false,
      message: 'Tính năng hủy lịch đang được phát triển. Vui lòng vào Google Calendar để hủy lịch.',
      error: 'Feature not implemented',
    };
  }

  /**
   * Parse date và time thành Date objects
   */
  private static parseDateTime(
    dateStr?: string,
    timeStr?: string,
    duration?: number
  ): { startTime: Date | null; endTime: Date | null } {
    try {
      let baseDate = new Date();

      // Parse date
      if (dateStr) {
        const parsedDate = this.parseDate(dateStr);
        if (parsedDate) {
          baseDate = parsedDate;
        }
      }

      // Parse time with better logic
      let hour = 12; // Default noon
      let minute = 0;
      let endHour: number | null = null;
      let endMinute: number | null = null;

      if (timeStr) {
        // Check for time range first (từ 9h đến 11h, from 9am to 11am)
        const rangeMatch = timeStr.match(
          /(?:từ|from)\s+(\d{1,2})(?::(\d{2}))?\s*(?:h|giờ|am|pm)?\s*(?:đến|to|-)\s+(\d{1,2})(?::(\d{2}))?\s*(?:h|giờ|am|pm)?/i
        );

        if (rangeMatch) {
          hour = parseInt(rangeMatch[1]);
          minute = parseInt(rangeMatch[2] || '0');
          endHour = parseInt(rangeMatch[3]);
          endMinute = parseInt(rangeMatch[4] || '0');
        } else {
          // Regular time parsing
          const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(?:(am|pm|AM|PM)|giờ|h)?/);
          if (timeMatch) {
            hour = parseInt(timeMatch[1]);
            minute = parseInt(timeMatch[2] || '0');

            const period = timeMatch[3]?.toLowerCase();
            if (period === 'pm' && hour !== 12) {
              hour += 12;
            } else if (period === 'am' && hour === 12) {
              hour = 0;
            }
          }
        }
      }

      const startTime = new Date(baseDate);
      startTime.setHours(hour, minute, 0, 0);

      // Nếu thời gian đã qua trong ngày hôm nay, chuyển sang ngày mai
      if (startTime < new Date() && !dateStr) {
        startTime.setDate(startTime.getDate() + 1);
      }

      const endTime = new Date(startTime);

      // Calculate end time
      if (endHour !== null && endMinute !== null) {
        // Use parsed end time from range
        endTime.setHours(endHour, endMinute, 0, 0);

        // If end time is before start time, assume next day
        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }
      } else {
        // Use duration
        endTime.setMinutes(endTime.getMinutes() + (duration || 60));
      }

      return { startTime, endTime };
    } catch (error) {
      console.error('Error parsing date/time:', error);
      return { startTime: null, endTime: null };
    }
  }

  /**
   * Parse date string thành Date object
   */
  private static parseDate(dateStr: string): Date | null {
    const lowerDate = dateStr.toLowerCase();
    const today = new Date();

    if (lowerDate.includes('ngày mai') || lowerDate.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    if (lowerDate.includes('hôm nay') || lowerDate.includes('today')) {
      return today;
    }

    // Parse specific dates
    const dateMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();

      return new Date(year < 100 ? 2000 + year : year, month, day);
    }

    return null;
  }

  /**
   * Tạo response message cho agent chat
   */
  static generateCalendarResponse(
    originalMessage: string,
    schedulingResponse: SchedulingResponse
  ): string {
    if (schedulingResponse.success) {
      return schedulingResponse.message;
    } else {
      // Nếu có suggestions, format chúng
      if (schedulingResponse.suggestions && schedulingResponse.suggestions.length > 0) {
        return (
          schedulingResponse.message +
          '\n\nBạn có muốn tôi đặt lịch vào một trong những thời gian này không?'
        );
      }

      return (
        schedulingResponse.message +
        '\n\nBạn có thể thử lại với thông tin chi tiết hơn về thời gian và ngày tháng.'
      );
    }
  }
}
