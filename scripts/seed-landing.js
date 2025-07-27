const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLandingPagesData() {
  console.log('🌱 Seeding landing pages data...');

  try {
    // Create sample featured blog posts
    console.log('Creating featured blog posts...');
    const blogPosts = await prisma.featuredContent.createMany({
      data: [
        {
          title: "AI Agents và Tương lai của Automation",
          excerpt: "Khám phá cách AI Agents đang thay đổi cách chúng ta làm việc và tự động hóa các quy trình kinh doanh phức tạp.",
          content: "Full content of the blog post about AI Agents...",
          type: "blog_post",
          category: "AI Trends",
          isActive: true,
          isFeatured: true,
          position: 1,
          tags: JSON.stringify(["AI", "Automation", "Business"]),
          author: "CEO AI Platform",
          authorImage: "/api/placeholder/100/100",
          url: "/blog/ai-agents-va-tuong-lai-cua-automation",
          image: "/api/placeholder/600/400",
          thumbnail: "/api/placeholder/300/200",
          viewCount: 1250,
          clickCount: 89,
          publishedAt: new Date("2024-06-20")
        },
        {
          title: "GPT-4 vs Claude: So sánh performance 2024",
          excerpt: "Phân tích chi tiết về hiệu suất và khả năng của hai mô hình AI hàng đầu trong các tác vụ thực tế.",
          content: "Detailed comparison between GPT-4 and Claude...",
          type: "blog_post",
          category: "Technology",
          isActive: true,
          isFeatured: true,
          position: 2,
          tags: JSON.stringify(["GPT-4", "Claude", "AI Models"]),
          author: "CTO AI Platform",
          authorImage: "/api/placeholder/100/100",
          url: "/blog/gpt4-vs-claude-so-sanh-performance",
          image: "/api/placeholder/600/400",
          thumbnail: "/api/placeholder/300/200",
          viewCount: 890,
          clickCount: 67,
          publishedAt: new Date("2024-06-15")
        },
        {
          title: "Case Study: Startup tăng revenue 300% với AI",
          excerpt: "Câu chuyện thành công của startup công nghệ sử dụng AI Agents để tối ưu hóa quy trình bán hàng.",
          content: "Success story case study content...",
          type: "blog_post",
          category: "Case Study",
          isActive: true,
          isFeatured: true,
          position: 3,
          tags: JSON.stringify(["Success Story", "Revenue Growth", "Startup"]),
          author: "Growth Hacker",
          authorImage: "/api/placeholder/100/100",
          url: "/blog/case-study-startup-tang-revenue-300-voi-ai",
          image: "/api/placeholder/600/400",
          thumbnail: "/api/placeholder/300/200",
          viewCount: 2100,
          clickCount: 156,
          publishedAt: new Date("2024-06-10")
        }
      ],
      skipDuplicates: true
    });

    // Create sample testimonials
    console.log('Creating testimonials...');
    const testimonials = await prisma.featuredContent.createMany({
      data: [
        {
          title: "Tăng hiệu suất 5x nhờ AI Agent",
          excerpt: "AI Platform đã giúp chúng tôi tự động hóa 80% quy trình customer support và tăng satisfaction rate lên 95%.",
          type: "testimonial",
          category: "Customer Success",
          isActive: true,
          isFeatured: true,
          position: 1,
          author: "Nguyễn Văn A",
          authorImage: "/api/placeholder/100/100",
          tags: JSON.stringify(["5", "TechCorp Vietnam"]), // rating, company
          viewCount: 340,
          clickCount: 23
        },
        {
          title: "ROI 400% chỉ sau 3 tháng",
          excerpt: "Đầu tư vào AI Platform là quyết định đúng đắn nhất của công ty. Chi phí vận hành giảm 60%, doanh thu tăng 300%.",
          type: "testimonial",
          category: "Customer Success",
          isActive: true,
          isFeatured: true,
          position: 2,
          author: "Trần Thị B",
          authorImage: "/api/placeholder/100/100",
          tags: JSON.stringify(["5", "E-commerce Plus"]), // rating, company
          viewCount: 280,
          clickCount: 19
        }
      ],
      skipDuplicates: true
    });

    // Create sample newsletter subscriptions
    console.log('Creating newsletter subscriptions...');
    const newsletters = await prisma.newsletter.createMany({
      data: [
        {
          email: "john.doe@example.com",
          name: "John Doe",
          source: "landing",
          isActive: true,
          interests: JSON.stringify(["AI Trends", "Case Studies"]),
          confirmedAt: new Date(),
          openCount: 5,
          clickCount: 2,
          lastOpened: new Date()
        },
        {
          email: "jane.smith@techcorp.com",
          name: "Jane Smith",
          company: "TechCorp",
          source: "blog",
          isActive: true,
          interests: JSON.stringify(["Technical Tips", "Product Updates"]),
          confirmedAt: new Date(),
          openCount: 8,
          clickCount: 4,
          lastOpened: new Date()
        }
      ],
      skipDuplicates: true
    });

    // Create sample contact submissions
    console.log('Creating contact submissions...');
    const contacts = await prisma.contactSubmission.createMany({
      data: [
        {
          name: "Alice Johnson",
          email: "alice@bigcorp.com",
          company: "BigCorp Ltd",
          subject: "Enterprise AI Solution Inquiry",
          message: "We are interested in implementing AI agents for our customer service department. Could you provide more information about enterprise features and pricing?",
          inquiryType: "enterprise",
          phone: "+1-555-0123",
          website: "https://bigcorp.com",
          status: "NEW",
          priority: "HIGH",
          source: "contact_form"
        },
        {
          name: "Bob Wilson",
          email: "bob.wilson@startup.co",
          company: "Startup Co",
          subject: "Integration with CRM",
          message: "How can we integrate AI Platform with our existing CRM system? We use Salesforce.",
          inquiryType: "support",
          phone: "+1-555-0456",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          source: "contact_form"
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Landing pages data seeded successfully!');
    console.log('📊 Created:');
    console.log(`   - ${blogPosts.count} featured blog posts`);
    console.log(`   - ${testimonials.count} customer testimonials`);
    console.log(`   - ${newsletters.count} newsletter subscriptions`);
    console.log(`   - ${contacts.count} contact form submissions`);

  } catch (error) {
    console.error('❌ Error seeding landing pages data:', error);
    // If models don't exist yet, just log and continue
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('⚠️  Some database models not found - will implement when schema is updated');
    } else {
      throw error;
    }
  }
}

async function main() {
  try {
    await seedLandingPagesData();
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 