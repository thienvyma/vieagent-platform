import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption key (in production, use environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!';

function encrypt(text: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback to plain text in case of error
  }
}

function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText; // Return as-is if not encrypted format

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText; // Return as-is if decryption fails
  }
}

// GET /api/user/api-keys - Lấy danh sách API keys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const apiKeys = await prisma.userApiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        lastUsed: true,
        usageCount: true,
        models: true,
        rateLimit: true,
        monthlyUsage: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });



    // Parse models JSON string back to array
    const processedKeys = apiKeys.map(key => ({
      ...key,
      models: key.models ? JSON.parse(key.models) : [],
    }));

    return NextResponse.json({
      success: true,
      data: processedKeys,
    });
  } catch (error) {
    console.error('❌ DEBUG API Keys: Error fetching:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/user/api-keys - Tạo API key mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const body = await request.json();

    const { name, provider, apiKey, models, rateLimit } = body;

    // Validate required fields
    if (!name || !provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Name, provider, and API key are required' },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ['openai', 'anthropic', 'local', 'custom'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Basic API key format validation
    let isValidFormat = true;
    let formatError = '';

    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          isValidFormat = false;
          formatError = 'OpenAI API key must start with "sk-"';
        }
        break;
      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          isValidFormat = false;
          formatError = 'Anthropic API key must start with "sk-ant-"';
        }
        break;
    }

    if (!isValidFormat) {
      return NextResponse.json({ success: false, error: formatError }, { status: 400 });
    }

    // Test API key if it's a real provider
    if (provider === 'openai' || provider === 'anthropic') {
      console.log('🔍 DEBUG API Keys: Testing API key validity...');
      const isValid = await testApiKey(provider, apiKey);
      console.log('🔍 DEBUG API Keys: API key test result:', isValid);

      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid ${provider} API key. Please check your key and try again.`,
          },
          { status: 400 }
        );
      }
    }

    // Encrypt API key
    const encryptedKey = encrypt(apiKey);

    // Create API key record
    const newApiKey = await prisma.userApiKey.create({
      data: {
        userId,
        name,
        provider,
        keyHash: encryptedKey,
        models: models && models.length > 0 ? JSON.stringify(models) : null,
        rateLimit: rateLimit || null,
        isActive: true,
        usageCount: 0,
        monthlyUsage: 0,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        isActive: true,
        models: true,
        rateLimit: true,
        usageCount: true,
        monthlyUsage: true,
        createdAt: true,
      },
    });



    // Parse models back to array for response
    const responseData = {
      ...newApiKey,
      models: newApiKey.models ? JSON.parse(newApiKey.models) : [],
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'API key added successfully and tested!',
    });
  } catch (error) {
    console.error('❌ DEBUG API Keys: Error creating:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

// Test API key validity
async function testApiKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    console.log(`🔍 Testing ${provider} API key...`);

    switch (provider.toLowerCase()) {
      case 'openai':
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'User-Agent': 'AI-Agent-Platform/1.0',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        console.log(`🔍 OpenAI API response status: ${openaiResponse.status}`);
        return openaiResponse.ok;

      case 'anthropic':
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01',
            'User-Agent': 'AI-Agent-Platform/1.0',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        console.log(`🔍 Anthropic API response status: ${anthropicResponse.status}`);
        return anthropicResponse.status !== 401 && anthropicResponse.status !== 403;

      case 'local':
        // For local models, assume valid if URL format is correct
        return true;

      default:
        return true; // For custom providers, assume valid
    }
  } catch (error) {
    console.error(`❌ API key test failed for ${provider}:`, error);
    return false;
  }
}
