import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleSheetsService } from '@/lib/google/sheets';

const sheetsService = new GoogleSheetsService();

// GET /api/google/sheets - List spreadsheets and get data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ FIXED Phase 4D True Fix - Replace as any with proper type assertion
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list':
        const spreadsheets = await sheetsService.listSpreadsheets(userId);
        return NextResponse.json({
          success: true,
          data: spreadsheets,
        });

      case 'get':
        const spreadsheetId = searchParams.get('spreadsheetId');
        if (!spreadsheetId) {
          return NextResponse.json(
            { success: false, error: 'Spreadsheet ID required' },
            { status: 400 }
          );
        }

        const sheet = await sheetsService.getSpreadsheet(userId, spreadsheetId);
        if (!sheet) {
          return NextResponse.json(
            { success: false, error: 'Spreadsheet not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: sheet,
        });

      case 'read':
        const readSpreadsheetId = searchParams.get('spreadsheetId');
        const range = searchParams.get('range') || 'Sheet1!A:Z';

        if (!readSpreadsheetId) {
          return NextResponse.json(
            { success: false, error: 'Spreadsheet ID required' },
            { status: 400 }
          );
        }

        const data = await sheetsService.readSheetData(userId, readSpreadsheetId, range);
        return NextResponse.json({
          success: true,
          data: {
            values: data,
            range,
          },
        });

      case 'templates':
        const templates = sheetsService.getTemplates();
        return NextResponse.json({
          success: true,
          data: templates,
        });

      case 'stats':
        const userSheets = await sheetsService.listSpreadsheets(userId);
        const stats = {
          totalSheets: userSheets.length,
          emailAnalytics: userSheets.filter(s => s.purpose === 'email_analytics').length,
          reports: userSheets.filter(s => s.purpose === 'reporting').length,
          contacts: userSheets.filter(s => s.purpose === 'contact_management').length,
          dataCollection: userSheets.filter(s => s.purpose === 'data_collection').length,
        };

        return NextResponse.json({
          success: true,
          data: stats,
        });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Sheets API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST /api/google/sheets - Create spreadsheets and perform operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ FIXED Phase 4D True Fix - Replace as any with proper type assertion
    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        const { title, templateName } = body;

        if (!title) {
          return NextResponse.json({ success: false, error: 'Title required' }, { status: 400 });
        }

        let template;
        if (templateName) {
          const templates = sheetsService.getTemplates();
          template = templates.find(t => t.name === templateName);
        }

        const createdSheet = await sheetsService.createSpreadsheet(userId, title, template);

        return NextResponse.json({
          success: true,
          data: createdSheet,
          message: 'Spreadsheet created successfully',
        });

      case 'write':
        const { spreadsheetId, range, values, append } = body;

        if (!spreadsheetId || !range || !values) {
          return NextResponse.json(
            { success: false, error: 'Spreadsheet ID, range, and values required' },
            { status: 400 }
          );
        }

        const writeSuccess = await sheetsService.writeSheetData(
          userId,
          spreadsheetId,
          range,
          values,
          append || false
        );

        if (!writeSuccess) {
          return NextResponse.json(
            { success: false, error: 'Failed to write data' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Data written successfully',
        });

      case 'generate-email-report':
        const emailReport = await sheetsService.generateEmailAnalyticsReport(userId);

        return NextResponse.json({
          success: true,
          data: emailReport,
          message: 'Email analytics report generated',
        });

      case 'generate-calendar-report':
        const calendarReport = await sheetsService.generateCalendarReport(userId);

        return NextResponse.json({
          success: true,
          data: calendarReport,
          message: 'Calendar report generated',
        });

      case 'generate-contact-list':
        const contactList = await sheetsService.generateContactList(userId);

        return NextResponse.json({
          success: true,
          data: contactList,
          message: 'Contact list generated',
        });

      case 'update-sync':
        const { sheetId, status } = body;

        if (!sheetId || !status) {
          return NextResponse.json(
            { success: false, error: 'Sheet ID and status required' },
            { status: 400 }
          );
        }

        await sheetsService.updateSyncStatus(userId, sheetId, status);

        return NextResponse.json({
          success: true,
          message: 'Sync status updated',
        });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Sheets POST API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/google/sheets - Delete spreadsheet
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ FIXED Phase 4D True Fix - Replace as any with proper type assertion
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);

    const sheetId = searchParams.get('sheetId');

    if (!sheetId) {
      return NextResponse.json({ success: false, error: 'Sheet ID required' }, { status: 400 });
    }

    const deleted = await sheetsService.deleteSpreadsheet(userId, sheetId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete spreadsheet' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Spreadsheet deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting spreadsheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
