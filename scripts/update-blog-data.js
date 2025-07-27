const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBlogData() {
  try {
    console.log('Updating blog data...');
    
    const blogs = await prisma.blog.findMany();
    
    for (const blog of blogs) {
      // Ensure view count is realistic
      const viewCount = blog.viewCount || Math.floor(Math.random() * 10000) + 1000;
      
      await prisma.blog.update({
        where: { id: blog.id },
        data: {
          viewCount: viewCount
        }
      });
    }

    console.log('✅ Updated blog data successfully!');
    
  } catch (error) {
    console.error('❌ Error updating blog data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBlogData(); 