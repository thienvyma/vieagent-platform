import { google, docs_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthManager } from './auth';

const prisma = new PrismaClient();

export interface GoogleDoc {
  documentId: string;
  title: string;
  content: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

export class GoogleDocsService {
  private authManager: GoogleAuthManager;

  constructor() {
    this.authManager = new GoogleAuthManager();
  }

  async listDocuments(userId: string, limit: number = 10): Promise<GoogleDoc[]> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }
      const docs = google.docs({ version: 'v1', auth });
      const drive = google.drive({ version: 'v3', auth });

      // Get list of Google Docs files
      const filesResponse = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.document'",
        pageSize: limit,
        fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      if (!filesResponse.data.files) {
        return [];
      }

      const documents: GoogleDoc[] = [];

      for (const file of filesResponse.data.files) {
        if (file.id && file.name) {
          try {
            const docResponse = await docs.documents.get({
              documentId: file.id,
            });

            const content = this.extractTextFromDocument(docResponse.data);

            documents.push({
              documentId: file.id,
              title: file.name,
              content,
              createdTime: file.createdTime || '',
              modifiedTime: file.modifiedTime || '',
              webViewLink: file.webViewLink || '',
            });
          } catch (error) {
            console.error(`Error fetching document ${file.id}:`, error);
          }
        }
      }

      return documents;
    } catch (error) {
      console.error('Error listing Google Docs:', error);
      throw new Error('Failed to list Google Docs');
    }
  }

  async getDocument(userId: string, documentId: string): Promise<GoogleDoc | null> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }
      const docs = google.docs({ version: 'v1', auth });
      const drive = google.drive({ version: 'v3', auth });

      const [docResponse, fileResponse] = await Promise.all([
        docs.documents.get({ documentId }),
        drive.files.get({
          fileId: documentId,
          fields: 'name, createdTime, modifiedTime, webViewLink',
        }),
      ]);

      const content = this.extractTextFromDocument(docResponse.data);
      const file = fileResponse.data;

      return {
        documentId,
        title: file.name || 'Untitled Document',
        content,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        webViewLink: file.webViewLink || '',
      };
    } catch (error) {
      console.error('Error getting Google Doc:', error);
      return null;
    }
  }

  private extractTextFromDocument(document: docs_v1.Schema$Document): string {
    let text = '';

    if (document.body?.content) {
      for (const element of document.body.content) {
        if (element.paragraph?.elements) {
          for (const elem of element.paragraph.elements) {
            if (elem.textRun?.content) {
              text += elem.textRun.content;
            }
          }
        }
      }
    }

    return text;
  }

  async createDocument(userId: string, title: string, content: string): Promise<GoogleDoc | null> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }
      const docs = google.docs({ version: 'v1', auth });

      const response = await docs.documents.create({
        requestBody: {
          title,
        },
      });

      if (!response.data.documentId) {
        throw new Error('Failed to create document');
      }

      // Insert content
      if (content) {
        await docs.documents.batchUpdate({
          documentId: response.data.documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: content,
                },
              },
            ],
          },
        });
      }

      return await this.getDocument(userId, response.data.documentId);
    } catch (error) {
      console.error('Error creating Google Doc:', error);
      return null;
    }
  }
}
