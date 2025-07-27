# 🔐 Google OAuth Production Setup Guide

## 📋 **Overview**

This guide walks you through setting up Google OAuth for production deployment of VIEAgent, enabling Google Workspace integrations including Gmail, Calendar, and Sheets.

**Production Requirements:**
- ✅ Google Cloud Console project for production
- ✅ OAuth 2.0 credentials with production domain
- ✅ Proper scopes for Google Workspace APIs
- ✅ Domain verification and consent screen
- ✅ Security and compliance configurations

---

## 🚀 **Step 1: Google Cloud Console Setup**

### **1.1 Create Production Project**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. **Select a project** → **New Project**
3. **Project name**: `VIEAgent-Production`
4. **Organization**: Select your organization
5. **Location**: Choose appropriate location
6. Click **Create**

### **1.2 Enable Required APIs**
Enable these APIs for Google Workspace integration:

```bash
# Gmail API
https://console.cloud.google.com/apis/library/gmail.googleapis.com

# Google Calendar API
https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

# Google Sheets API
https://console.cloud.google.com/apis/library/sheets.googleapis.com

# Google Drive API (for file operations)
https://console.cloud.google.com/apis/library/drive.googleapis.com

# People API (for contacts)
https://console.cloud.google.com/apis/library/people.googleapis.com
```

For each API:
1. Search for the API name
2. Click on the API
3. Click **Enable**

---

## 🔐 **Step 2: OAuth Consent Screen Configuration**

### **2.1 Configure OAuth Consent Screen**
1. Go to **APIs & Services** → **OAuth consent screen**
2. **User Type**: Choose **External** (unless you have Google Workspace)
3. Click **Create**

### **2.2 App Information**
```
App name: VIEAgent
User support email: support@yourdomain.com
App logo: [Upload your VIEAgent logo - 120x120px PNG]

Developer contact information:
Email addresses: admin@yourdomain.com
```

### **2.3 App Domain Configuration**
```
Application home page: https://yourdomain.com
Application privacy policy link: https://yourdomain.com/privacy
Application terms of service link: https://yourdomain.com/terms
```

### **2.4 Authorized Domains**
Add your production domains:
```
yourdomain.com
vieagent.yourdomain.com
```

---

## 🔑 **Step 3: OAuth 2.0 Credentials**

### **3.1 Create OAuth 2.0 Client ID**
1. Go to **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth 2.0 Client ID**
3. **Application type**: Web application
4. **Name**: `VIEAgent-Production-OAuth`

### **3.2 Authorized Redirect URIs**
Add these redirect URIs for production:
```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/google/auth/callback
https://vieagent.yourdomain.com/api/auth/callback/google
```

### **3.3 Download Credentials**
1. Click **Create**
2. **Download JSON** and save as `google-oauth-production.json`
3. Note the **Client ID** and **Client Secret**

---

## ⚙️ **Step 4: Scopes Configuration**

### **4.1 Required OAuth Scopes**
Configure these scopes for VIEAgent functionality:

```typescript
// src/lib/google/oauth-scopes.ts
export const GOOGLE_OAUTH_SCOPES = [
  // Basic profile information
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  
  // Gmail integration
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  
  // Calendar integration
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  
  // Google Sheets integration
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  
  // Contacts (optional)
  'https://www.googleapis.com/auth/contacts.readonly',
];

// Scope descriptions for consent screen
export const SCOPE_DESCRIPTIONS = {
  'gmail.readonly': 'Read your Gmail messages',
  'gmail.send': 'Send emails on your behalf',
  'gmail.compose': 'Compose and manage email drafts',
  'calendar': 'Manage your Google Calendar events',
  'spreadsheets': 'Access and edit your Google Sheets',
  'drive.file': 'Access files created by VIEAgent in your Google Drive',
  'contacts.readonly': 'View your Google contacts'
};
```

### **4.2 Scope Justification Documentation**
Create justification for sensitive scopes:

```markdown
# Google API Scopes Justification for VIEAgent

## Gmail Scopes
- **gmail.readonly**: Required to analyze emails for AI-powered insights
- **gmail.send**: Enables AI agent to send email responses 
- **gmail.compose**: Allows AI to draft emails for user review

## Calendar Scopes
- **calendar**: Required for AI scheduling and calendar management
- **calendar.events**: Enables AI to create, modify, and manage events

## Drive/Sheets Scopes
- **spreadsheets**: For data analysis and report generation features
- **drive.file**: Access only to files created by VIEAgent application

## Contacts Scopes
- **contacts.readonly**: For intelligent email addressing and relationship insights
```

---

## 🔧 **Step 5: Production Environment Configuration**

### **5.1 Environment Variables**
Add to your `.env.production`:

