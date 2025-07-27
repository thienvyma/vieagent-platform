import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, commonErrors } from '@/lib/api-response-standard';

// Regex pattern for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, source = 'landing', interests, company } = body;

    // Validation
    if (!email || !emailRegex.test(email)) {
      return errorResponse('Email không hợp lệ', 400);
    }

    // Get client info for analytics
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // TODO: Implement when Newsletter model is available
    // Check if email already exists
    /*
    const existingSubscription = await prisma.newsletter.findUnique({
      where: { email }
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return successResponse(
          { email, status: 'already_subscribed' },
          'Email này đã được đăng ký newsletter'
        );
      } else {
        // Reactivate subscription
        await prisma.newsletter.update({
          where: { email },
          data: {
            isActive: true,
            name: name || existingSubscription.name,
            company: company || existingSubscription.company,
            interests: interests ? JSON.stringify(interests) : existingSubscription.interests,
            source,
            unsubscribedAt: null,
            updatedAt: new Date()
          }
        });

        return successResponse(
          { 
            email, 
            status: 'reactivated',
            previousSubscription: true 
          },
          'Đã kích hoạt lại đăng ký newsletter thành công!'
        );
      }
    }

    // Create new subscription
    const newSubscription = await prisma.newsletter.create({
      data: {
        email,
        name: name || '',
        company: company || '',
        interests: interests ? JSON.stringify(interests) : null,
        source,
        isActive: true,
        subscribedAt: new Date(),
        metadata: JSON.stringify({
          userAgent,
          referer,
          ip: request.ip || 'unknown',
          subscriptionSource: source
        })
      }
    });

    return successResponse(
      {
        id: newSubscription.id,
        email: newSubscription.email,
        status: 'subscribed',
        subscribedAt: newSubscription.subscribedAt
      },
      'Đăng ký newsletter thành công!'
    );
    */

    // Temporary mock response until Newsletter model is implemented

    return successResponse(
      {
        email,
        status: 'subscribed',
        source,
        subscribedAt: new Date().toISOString(),
      },
      'Đăng ký newsletter thành công! (Chế độ demo)'
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return errorResponse('Lỗi server khi đăng ký newsletter', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get real newsletter data from database
    try {
      const newsletters = await prisma.newsletter.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          company: true,
          source: true,
          createdAt: true
        }
      });

      return successResponse(
        newsletters,
        `Tìm thấy ${newsletters.length} đăng ký newsletter đang hoạt động`
      );
    } catch (dbError) {
      // Database error - return empty array instead of mock data
      console.warn('Newsletter database query failed:', dbError);
      return successResponse([], 'Không thể tải danh sách newsletter');
    }
  } catch (error) {
    console.error('Newsletter fetch error:', error);
    return errorResponse('Lỗi server khi tải danh sách newsletter', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return errorResponse('Email là bắt buộc', 400);
    }

    // TODO: Implement when Newsletter model is available
    /*
    const subscription = await prisma.newsletter.findUnique({
      where: { email }
    });

    if (!subscription) {
      return errorResponse('Không tìm thấy đăng ký newsletter với email này', 404);
    }

    if (!subscription.isActive) {
      return successResponse(
        { email, status: 'already_unsubscribed' },
        'Email này đã được hủy đăng ký trước đó'
      );
    }

    await prisma.newsletter.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    });

    return successResponse(
      {
        email,
        status: 'unsubscribed',
        unsubscribedAt: new Date().toISOString()
      },
      'Đã hủy đăng ký newsletter thành công'
    );
    */

    // Temporary mock response

    return successResponse(
      {
        email,
        status: 'unsubscribed',
        unsubscribedAt: new Date().toISOString(),
      },
      'Đã hủy đăng ký newsletter thành công (chế độ demo)'
    );
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return errorResponse('Lỗi khi hủy đăng ký newsletter', 500);
  }
}
