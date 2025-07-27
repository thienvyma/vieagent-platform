import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Google OAuth configuration
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
};

export class GoogleAuthManager {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CONFIG.clientId,
      GOOGLE_CONFIG.clientSecret,
      GOOGLE_CONFIG.redirectUri
    );
  }

  /**
   * Generate Google OAuth authorization URL
   */
  getAuthUrl(userId: string): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_CONFIG.scopes,
      state: userId, // Pass user ID in state for security
      prompt: 'consent', // Force consent to get refresh token
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
    userInfo: any;
  }> {
    try {
      // Get tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Set credentials to get user info
      this.oauth2Client.setCredentials(tokens);

      // Get user information
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiryDate: tokens.expiry_date || undefined,
        userInfo,
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Save Google account to database
   */
  async saveGoogleAccount(
    userId: string,
    tokenData: {
      accessToken: string;
      refreshToken?: string;
      expiryDate?: number;
      userInfo: any;
    }
  ): Promise<any> {
    try {
      const { accessToken, refreshToken, expiryDate, userInfo } = tokenData;

      // Check if account already exists
      const existingAccount = await prisma.googleAccount.findUnique({
        where: { googleId: userInfo.id },
      });

      if (existingAccount) {
        // Update existing account
        return await prisma.googleAccount.update({
          where: { googleId: userInfo.id },
          data: {
            accessToken,
            refreshToken: refreshToken || existingAccount.refreshToken,
            tokenExpiry: expiryDate ? new Date(expiryDate) : null,
            name: userInfo.name,
            picture: userInfo.picture,
            scopes: JSON.stringify(GOOGLE_CONFIG.scopes),
            isActive: true,
            lastSync: new Date(),
          },
        });
      } else {
        // Create new account
        return await prisma.googleAccount.create({
          data: {
            userId,
            googleId: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            accessToken,
            refreshToken,
            tokenExpiry: expiryDate ? new Date(expiryDate) : null,
            scopes: JSON.stringify(GOOGLE_CONFIG.scopes),
            isActive: true,
            lastSync: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error saving Google account:', error);
      throw new Error('Failed to save Google account');
    }
  }

  /**
   * Get authenticated OAuth2 client for user
   */
  async getAuthenticatedClient(userId: string): Promise<OAuth2Client | null> {
    try {
      const googleAccount = await prisma.googleAccount.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!googleAccount) {
        return null;
      }

      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CONFIG.clientId,
        GOOGLE_CONFIG.clientSecret,
        GOOGLE_CONFIG.redirectUri
      );

      oauth2Client.setCredentials({
        access_token: googleAccount.accessToken,
        refresh_token: googleAccount.refreshToken,
        expiry_date: googleAccount.tokenExpiry?.getTime(),
      });

      // Check if token needs refresh
      if (googleAccount.tokenExpiry && googleAccount.tokenExpiry < new Date()) {
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();

          // Update tokens in database
          await prisma.googleAccount.update({
            where: { id: googleAccount.id },
            data: {
              accessToken: credentials.access_token!,
              tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
              lastSync: new Date(),
            },
          });

          oauth2Client.setCredentials(credentials);
        } catch (error) {
          console.error('Error refreshing token:', error);
          // Mark account as inactive if refresh fails
          await prisma.googleAccount.update({
            where: { id: googleAccount.id },
            data: { isActive: false },
          });
          return null;
        }
      }

      return oauth2Client;
    } catch (error) {
      console.error('Error getting authenticated client:', error);
      return null;
    }
  }

  /**
   * Revoke Google account access
   */
  async revokeAccess(userId: string, googleAccountId: string): Promise<boolean> {
    try {
      const googleAccount = await prisma.googleAccount.findFirst({
        where: {
          id: googleAccountId,
          userId,
        },
      });

      if (!googleAccount) {
        return false;
      }

      // Revoke token with Google
      try {
        const oauth2Client = new google.auth.OAuth2(
          GOOGLE_CONFIG.clientId,
          GOOGLE_CONFIG.clientSecret,
          GOOGLE_CONFIG.redirectUri
        );

        oauth2Client.setCredentials({
          access_token: googleAccount.accessToken,
        });

        await oauth2Client.revokeToken(googleAccount.accessToken);
      } catch (error) {
        console.error('Error revoking token with Google:', error);
        // Continue with database cleanup even if Google revocation fails
      }

      // Mark account as inactive
      await prisma.googleAccount.update({
        where: { id: googleAccountId },
        data: {
          isActive: false,
          lastSync: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error revoking access:', error);
      return false;
    }
  }

  /**
   * Get user's Google accounts
   */
  async getUserGoogleAccounts(userId: string) {
    try {
      return await prisma.googleAccount.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          googleId: true,
          email: true,
          name: true,
          picture: true,
          scopes: true,
          lastSync: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Error getting user Google accounts:', error);
      return [];
    }
  }
}

export const googleAuth = new GoogleAuthManager();
