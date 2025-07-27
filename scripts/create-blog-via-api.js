const fetch = require('node-fetch');

async function createBlogPosts() {
  try {
    console.log('🔄 Tạo blog posts qua admin API...');

    const blogPosts = [
      {
        title: 'Cách AI Agents Thay Đổi Tương Lai Customer Service',
        slug: 'ai-agents-customer-service-future',
        excerpt: 'Khám phá cách các doanh nghiệp hàng đầu sử dụng AI Agents để tăng hiệu suất customer service lên 300% và giảm chi phí vận hành.',
        content: `# Cách AI Agents Thay Đổi Tương Lai Customer Service

Trong thời đại số hóa hiện tại, **AI Agents** đang cách mạng hóa cách thức doanh nghiệp tương tác với khách hàng.

## Lợi Ích Chính của AI Agents

### 1. Tăng Hiệu Suất Vận Hành
- **Phản hồi 24/7**: Không giới hạn thời gian làm việc
- **Xử lý đồng thời**: Có thể handle hàng trăm cuộc hội thoại cùng lúc
- **Thời gian phản hồi**: Giảm từ phút xuống giây

### 2. Giảm Chi Phí Vận Hành
- Tiết kiệm đến **70% chi phí nhân sự**
- Giảm thời gian training cho nhân viên mới
- Tối ưu hóa quy trình làm việc

## Kết Luận
AI Agents không chỉ là xu hướng mà đã trở thành **necessity** cho các doanh nghiệp muốn cạnh tranh trong thời đại số.`,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-15').toISOString()
      },
      {
        title: 'Top 5 Use Cases AI Automation Trong E-commerce',
        slug: 'ai-automation-ecommerce-use-cases',
        excerpt: 'Từ chatbot support đến inventory management, tìm hiểu những ứng dụng AI automation mang lại ROI cao nhất cho ngành e-commerce.',
        content: `# Top 5 Use Cases AI Automation Trong E-commerce

E-commerce là một trong những ngành được hưởng lợi nhiều nhất từ **AI Automation**.

## 1. Customer Support Automation
### Chatbot Support 24/7
- Trả lời câu hỏi thường gặp
- Hỗ trợ đặt hàng và theo dõi đơn hàng
- Escalation tự động cho các vấn đề phức tạp

### ROI: 300-500%

## Kết Luận
Việc triển khai AI automation đúng cách có thể **transform** toàn bộ business model của bạn.`,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-12').toISOString()
      },
      {
        title: 'Security Best Practices Cho AI Agents',
        slug: 'ai-agents-security-best-practices',
        excerpt: 'Hướng dẫn chi tiết cách bảo mật AI Agents của bạn: từ data encryption đến access control và compliance frameworks.',
        content: `# Security Best Practices Cho AI Agents

Bảo mật là yếu tố **quan trọng nhất** khi triển khai AI Agents trong doanh nghiệp.

## 1. Data Protection
### Data Encryption
- Encryption at rest: AES-256
- Encryption in transit: TLS 1.3
- Key management: Hardware Security Modules (HSM)

## Kết Luận
Security không phải là **one-time setup** mà là **ongoing process**.`,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-10').toISOString()
      }
    ];

    for (const post of blogPosts) {
      try {
        const response = await fetch('http://localhost:3000/api/admin/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(post)
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`✅ Tạo thành công: ${post.title}`);
        } else {
          console.log(`❌ Lỗi tạo blog: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
      }
    }

    console.log('🎉 Hoàn thành tạo blog posts!');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

createBlogPosts(); 