```bash
# Google OAuth Production Configuration
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YourGoogleClientSecret"
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/callback/google"

# Google API Configuration
GOOGLE_API_KEY="AIzaSyBYourGoogleAPIKey"

# OAuth settings
GOOGLE_OAUTH_SCOPES="profile email gmail.readonly gmail.send calendar spreadsheets"
```

### **5.2 NextAuth.js Configuration**
Update your NextAuth configuration for production:

```typescript
// src/lib/auth.ts (production configuration)
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/spreadsheets'
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      return session;
    }
  },
  
  // Production-specific settings
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error'
  }
};
```

---

## 🔄 **Step 6: Token Management & Refresh**

### **6.1 Token Refresh Service**
Create a robust token refresh mechanism:

```typescript
// src/lib/google/token-manager.ts
export class GoogleTokenManager {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update database with new tokens
      await this.updateUserTokens(credentials);
      
      return {
        access_token: credentials.access_token!,
        expires_in: credentials.expiry_date! - Date.now(),
        token_type: 'Bearer'
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      );
      
      if (response.ok) {
        const tokenInfo = await response.json();
        return tokenInfo.audience === process.env.GOOGLE_CLIENT_ID;
      }
      
      return false;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
        { method: 'POST' }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Token revocation failed:', error);
      return false;
    }
  }
}
```

### **6.2 Automatic Token Refresh Middleware**
```typescript
// src/lib/google/auth-middleware.ts
export async function withGoogleAuth(
  handler: (req: NextRequest, context: { accessToken: string }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      let accessToken = session.accessToken;
      
      // Check if token is expired
      if (session.expiresAt && Date.now() > session.expiresAt * 1000) {
        // Refresh token
        const tokenManager = new GoogleTokenManager();
        const newTokens = await tokenManager.refreshAccessToken(session.refreshToken);
        accessToken = newTokens.access_token;
      }

      return handler(req, { accessToken });
    } catch (error) {
      console.error('Google auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' }, 
        { status: 401 }
      );
    }
  };
}
```

---

## 🛡️ **Step 7: Security & Compliance**

### **7.1 Domain Verification**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. **Add a property** → Enter your domain
3. **Verify ownership** using:
   - HTML file upload
   - HTML tag
   - Google Analytics
   - DNS record

### **7.2 Security Best Practices**
```typescript
// src/lib/google/security.ts
export class GoogleOAuthSecurity {
  // Validate state parameter to prevent CSRF
  generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateState(providedState: string, sessionState: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(providedState),
      Buffer.from(sessionState)
    );
  }

  // Validate redirect URI
  validateRedirectUri(uri: string): boolean {
    const allowedDomains = [
      'yourdomain.com',
      'vieagent.yourdomain.com'
    ];
    
    try {
      const url = new URL(uri);
      return allowedDomains.includes(url.hostname) && url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  // Rate limiting for OAuth requests
  async checkOAuthRateLimit(userId: string): Promise<boolean> {
    // Implement rate limiting logic
    // Max 10 OAuth attempts per hour per user
    return true;
  }
}
```

### **7.3 Audit Logging**
```typescript
// src/lib/google/oauth-audit.ts
export class OAuthAuditLogger {
  async logOAuthEvent(event: {
    userId: string;
    action: 'login' | 'token_refresh' | 'scope_granted' | 'logout';
    scopes?: string[];
    ip?: string;
    userAgent?: string;
  }) {
    await prisma.oauthAuditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        scopes: event.scopes?.join(','),
        ip: event.ip,
        userAgent: event.userAgent,
        timestamp: new Date()
      }
    });
  }

  async getOAuthHistory(userId: string, limit = 50) {
    return prisma.oauthAuditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
}
```

---

## 🧪 **Step 8: Testing & Validation**

### **8.1 OAuth Flow Testing**
Create comprehensive test script:

```typescript
// scripts/test-google-oauth.ts
async function testGoogleOAuth() {
  console.log('🧪 Testing Google OAuth integration...');

  // Test 1: Validate OAuth configuration
  const isValidConfig = validateOAuthConfig();
  console.log(`✅ OAuth Config Valid: ${isValidConfig}`);

  // Test 2: Test authorization URL generation
  const authUrl = generateAuthUrl();
  console.log(`✅ Auth URL Generated: ${authUrl}`);

  // Test 3: Test token exchange (requires manual authorization)
  // This would be done through browser testing

  // Test 4: Test API access with tokens
  await testGoogleAPIAccess();

  // Test 5: Test token refresh
  await testTokenRefresh();

  console.log('✅ Google OAuth testing completed');
}

async function testGoogleAPIAccess() {
  try {
    // Test Gmail API
    const gmailResponse = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_GOOGLE_ACCESS_TOKEN}`
        }
      }
    );
    
    console.log(`✅ Gmail API Access: ${gmailResponse.ok}`);

    // Test Calendar API
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary',
      {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_GOOGLE_ACCESS_TOKEN}`
        }
      }
    );
    
    console.log(`✅ Calendar API Access: ${calendarResponse.ok}`);

  } catch (error) {
    console.error('❌ API Access Test Failed:', error);
  }
}
```

