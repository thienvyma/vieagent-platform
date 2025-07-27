# 📧 Resend Email Service Setup Guide

## 📋 **Overview**

This guide walks you through setting up Resend as your production email service for VIEAgent. Resend is a modern email API that's perfect for developers and works seamlessly with Vercel.

**Why Resend:**
- ✅ Modern API designed for developers
- ✅ Excellent deliverability rates
- ✅ Free tier: 3,000 emails/month
- ✅ Built-in email templates
- ✅ Real-time analytics
- ✅ Custom domain support

---

## 🚀 **Step 1: Create Resend Account**

### **1.1 Sign up for Resend**
1. Go to [resend.com](https://resend.com)
2. Sign up with email or GitHub
3. Verify your email address
4. Complete account setup

### **1.2 Get API Key**
1. Go to **API Keys** in dashboard
2. Click **Create API Key**
3. Name: `vieagent-production`
4. Permissions: **Sending access**
5. Copy the API key (starts with `re_`)

---

## 🔧 **Step 2: Configure Custom Domain (Recommended)**

### **2.1 Add Domain**
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `yourdomain.com`
4. Choose region closest to your users

### **2.2 DNS Configuration**
Add these DNS records to your domain:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

# DKIM Record
Type: TXT
Name: resend._domainkey
Value: [PROVIDED_BY_RESEND]

# DMARC Record (Optional but recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### **2.3 Verify Domain**
1. Wait for DNS propagation (5-30 minutes)
2. Click **Verify** in Resend dashboard
3. Status should change to **Verified**

---

## ⚙️ **Step 3: Update VIEAgent Configuration**

### **3.1 Environment Variables**
Add to your `.env.production`:

```bash
# Resend Email Configuration
RESEND_API_KEY="re_[YOUR_RESEND_API_KEY]"
SMTP_FROM="VIEAgent <noreply@yourdomain.com>"

# Email settings
EMAIL_FROM_NAME="VIEAgent"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
EMAIL_REPLY_TO="support@yourdomain.com"

# Email templates (if using custom)
EMAIL_TEMPLATE_WELCOME="welcome"
EMAIL_TEMPLATE_RESET="password-reset"
EMAIL_TEMPLATE_VERIFY="email-verification"
```

### **3.2 Create Email Service Module**
Create `src/lib/email-service.ts`:

```typescript
import { Resend } from 'resend';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  from?: string;
  replyTo?: string;
}

interface EmailTemplate {
  welcome: (data: { name: string; loginUrl: string }) => { subject: string; html: string };
  passwordReset: (data: { name: string; resetUrl: string; expiresIn: string }) => { subject: string; html: string };
  emailVerification: (data: { name: string; verifyUrl: string }) => { subject: string; html: string };
}

class EmailService {
  private resend: Resend;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@localhost';
    this.fromName = process.env.EMAIL_FROM_NAME || 'VIEAgent';
  }

  private getFromString(customFrom?: string): string {
    if (customFrom) return customFrom;
    return `${this.fromName} <${this.fromAddress}>`;
  }

  private templates: EmailTemplate = {
    welcome: (data) => ({
      subject: '🎉 Chào mừng bạn đến với VIEAgent!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Chào mừng ${data.name}!</h1>
          <p>Cảm ơn bạn đã đăng ký VIEAgent. Bạn đã sẵn sàng để tạo ra những AI agents thông minh!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" 
               style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Bắt đầu ngay
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Nếu bạn có câu hỏi, hãy liên hệ với chúng tôi tại support@yourdomain.com
          </p>
        </div>
      `
    }),

    passwordReset: (data) => ({
      subject: '🔐 Đặt lại mật khẩu VIEAgent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Đặt lại mật khẩu</h1>
          <p>Xin chào ${data.name},</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản VIEAgent của bạn.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Link này sẽ hết hạn sau ${data.expiresIn}. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
          </p>
        </div>
      `
    }),

    emailVerification: (data) => ({
      subject: '✅ Xác thực email VIEAgent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #059669;">Xác thực email</h1>
          <p>Xin chào ${data.name},</p>
          <p>Vui lòng xác thực địa chỉ email của bạn để hoàn tất đăng ký VIEAgent.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verifyUrl}" 
               style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Xác thực email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Nếu bạn không tạo tài khoản này, hãy bỏ qua email này.
          </p>
        </div>
      `
    })
  };

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const emailData: any = {
        from: this.getFromString(options.from),
        to: options.to,
        subject: options.subject,
        replyTo: options.replyTo || process.env.EMAIL_REPLY_TO,
      };

      if (options.template && options.templateData) {
        const template = this.templates[options.template as keyof EmailTemplate];
        if (template) {
          const { subject, html } = template(options.templateData);
          emailData.subject = subject;
          emailData.html = html;
        } else {
          throw new Error(`Template '${options.template}' not found`);
        }
      } else {
        emailData.html = options.html;
        emailData.text = options.text;
      }

      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Convenience methods
  async sendWelcomeEmail(to: string, name: string, loginUrl: string) {
    return this.sendEmail({
      to,
      subject: '', // Will be overridden by template
      template: 'welcome',
      templateData: { name, loginUrl }
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string, expiresIn: string = '1 giờ') {
    return this.sendEmail({
      to,
      subject: '', // Will be overridden by template
      template: 'passwordReset',
      templateData: { name, resetUrl, expiresIn }
    });
  }

  async sendVerificationEmail(to: string, name: string, verifyUrl: string) {
    return this.sendEmail({
      to,
      subject: '', // Will be overridden by template
      template: 'emailVerification',
      templateData: { name, verifyUrl }
    });
  }
}

export const emailService = new EmailService();
export default emailService;
```

---

## 🔌 **Step 4: Integrate with Authentication**

### **4.1 Update Registration Flow**
Modify your registration API to send welcome emails:

```typescript
// src/app/api/auth/register/route.ts
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    // ... existing registration logic ...

    // Send welcome email
    const loginUrl = `${process.env.NEXTAUTH_URL}/login`;
    await emailService.sendWelcomeEmail(
      newUser.email,
      newUser.name || 'User',
      loginUrl
    );

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Check your email for welcome message.'
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

### **4.2 Update Password Reset Flow**
```typescript
// src/app/api/auth/reset-password/route.ts
import emailService from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // ... find user and generate reset token ...
    
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    await emailService.sendPasswordResetEmail(
      user.email,
      user.name || 'User',
      resetUrl,
      '1 giờ'
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent!'
    });
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## ✅ **Step 5: Test Email Service**

### **5.1 Create Test Script**
Create `scripts/test-email.js`:

```javascript
// Test email functionality
const { emailService } = require('../src/lib/email-service');

async function testEmails() {
  console.log('🧪 Testing email service...');

  try {
    // Test basic email
    const basicResult = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email from VIEAgent',
      html: '<h1>Test Email</h1><p>If you receive this, email service is working!</p>'
    });

    console.log('📧 Basic email result:', basicResult);

    // Test welcome email template
    const welcomeResult = await emailService.sendWelcomeEmail(
      'test@example.com',
      'Test User',
      'https://yourdomain.com/login'
    );

    console.log('🎉 Welcome email result:', welcomeResult);

    // Test password reset email
    const resetResult = await emailService.sendPasswordResetEmail(
      'test@example.com',
      'Test User',
      'https://yourdomain.com/reset?token=test123'
    );

    console.log('🔐 Reset email result:', resetResult);

  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmails();
```

### **5.2 Run Test**
```bash
# Set environment variables first
export RESEND_API_KEY="re_your_api_key"
export EMAIL_FROM_ADDRESS="noreply@yourdomain.com"

# Run test
node scripts/test-email.js
```

---

## 📊 **Step 6: Email Analytics & Monitoring**

### **6.1 Resend Dashboard**
Monitor email performance in Resend dashboard:
- **Sent**: Total emails sent
- **Delivered**: Successfully delivered
- **Bounced**: Failed to deliver
- **Complained**: Marked as spam
- **Opened**: Email open rates
- **Clicked**: Link click rates

### **6.2 Add Email Logging**
Create `src/lib/email-logger.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailLog {
  to: string;
  subject: string;
  template?: string;
  status: 'sent' | 'failed';
  resendId?: string;
  error?: string;
  userId?: string;
}

export async function logEmail(log: EmailLog) {
  try {
    await prisma.emailLog.create({
      data: {
        to: log.to,
        subject: log.subject,
        template: log.template,
        status: log.status,
        resendId: log.resendId,
        error: log.error,
        userId: log.userId,
        sentAt: new Date(),
      }
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}
```

---

## 💰 **Cost Management**

### **Resend Pricing:**
- **Free Tier**: 3,000 emails/month
- **Pro Plan**: $20/month for 50,000 emails
- **Business Plan**: $80/month for 100,000 emails

### **Cost Optimization Tips:**
1. **Use templates**: More efficient than custom HTML
2. **Segment users**: Only send relevant emails
3. **Monitor bounces**: Clean up invalid emails
4. **Track engagement**: Remove inactive users
5. **Batch sends**: Group similar emails

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**Email Not Sending:**
```bash
# Check API key
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "test@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

**Domain Not Verified:**
```bash
# Check DNS records
dig TXT yourdomain.com
dig TXT resend._domainkey.yourdomain.com
```

**High Bounce Rate:**
- Verify email addresses before sending
- Use double opt-in for subscriptions
- Remove bounced emails from list

---

## 📋 **Email Service Checklist**

- [ ] ✅ Resend account created
- [ ] ✅ API key obtained
- [ ] ✅ Custom domain configured (optional)
- [ ] ✅ DNS records added
- [ ] ✅ Domain verified
- [ ] ✅ Environment variables configured
- [ ] ✅ Email service module created
- [ ] ✅ Templates implemented
- [ ] ✅ Authentication integration complete
- [ ] ✅ Test emails sent successfully
- [ ] ✅ Email logging implemented
- [ ] ✅ Monitoring dashboard configured

---

## 🎯 **Next Steps**

After email service setup:
1. ✅ Update deployment plan status
2. 🔑 Verify AI API keys configuration
3. 🛡️ Enable TypeScript strict mode
4. 🚀 Deploy to Vercel
5. 🧪 Run full integration tests

---

**Email Service Setup Complete!** 📧
**Your VIEAgent platform can now send beautiful, professional emails.** 