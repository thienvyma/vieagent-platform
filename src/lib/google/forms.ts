import { google, forms_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import { GoogleAuthManager } from './auth';

const prisma = new PrismaClient();

export interface GoogleForm {
  formId: string;
  title: string;
  description?: string;
  publishedUrl?: string;
  editUrl?: string;
  responseCount: number;
}

export interface FormResponse {
  responseId: string;
  submissionTime: string;
  answers: { [questionId: string]: string };
}

export class GoogleFormsService {
  private authManager: GoogleAuthManager;

  constructor() {
    this.authManager = new GoogleAuthManager();
  }

  async listForms(userId: string, limit: number = 20): Promise<GoogleForm[]> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const forms = google.forms({ version: 'v1', auth });
      const drive = google.drive({ version: 'v3', auth });

      // Get Google Forms files from Drive
      const filesResponse = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.form'",
        pageSize: limit,
        fields: 'files(id, name, description, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      if (!filesResponse.data.files) {
        return [];
      }

      const formsList: GoogleForm[] = [];

      for (const file of filesResponse.data.files) {
        if (file.id) {
          try {
            const formResponse = await forms.forms.get({
              formId: file.id,
            });

            const form = formResponse.data;
            formsList.push({
              formId: file.id,
              title: form.info?.title || file.name || 'Untitled Form',
              description: form.info?.description || undefined,
              publishedUrl: form.responderUri || undefined,
              editUrl: file.webViewLink || undefined,
              responseCount: 0, // Would need separate API call to get actual count
            });
          } catch (error) {
            console.error(`Error fetching form ${file.id}:`, error);
          }
        }
      }

      return formsList;
    } catch (error) {
      console.error('Error listing Google Forms:', error);
      throw new Error('Failed to list Google Forms');
    }
  }

  async getForm(userId: string, formId: string): Promise<GoogleForm | null> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const forms = google.forms({ version: 'v1', auth });

      const response = await forms.forms.get({ formId });
      const form = response.data;

      return {
        formId,
        title: form.info?.title || 'Untitled Form',
        description: form.info?.description || undefined,
        publishedUrl: form.responderUri || undefined,
        editUrl: form.responderUri || undefined,
        responseCount: 0,
      };
    } catch (error) {
      console.error('Error getting Google Form:', error);
      return null;
    }
  }

  async getFormResponses(userId: string, formId: string): Promise<FormResponse[]> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const forms = google.forms({ version: 'v1', auth });

      const response = await forms.forms.responses.list({ formId });

      if (!response.data.responses) {
        return [];
      }

      return response.data.responses.map(response => ({
        responseId: response.responseId || '',
        submissionTime: response.createTime || '',
        answers: {},
      }));
    } catch (error) {
      console.error('Error getting form responses:', error);
      throw new Error('Failed to get form responses');
    }
  }

  async createForm(
    userId: string,
    title: string,
    description?: string
  ): Promise<GoogleForm | null> {
    try {
      const auth = await this.authManager.getAuthenticatedClient(userId);
      if (!auth) {
        throw new Error('User not authenticated with Google');
      }

      const forms = google.forms({ version: 'v1', auth });

      const response = await forms.forms.create({
        requestBody: {
          info: {
            title,
            description,
          },
        },
      });

      const form = response.data;
      if (!form.formId) {
        throw new Error('Failed to create form');
      }

      return {
        formId: form.formId,
        title: form.info?.title || title,
        description: form.info?.description || description,
        publishedUrl: form.publishedUrl || undefined,
        editUrl: form.responderUri || undefined,
        responseCount: 0,
      };
    } catch (error) {
      console.error('Error creating Google Form:', error);
      return null;
    }
  }
}
