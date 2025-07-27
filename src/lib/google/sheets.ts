import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthManager } from './auth';

const prisma = new PrismaClient();

export interface SheetData {
  id?: string;
  googleSheetId: string;
  title: string;
  url: string;
  worksheets: Array<{
    id: number;
    title: string;
    index: number;
    rowCount: number;
    columnCount: number;
  }>;
  range?: string;
  headers?: string[];
  dataTypes?: Record<string, string>;
  purpose?: 'data_collection' | 'reporting' | 'analysis' | 'contact_management' | 'email_analytics';
}

export interface SheetRow {
  id?: string;
  rowIndex: number;
  values: any[];
  aiContext?: string;
}

export interface SheetTemplate {
  name: string;
  description: string;
  headers: string[];
  dataTypes: Record<string, string>;
  purpose: string;
  sampleData?: any[][];
}

export interface DataSource {
  type: 'emails' | 'calendar' | 'manual' | 'api';
  filters?: Record<string, any>;
  mapping?: Record<string, string>;
}

export interface ReportConfig {
  title: string;
  dataSource: DataSource;
  columns: Array<{
    header: string;
    field: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'formula';
    format?: string;
  }>;
  aggregations?: Array<{
    field: string;
    function: 'count' | 'sum' | 'average' | 'min' | 'max';
  }>;
}

export class GoogleSheetsService {
  private authManager: GoogleAuthManager;

  constructor() {
    this.authManager = new GoogleAuthManager();
  }

  /**
   * Get authenticated Sheets API client
   */
  private async getSheetsClient(userId: string): Promise<sheets_v4.Sheets | null> {
    try {
      console.log('🔐 Getting Sheets authenticated client for userId:', userId);
      const oauth2Client = await this.authManager.getAuthenticatedClient(userId);
      if (!oauth2Client) {
        console.error('❌ No authenticated OAuth2 client found for Sheets user:', userId);
        return null;
      }

      console.log('✅ OAuth2 client obtained, creating Sheets API client');
      return google.sheets({ version: 'v4', auth: oauth2Client });
    } catch (error) {
      console.error('❌ Error getting Sheets client:', error);
      return null;
    }
  }

