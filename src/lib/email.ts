import nodemailer from 'nodemailer';
import { ReactElement } from 'react';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Send email function
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || 'VIEAgent <noreply@vieagent.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await transporter.sendMail(mailOptions);
            // Email sent successfully
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  // Welcome email
  welcome: (name: string, activationLink: string): EmailTemplate => ({
    subject: 'Chào mừng bạn đến với VIEAgent!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Chào mừng đến với VIEAgent!</h1>
        <p>Xin chào ${name},</p>
        <p>Cảm ơn bạn đã đăng ký VIEAgent - nền tảng AI Agent hàng đầu Việt Nam.</p>
        <p>Để kích hoạt tài khoản của bạn, vui lòng click vào link bên dưới:</p>
        <a href="${activationLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Kích hoạt tài khoản
        </a>
        <p>Nếu bạn không thể click vào nút trên, copy và paste link sau vào trình duyệt:</p>
        <p style="word-break: break-all; color: #6b7280;">${activationLink}</p>
        <p>Trân trọng,<br>Đội ngũ VIEAgent</p>
      </div>
    `,
    text: `Chào mừng đến với VIEAgent! Kích hoạt tài khoản tại: ${activationLink}`,
  }),

  // Password reset email
  passwordReset: (name: string, resetLink: string): EmailTemplate => ({
    subject: 'Đặt lại mật khẩu VIEAgent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Đặt lại mật khẩu</h1>
        <p>Xin chào ${name},</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản VIEAgent của bạn.</p>
        <p>Click vào link bên dưới để đặt lại mật khẩu:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Đặt lại mật khẩu
        </a>
        <p>Link này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ VIEAgent</p>
      </div>
    `,
    text: `Đặt lại mật khẩu VIEAgent tại: ${resetLink}`,
  }),

  // Payment success email
  paymentSuccess: (name: string, planName: string, amount: number): EmailTemplate => ({
    subject: 'Thanh toán thành công - VIEAgent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Thanh toán thành công!</h1>
        <p>Xin chào ${name},</p>
        <p>Cảm ơn bạn đã thanh toán cho gói <strong>${planName}</strong>.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">Chi tiết thanh toán:</h3>
          <p><strong>Gói dịch vụ:</strong> ${planName}</p>
          <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
          <p><strong>Ngày thanh toán:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <p>Tài khoản của bạn đã được nâng cấp và bạn có thể sử dụng đầy đủ tính năng ngay bây giờ.</p>
        <a href="${process.env.APP_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Truy cập Dashboard
        </a>
        <p>Trân trọng,<br>Đội ngũ VIEAgent</p>
      </div>
    `,
  }),

  // Payment failed email
  paymentFailed: (name: string, planName: string, amount: number): EmailTemplate => ({
    subject: 'Thanh toán thất bại - VIEAgent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Thanh toán thất bại</h1>
        <p>Xin chào ${name},</p>
        <p>Rất tiếc, thanh toán cho gói <strong>${planName}</strong> đã thất bại.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Chi tiết:</h3>
          <p><strong>Gói dịch vụ:</strong> ${planName}</p>
          <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
          <p><strong>Ngày thử thanh toán:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <p>Vui lòng kiểm tra thông tin thẻ của bạn và thử lại.</p>
        <a href="${process.env.APP_URL}/pricing" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Thử lại thanh toán
        </a>
        <p>Trân trọng,<br>Đội ngũ VIEAgent</p>
      </div>
    `,
  }),

  // Agent usage alert
  usageAlert: (name: string, usagePercent: number, planName: string): EmailTemplate => ({
    subject: 'Cảnh báo sử dụng - VIEAgent',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Cảnh báo sử dụng</h1>
        <p>Xin chào ${name},</p>
        <p>Tài khoản của bạn đã sử dụng <strong>${usagePercent}%</strong> giới hạn của gói <strong>${planName}</strong>.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #f59e0b; margin-top: 0;">Thông tin sử dụng:</h3>
          <p><strong>Gói hiện tại:</strong> ${planName}</p>
          <p><strong>Mức sử dụng:</strong> ${usagePercent}%</p>
          <p><strong>Ngày kiểm tra:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <p>Để tránh gián đoạn dịch vụ, bạn có thể nâng cấp gói hoặc mua thêm quota.</p>
        <a href="${process.env.APP_URL}/pricing" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Nâng cấp gói
        </a>
        <p>Trân trọng,<br>Đội ngũ VIEAgent</p>
      </div>
    `,
  }),

  // System error notification
  systemError: (errorDetails: string, timestamp: string): EmailTemplate => ({
    subject: '[VIEAgent] Cảnh báo lỗi hệ thống',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Cảnh báo lỗi hệ thống</h1>
        <p>Hệ thống VIEAgent đã gặp lỗi:</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Chi tiết lỗi:</h3>
          <pre style="background-color: #f9fafb; padding: 15px; border-radius: 4px; overflow-x: auto;">${errorDetails}</pre>
          <p><strong>Thời gian:</strong> ${timestamp}</p>
        </div>
        <p>Vui lòng kiểm tra và xử lý sớm nhất có thể.</p>
      </div>
    `,
  }),
};

// High-level email functions
export async function sendWelcomeEmail(to: string, name: string, activationLink: string): Promise<boolean> {
  const template = emailTemplates.welcome(name, activationLink);
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<boolean> {
  const template = emailTemplates.passwordReset(name, resetLink);
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPaymentSuccessEmail(to: string, name: string, planName: string, amount: number): Promise<boolean> {
  const template = emailTemplates.paymentSuccess(name, planName, amount);
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendPaymentFailedEmail(to: string, name: string, planName: string, amount: number): Promise<boolean> {
  const template = emailTemplates.paymentFailed(name, planName, amount);
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendUsageAlertEmail(to: string, name: string, usagePercent: number, planName: string): Promise<boolean> {
  const template = emailTemplates.usageAlert(name, usagePercent, planName);
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendSystemErrorEmail(to: string, errorDetails: string): Promise<boolean> {
  const template = emailTemplates.systemError(errorDetails, new Date().toISOString());
  return await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
            // Email configuration verified successfully
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
} 