### **8.2 Integration Testing**
```bash
# Run OAuth integration tests
npm run test:oauth

# Test specific Google services
npm run test:gmail
npm run test:calendar
npm run test:sheets
```

---

## 📊 **Step 9: Monitoring & Analytics**

### **9.1 OAuth Metrics Dashboard**
```typescript
// src/lib/google/oauth-metrics.ts
export class OAuthMetrics {
  async getOAuthStats() {
    const stats = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        action,
        COUNT(*) as count
      FROM oauth_audit_log 
      WHERE timestamp >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(timestamp), action
      ORDER BY date DESC
    `;

    return {
      dailyLogins: stats.filter(s => s.action === 'login'),
      tokenRefreshes: stats.filter(s => s.action === 'token_refresh'),
      scopeGrants: stats.filter(s => s.action === 'scope_granted')
    };
  }

  async getErrorRates() {
    // Track OAuth error rates
    return {
      authErrors: await this.getErrorCount('auth_error'),
      tokenErrors: await this.getErrorCount('token_error'),
      apiErrors: await this.getErrorCount('api_error')
    };
  }
}
```

### **9.2 Alert Configuration**
```typescript
// src/lib/google/oauth-alerts.ts
export class OAuthAlerts {
  async checkOAuthHealth() {
    const errorRate = await this.getOAuthErrorRate();
    
    if (errorRate > 0.1) { // 10% error rate threshold
      await this.sendAlert({
        type: 'oauth_high_error_rate',
        message: `OAuth error rate is ${(errorRate * 100).toFixed(1)}%`,
        severity: 'high'
      });
    }

    const tokenRefreshFailures = await this.getTokenRefreshFailures();
    
    if (tokenRefreshFailures > 50) {
      await this.sendAlert({
        type: 'token_refresh_failures',
        message: `${tokenRefreshFailures} token refresh failures in last hour`,
        severity: 'medium'
      });
    }
  }
}
```

---

## 📋 **Production Deployment Checklist**

### **Google Cloud Console Configuration**
- [ ] ✅ Production project created
- [ ] ✅ Required APIs enabled (Gmail, Calendar, Sheets, Drive)
- [ ] ✅ OAuth consent screen configured
- [ ] ✅ Production domain verified
- [ ] ✅ OAuth 2.0 credentials created
- [ ] ✅ Authorized redirect URIs configured

### **Application Configuration**
- [ ] ✅ Environment variables configured
- [ ] ✅ NextAuth.js production setup
- [ ] ✅ OAuth scopes properly configured
- [ ] ✅ Token refresh mechanism implemented
- [ ] ✅ Security measures in place
- [ ] ✅ Audit logging configured

### **Testing & Validation**
- [ ] ✅ OAuth flow tested end-to-end
- [ ] ✅ Google APIs access validated
- [ ] ✅ Token refresh tested
- [ ] ✅ Security validations passed
- [ ] ✅ Error handling verified

### **Monitoring & Compliance**
- [ ] ✅ OAuth metrics dashboard setup
- [ ] ✅ Error rate monitoring configured
- [ ] ✅ Alert system implemented
- [ ] ✅ Compliance documentation complete

---

## 🚨 **Troubleshooting Common Issues**

### **OAuth Errors**
```
Error: redirect_uri_mismatch
Solution: Verify redirect URIs match exactly in Google Console
```

```
Error: access_denied
Solution: Check OAuth consent screen configuration and approved scopes
```

```
Error: invalid_grant
Solution: Refresh token may be expired, re-authenticate user
```

### **API Access Errors**
```
Error: 403 Forbidden
Solution: Verify API is enabled and proper scopes are granted
```

```
Error: 401 Unauthorized
Solution: Check access token validity and refresh if needed
```

---

## 🎯 **Next Steps**

After Google OAuth setup:
1. ✅ Update deployment plan status
2. 🌐 Configure custom domain and SSL certificates
3. 🚀 Deploy to Vercel with production environment
4. 🧪 Run comprehensive integration tests
5. 📊 Monitor OAuth metrics and user adoption

---

**Google OAuth Production Setup Complete!** 🔐
**Your VIEAgent platform now has secure Google Workspace integration.** 