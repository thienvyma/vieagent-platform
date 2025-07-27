import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// GET /api/admin/settings - Get system settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_system_settings')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create default settings
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          siteName: 'AI Agent Platform',
          siteDescription: 'Advanced AI Agent Management Platform',
          maintenanceMode: false,
          registrationEnabled: true,
          emailNotificationsEnabled: true,
          maxApiCallsPerUser: 10000,
          smtpPort: 587,
          smtpFromName: 'AI Agent Platform',
        },
      });
    }

    // Hide sensitive data in response
    const safeSettings = {
      ...settings,
      smtpPassword: settings.smtpPassword ? '••••••••' : '',
      stripeSecretKey: settings.stripeSecretKey ? '••••••••' : '',
      stripeWebhookSecret: settings.stripeWebhookSecret ? '••••••••' : '',
      paypalClientSecret: settings.paypalClientSecret ? '••••••••' : '',
      openaiApiKey: settings.openaiApiKey ? '••••••••' : '',
      anthropicApiKey: settings.anthropicApiKey ? '••••••••' : '',
    };

    return NextResponse.json({
      success: true,
      data: safeSettings,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/settings - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session.user.role, 'manage_system_settings')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpFromEmail,
      smtpFromName,
      stripePublicKey,
      stripeSecretKey,
      stripeWebhookSecret,
      paypalClientId,
      paypalClientSecret,
      openaiApiKey,
      anthropicApiKey,
      maxApiCallsPerUser,
      siteName,
      siteDescription,
      logoUrl,
      maintenanceMode,
      registrationEnabled,
      emailNotificationsEnabled,
      slackWebhookUrl,
      discordWebhookUrl,
    } = body;

    // Prepare update data (only include fields that aren't masked)
    const updateData: any = {};

    if (smtpHost !== undefined) updateData.smtpHost = smtpHost;
    if (smtpPort !== undefined) updateData.smtpPort = parseInt(smtpPort);
    if (smtpUser !== undefined) updateData.smtpUser = smtpUser;
    if (smtpPassword && smtpPassword !== '••••••••') updateData.smtpPassword = smtpPassword;
    if (smtpFromEmail !== undefined) updateData.smtpFromEmail = smtpFromEmail;
    if (smtpFromName !== undefined) updateData.smtpFromName = smtpFromName;

    if (stripePublicKey !== undefined) updateData.stripePublicKey = stripePublicKey;
    if (stripeSecretKey && stripeSecretKey !== '••••••••')
      updateData.stripeSecretKey = stripeSecretKey;
    if (stripeWebhookSecret && stripeWebhookSecret !== '••••••••')
      updateData.stripeWebhookSecret = stripeWebhookSecret;
    if (paypalClientId !== undefined) updateData.paypalClientId = paypalClientId;
    if (paypalClientSecret && paypalClientSecret !== '••••••••')
      updateData.paypalClientSecret = paypalClientSecret;

    if (openaiApiKey && openaiApiKey !== '••••••••') updateData.openaiApiKey = openaiApiKey;
    if (anthropicApiKey && anthropicApiKey !== '••••••••')
      updateData.anthropicApiKey = anthropicApiKey;
    if (maxApiCallsPerUser !== undefined)
      updateData.maxApiCallsPerUser = parseInt(maxApiCallsPerUser);

    if (siteName !== undefined) updateData.siteName = siteName;
    if (siteDescription !== undefined) updateData.siteDescription = siteDescription;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    if (registrationEnabled !== undefined) updateData.registrationEnabled = registrationEnabled;

    if (emailNotificationsEnabled !== undefined)
      updateData.emailNotificationsEnabled = emailNotificationsEnabled;
    if (slackWebhookUrl !== undefined) updateData.slackWebhookUrl = slackWebhookUrl;
    if (discordWebhookUrl !== undefined) updateData.discordWebhookUrl = discordWebhookUrl;

    // Update settings
    const settings = await prisma.systemSettings.upsert({
      where: { id: (await prisma.systemSettings.findFirst())?.id || 'new' },
      create: updateData,
      update: updateData,
    });

    // Update environment variables if needed
    if (updateData.stripePublicKey) {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = updateData.stripePublicKey;
    }
    if (updateData.stripeSecretKey) {
      process.env.STRIPE_SECRET_KEY = updateData.stripeSecretKey;
    }
    if (updateData.stripeWebhookSecret) {
      process.env.STRIPE_WEBHOOK_SECRET = updateData.stripeWebhookSecret;
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
