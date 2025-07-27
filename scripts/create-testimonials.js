const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestimonials() {
  try {
    console.log('Creating testimonials...');
    
    const testimonials = [
      {
        title: 'Customer Success Story 1',
        excerpt: 'AI Platform đã giúp chúng tôi tăng hiệu suất customer service lên 250%. Khách hàng rất hài lòng với thời gian phản hồi nhanh chóng.',
        content: 'Tech Startup',
        type: 'testimonial',
        author: 'Nguyễn Văn A',
        isActive: true,
        isFeatured: true,
        position: 1
      },
      {
        title: 'Customer Success Story 2', 
        excerpt: 'Triển khai AI chatbot trong 1 ngày, giảm 70% workload cho team support. ROI rõ ràng ngay tháng đầu tiên.',
        content: 'E-commerce Corp',
        type: 'testimonial',
        author: 'Trần Thị B',
        isActive: true,
        isFeatured: true,
        position: 2
      },
      {
        title: 'Customer Success Story 3',
        excerpt: 'Tính năng tự động hóa quy trình đã giúp chúng tôi tiết kiệm hàng trăm giờ làm việc mỗi tháng. Tuyệt vời!',
        content: 'Manufacturing Ltd',
        type: 'testimonial',
        author: 'Lê Minh C',
        isActive: true,
        isFeatured: true,
        position: 3
      }
    ];

    for (const testimonial of testimonials) {
      await prisma.featuredContent.create({
        data: testimonial
      });
    }

    console.log('✅ Created testimonials successfully!');
    
  } catch (error) {
    console.error('❌ Error creating testimonials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestimonials(); 