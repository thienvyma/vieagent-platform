import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthManager } from './auth';

const prisma = new PrismaClient();

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  downloadUrl?: string;
}

export class GoogleDriveService {
  private authManager: GoogleAuthManager;

  constructor() {
    this.authManager = new GoogleAuthManager();
  }

  async listFiles(userId: string, limit: number = 50): Promise<GoogleDriveFile[]> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.list({
        pageSize: limit,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      if (!response.data.files) {
        return [];
      }

      return response.data.files.map(file => ({
        id: file.id || '',
        name: file.name || 'Untitled',
        mimeType: file.mimeType || '',
        size: file.size || undefined,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        webViewLink: file.webViewLink || undefined,
      }));
    } catch (error) {
      console.error('Error listing Google Drive files:', error);
      throw new Error('Failed to list Google Drive files');
    }
  }

  async getFile(userId: string, fileId: string): Promise<GoogleDriveFile | null> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
      });

      const file = response.data;
      return {
        id: file.id || '',
        name: file.name || 'Untitled',
        mimeType: file.mimeType || '',
        size: file.size || undefined,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        webViewLink: file.webViewLink || undefined,
      };
    } catch (error) {
      console.error('Error getting Google Drive file:', error);
      return null;
    }
  }

  async uploadFile(
    userId: string,
    fileName: string,
    content: Buffer,
    mimeType: string
  ): Promise<GoogleDriveFile | null> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.create({
        requestBody: {
          name: fileName,
        },
        media: {
          mimeType,
          body: content,
        },
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
      });

      const file = response.data;
      return {
        id: file.id || '',
        name: file.name || fileName,
        mimeType: file.mimeType || mimeType,
        size: file.size || undefined,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        webViewLink: file.webViewLink || undefined,
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      return null;
    }
  }

  async deleteFile(userId: string, fileId: string): Promise<boolean> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const drive = google.drive({ version: 'v3', auth });

      await drive.files.delete({ fileId });
      return true;
    } catch (error) {
      console.error('Error deleting Google Drive file:', error);
      return false;
    }
  }
}
