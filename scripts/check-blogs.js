const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBlogs() {
  try {
    console.log('📊 Kiểm tra blogs trong database...');

    const blogs = await prisma.blog.findMany({
      include: {
        author: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📝 Tổng số blogs: ${blogs.length}`);

    if (blogs.length > 0) {
      console.log('\n📋 Danh sách blogs:');
      blogs.forEach((blog, index) => {
        console.log(`${index + 1}. ${blog.title}`);
        console.log(`   - Slug: ${blog.slug}`);
        console.log(`   - Status: ${blog.status}`);
        console.log(`   - Author: ${blog.author?.name || 'Unknown'} (${blog.author?.role})`);
        console.log(`   - Views: ${blog.viewCount}, Likes: ${blog.likeCount}`);
        console.log(`   - Published: ${blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('vi-VN') : 'Chưa publish'}`);
        console.log('');
      });

      // Thống kê theo status
      const stats = await prisma.blog.groupBy({
        by: ['status'],
        _count: { status: true }
      });

      console.log('📊 Thống kê theo status:');
      stats.forEach(stat => {
        console.log(`   - ${stat.status}: ${stat._count.status} blogs`);
      });
    } else {
      console.log('❌ Không có blog nào trong database');
    }

  } catch (error) {
    console.error('❌ Lỗi kiểm tra blogs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogs(); 