  /**
   * List user's spreadsheets
   */
  async listSpreadsheets(userId: string): Promise<SheetData[]> {
    try {
      console.log('📊 Listing spreadsheets for userId:', userId);
      // For now, get from database. In production, might query Google Drive API
      const googleAccount = await prisma.googleAccount.findFirst({
        where: { userId, isActive: true },
      });

      if (!googleAccount) {
        console.error('❌ No active Google account found');
        throw new Error('No Google account found. Please connect your Google account first.');
      }

      console.log('📡 Querying database for user spreadsheets');
      const sheets = await prisma.googleSheet.findMany({
        where: { userId },
        include: { rows: true },
        orderBy: { createdAt: 'desc' },
      });

      console.log('✅ Found', sheets.length, 'spreadsheets in database');
      return sheets.map(sheet => ({
        id: sheet.id,
        googleSheetId: sheet.googleSheetId,
        title: sheet.title,
        url: sheet.url,
        worksheets: JSON.parse(sheet.worksheets || '[]'),
        range: sheet.range || undefined,
        headers: sheet.headers ? JSON.parse(sheet.headers) : undefined,
        dataTypes: sheet.dataTypes ? JSON.parse(sheet.dataTypes) : undefined,
        purpose: sheet.purpose as any,
      }));
    } catch (error) {
      console.error('❌ Error listing spreadsheets:', error);
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          throw new Error('Google Sheets authentication failed. Please reconnect your account.');
        }
        if (error.message.includes('insufficient')) {
          throw new Error(
            'Insufficient permissions for Google Sheets. Please reconnect with Sheets access.'
          );
        }
        throw new Error(`Sheets API error: ${error.message}`);
      }
      throw new Error('Failed to list spreadsheets');
    }
  }

  /**
   * Create new spreadsheet
   */
  async createSpreadsheet(
    userId: string,
    title: string,
    template?: SheetTemplate
  ): Promise<SheetData> {
    try {
      const sheets = await this.getSheetsClient(userId);
      if (!sheets) {
        throw new Error('Failed to authenticate with Google Sheets');
      }

      // Create spreadsheet
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
          sheets: [
            {
              properties: {
                title: 'Sheet1',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: template?.headers.length || 10,
                },
              },
            },
          ],
        },
      });

      const spreadsheet = response.data;
      if (!spreadsheet.spreadsheetId || !spreadsheet.spreadsheetUrl) {
        throw new Error('Failed to create spreadsheet');
      }

      // Add headers if template provided
      if (template?.headers) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheet.spreadsheetId,
          range: 'Sheet1!A1:Z1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [template.headers],
          },
        });

        // Add sample data if provided
        if (template.sampleData && template.sampleData.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheet.spreadsheetId,
            range: `Sheet1!A2:Z${template.sampleData.length + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: template.sampleData,
            },
          });
        }
      }

      // Save to database
      const sheetData = await this.saveSheetToDatabase(userId, {
        googleSheetId: spreadsheet.spreadsheetId,
        title,
        url: spreadsheet.spreadsheetUrl,
        worksheets:
          spreadsheet.sheets?.map(sheet => ({
            id: sheet.properties?.sheetId || 0,
            title: sheet.properties?.title || 'Sheet1',
            index: sheet.properties?.index || 0,
            rowCount: sheet.properties?.gridProperties?.rowCount || 1000,
            columnCount: sheet.properties?.gridProperties?.columnCount || 10,
          })) || [],
        headers: template?.headers,
        dataTypes: template?.dataTypes,
        purpose: template?.purpose as any,
      });

      return sheetData;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw new Error('Failed to create spreadsheet');
    }
  }

  /**
   * Get spreadsheet by ID
   */
  async getSpreadsheet(userId: string, spreadsheetId: string): Promise<SheetData | null> {
    try {
      const sheets = await this.getSheetsClient(userId);
      if (!sheets) {
        return null;
      }

      const response = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const spreadsheet = response.data;
      if (!spreadsheet.spreadsheetId) {
        return null;
      }

      return {
        googleSheetId: spreadsheet.spreadsheetId,
        title: spreadsheet.properties?.title || 'Untitled',
        url: spreadsheet.spreadsheetUrl || '',
        worksheets:
          spreadsheet.sheets?.map(sheet => ({
            id: sheet.properties?.sheetId || 0,
            title: sheet.properties?.title || 'Sheet1',
            index: sheet.properties?.index || 0,
            rowCount: sheet.properties?.gridProperties?.rowCount || 1000,
            columnCount: sheet.properties?.gridProperties?.columnCount || 10,
          })) || [],
      };
    } catch (error) {
      console.error('Error getting spreadsheet:', error);
      return null;
    }
  }

  /**
   * Read data from spreadsheet
   */
  async readSheetData(
    userId: string,
    spreadsheetId: string,
    range: string = 'Sheet1!A:Z'
  ): Promise<any[][]> {
    try {
      const sheets = await this.getSheetsClient(userId);
      if (!sheets) {
        throw new Error('Failed to authenticate with Google Sheets');
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error reading sheet data:', error);
      return [];
    }
  }

  /**
   * Write data to spreadsheet
   */
  async writeSheetData(
    userId: string,
    spreadsheetId: string,
    range: string,
    values: any[][],
    append: boolean = false
  ): Promise<boolean> {
    try {
      const sheets = await this.getSheetsClient(userId);
      if (!sheets) {
        throw new Error('Failed to authenticate with Google Sheets');
      }

      if (append) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values,
          },
        });
      } else {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error writing sheet data:', error);
      return false;
    }
  }

  /**
   * Generate email analytics report
   */
  async generateEmailAnalyticsReport(userId: string): Promise<SheetData> {
    try {
      // Get email data from database
      const emails = await prisma.googleEmail.findMany({
        where: { userId },
        orderBy: { googleDate: 'desc' },
        take: 1000,
      });

      // Prepare data for spreadsheet
      const headers = [
        'Date',
        'Subject',
        'From',
        'To',
        'Sentiment',
        'Urgency',
        'Category',
        'Is Read',
        'Response Generated',
        'Meeting Detected',
      ];

      const data = emails.map(email => [
        email.googleDate.toISOString().split('T')[0],
        email.subject,
        email.fromEmail,
        JSON.parse(email.toEmails || '[]')
          .map((to: any) => to.email)
          .join(', '),
        email.aiSentiment || 'Unknown',
        email.aiUrgency || 'Unknown',
        'General', // Would categorize based on content
        email.isRead ? 'Yes' : 'No',
        email.aiResponse ? 'Yes' : 'No',
        'No', // Would check meeting detection
      ]);

      // Create spreadsheet
      const sheet = await this.createSpreadsheet(userId, 'Email Analytics Report', {
        name: 'Email Analytics',
        description: 'Comprehensive email analysis report',
        headers,
        dataTypes: {
          Date: 'date',
          Subject: 'text',
          From: 'text',
          To: 'text',
          Sentiment: 'text',
          Urgency: 'text',
          Category: 'text',
          'Is Read': 'text',
          'Response Generated': 'text',
          'Meeting Detected': 'text',
        },
        purpose: 'email_analytics',
        sampleData: data,
      });

      return sheet;
    } catch (error) {
      console.error('Error generating email analytics report:', error);
      throw new Error('Failed to generate email analytics report');
    }
  }

  /**
   * Generate calendar report
   */
  async generateCalendarReport(userId: string): Promise<SheetData> {
    try {
      // Get calendar events from database
      const events = await prisma.googleCalendarEvent.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 500,
      });

      // Prepare data
      const headers = [
        'Date',
        'Time',
        'Title',
        'Duration (min)',
        'Location',
        'Attendees Count',
        'Status',
        'AI Generated',
        'Conflicts',
      ];

      const data = events.map(event => {
        const duration = Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000);
        const attendees = event.attendees ? JSON.parse(event.attendees).length : 0;

        return [
          event.startTime.toISOString().split('T')[0],
          event.startTime.toLocaleTimeString(),
          event.summary,
          duration,
          event.location || 'No location',
          attendees,
          event.status,
          event.aiGenerated ? 'Yes' : 'No',
          'None', // Would check for conflicts
        ];
      });

      const sheet = await this.createSpreadsheet(userId, 'Calendar Analytics Report', {
        name: 'Calendar Analytics',
        description: 'Meeting and event analysis report',
        headers,
        dataTypes: {
          Date: 'date',
          Time: 'text',
          Title: 'text',
          'Duration (min)': 'number',
          Location: 'text',
          'Attendees Count': 'number',
          Status: 'text',
          'AI Generated': 'text',
          Conflicts: 'text',
        },
        purpose: 'reporting',
      });

      // Write data to spreadsheet
      if (data.length > 0) {
        await this.writeSheetData(
          userId,
          sheet.googleSheetId,
          'Sheet1!A2:I' + (data.length + 1),
          data
        );
      }

      return sheet;
    } catch (error) {
      console.error('Error generating calendar report:', error);
      throw new Error('Failed to generate calendar report');
    }
  }

  /**
   * Generate contact list from emails
   */
  async generateContactList(userId: string): Promise<SheetData> {
    try {
      // Get unique contacts from emails
      const emails = await prisma.googleEmail.findMany({
        where: { userId },
        select: { fromEmail: true, fromName: true, toEmails: true },
      });

      const contactMap = new Map<string, { email: string; name?: string; count: number }>();

      emails.forEach(email => {
        // Add sender
        if (!contactMap.has(email.fromEmail)) {
          contactMap.set(email.fromEmail, {
            email: email.fromEmail,
            name: email.fromName || undefined,
            count: 0,
          });
        }
        contactMap.get(email.fromEmail)!.count++;

        // Add recipients
        try {
          const recipients = JSON.parse(email.toEmails || '[]');
          recipients.forEach((to: any) => {
            if (!contactMap.has(to.email)) {
              contactMap.set(to.email, {
                email: to.email,
                name: to.name || undefined,
                count: 0,
              });
            }
            contactMap.get(to.email)!.count++;
          });
        } catch (e) {
          // Ignore parsing errors
        }
      });

      // Prepare data
      const headers = ['Email', 'Name', 'Interaction Count', 'Domain', 'Type'];

      const data = Array.from(contactMap.values())
        .sort((a, b) => b.count - a.count)
        .map(contact => [
          contact.email,
          contact.name || 'Unknown',
          contact.count,
          contact.email.split('@')[1] || 'Unknown',
          contact.email.includes('@gmail.com') ? 'Personal' : 'Business',
        ]);

      const sheet = await this.createSpreadsheet(userId, 'Contact List', {
        name: 'Contact Management',
        description: 'Contact list extracted from email communications',
        headers,
        dataTypes: {
          Email: 'text',
          Name: 'text',
          'Interaction Count': 'number',
          Domain: 'text',
          Type: 'text',
        },
        purpose: 'contact_management',
      });

      // Write data
      if (data.length > 0) {
        await this.writeSheetData(
          userId,
          sheet.googleSheetId,
          'Sheet1!A2:E' + (data.length + 1),
          data
        );
      }

      return sheet;
    } catch (error) {
      console.error('Error generating contact list:', error);
      throw new Error('Failed to generate contact list');
    }
  }

  /**
   * Get predefined templates
   */
  getTemplates(): SheetTemplate[] {
    return [
      {
        name: 'Email Analytics',
        description: 'Track email performance and sentiment analysis',
        headers: ['Date', 'Subject', 'From', 'Sentiment', 'Urgency', 'Category', 'Response Time'],
        dataTypes: {
          Date: 'date',
          Subject: 'text',
          From: 'text',
          Sentiment: 'text',
          Urgency: 'text',
          Category: 'text',
          'Response Time': 'number',
        },
        purpose: 'email_analytics',
      },
      {
        name: 'Meeting Analytics',
        description: 'Analyze meeting patterns and effectiveness',
        headers: ['Date', 'Title', 'Duration', 'Attendees', 'Location', 'Type', 'Outcome'],
        dataTypes: {
          Date: 'date',
          Title: 'text',
          Duration: 'number',
          Attendees: 'number',
          Location: 'text',
          Type: 'text',
          Outcome: 'text',
        },
        purpose: 'analysis',
      },
      {
        name: 'Contact Management',
        description: 'Manage contacts and communication history',
        headers: ['Name', 'Email', 'Phone', 'Company', 'Last Contact', 'Notes', 'Priority'],
        dataTypes: {
          Name: 'text',
          Email: 'text',
          Phone: 'text',
          Company: 'text',
          'Last Contact': 'date',
          Notes: 'text',
          Priority: 'text',
        },
        purpose: 'contact_management',
      },
      {
        name: 'Data Collection',
        description: 'General purpose data collection template',
        headers: ['Timestamp', 'Source', 'Data Type', 'Value', 'Category', 'Status', 'Notes'],
        dataTypes: {
          Timestamp: 'date',
          Source: 'text',
          'Data Type': 'text',
          Value: 'text',
          Category: 'text',
          Status: 'text',
          Notes: 'text',
        },
        purpose: 'data_collection',
      },
    ];
  }

  /**
   * Save spreadsheet to database
   */
  private async saveSheetToDatabase(
    userId: string,
    sheetData: Partial<SheetData>
  ): Promise<SheetData> {
    try {
      const googleAccount = await prisma.googleAccount.findFirst({
        where: { userId, isActive: true },
      });

      if (!googleAccount) {
        throw new Error('Google account not found');
      }

      const sheet = await prisma.googleSheet.create({
        data: {
          userId,
          googleAccountId: googleAccount.id,
          googleSheetId: sheetData.googleSheetId!,
          title: sheetData.title!,
          url: sheetData.url!,
          worksheets: JSON.stringify(sheetData.worksheets || []),
          range: sheetData.range,
          headers: sheetData.headers ? JSON.stringify(sheetData.headers) : null,
          dataTypes: sheetData.dataTypes ? JSON.stringify(sheetData.dataTypes) : null,
          purpose: sheetData.purpose,
          aiGenerated: true,
        },
      });

      return {
        id: sheet.id,
        googleSheetId: sheet.googleSheetId,
        title: sheet.title,
        url: sheet.url,
        worksheets: JSON.parse(sheet.worksheets),
        range: sheet.range || undefined,
        headers: sheet.headers ? JSON.parse(sheet.headers) : undefined,
        dataTypes: sheet.dataTypes ? JSON.parse(sheet.dataTypes) : undefined,
        purpose: sheet.purpose as any,
      };
    } catch (error) {
      console.error('Error saving sheet to database:', error);
      throw error;
    }
  }

  /**
   * Update spreadsheet sync status
   */
  async updateSyncStatus(userId: string, sheetId: string, status: string): Promise<void> {
    try {
      await prisma.googleSheet.update({
        where: { id: sheetId },
        data: {
          syncStatus: status,
          lastSync: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  /**
   * Delete spreadsheet
   */
  async deleteSpreadsheet(userId: string, sheetId: string): Promise<boolean> {
    try {
      // Delete from database (Google Sheets stays in Google Drive)
      await prisma.googleSheet.delete({
        where: { id: sheetId, userId },
      });

      return true;
    } catch (error) {
      console.error('Error deleting spreadsheet:', error);
      return false;
    }
  }
}
