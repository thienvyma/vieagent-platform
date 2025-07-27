import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Regex pattern for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      company,
      subject,
      message,
      inquiryType = 'general',
      phone,
      website,
    } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    // Get client info for analytics
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // TODO: Implement when ContactSubmission model is available
    /*
    // Create contact submission
    const contactSubmission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        company,
        subject,
        message,
        inquiryType,
        phone,
        website,
        source: 'contact_form',
        userAgent,
        ipAddress,
        referer,
        status: 'NEW',
        priority: inquiryType === 'enterprise' ? 'HIGH' : 'MEDIUM'
      }
    });

    // Update landing page stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.landingPageStats.upsert({
      where: { date: today },
      create: {
        date: today,
        contactSubmissions: 1,
        contactViews: 1
      },
      update: {
        contactSubmissions: { increment: 1 }
      }
    });

    // Send notification email to admin (optional)
    // TODO: Implement email notification service
    */

    // Temporary logging until database is synced
    console.log('Contact form submission:', {
      name,
      email,
      company,
      subject,
      message,
      inquiryType,
      phone,
      website,
      userAgent,
      ipAddress,
      referer,
    });

    return NextResponse.json({
      message: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong vòng 24 giờ.',
      submissionId: `temp_${Date.now()}`,
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json({ error: 'Lỗi server. Vui lòng thử lại sau.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const inquiryType = searchParams.get('inquiryType');

    // TODO: Implement when ContactSubmission model is available
    /*
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (inquiryType) where.inquiryType = inquiryType;

    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        include: {
          assignee: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.contactSubmission.count({ where })
    ]);
    */

    return NextResponse.json({
      submissions: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('Contact submissions fetch error:', error);
    return NextResponse.json({ error: 'Lỗi server khi tải danh sách liên hệ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, response, assignedTo, priority, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID submission là bắt buộc' }, { status: 400 });
    }

    // TODO: Implement when ContactSubmission model is available
    /*
    const updateData: any = {};
    if (status) updateData.status = status;
    if (response) {
      updateData.response = response;
      updateData.respondedAt = new Date();
      updateData.respondedBy = assignedTo; // Should be from session
    }
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (priority) updateData.priority = priority;
    if (notes) updateData.notes = notes;

    const updatedSubmission = await prisma.contactSubmission.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    */

    console.log('Contact submission update:', {
      id,
      status,
      response,
      assignedTo,
      priority,
      notes,
    });

    return NextResponse.json({
      message: 'Đã cập nhật thông tin liên hệ thành công',
      submission: { id },
    });
  } catch (error) {
    console.error('Contact submission update error:', error);
    return NextResponse.json({ error: 'Lỗi khi cập nhật thông tin liên hệ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID submission là bắt buộc' }, { status: 400 });
    }

    // TODO: Implement when ContactSubmission model is available
    /*
    await prisma.contactSubmission.delete({
      where: { id }
    });
    */

    console.log('Contact submission delete:', id);

    return NextResponse.json({
      message: 'Đã xóa thông tin liên hệ thành công',
    });
  } catch (error) {
    console.error('Contact submission delete error:', error);
    return NextResponse.json({ error: 'Lỗi khi xóa thông tin liên hệ' }, { status: 500 });
  }
}
