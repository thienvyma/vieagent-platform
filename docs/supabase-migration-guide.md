# 🗄️ Supabase PostgreSQL Migration Guide

## 📋 **Overview**

This guide walks you through migrating your VIEAgent platform from SQLite (development) to Supabase PostgreSQL (production).

**Migration Strategy**: 
- Create new Supabase project
- Deploy production schema
- Migrate data (if any)
- Update environment configuration
- Test and validate

---

## 🚀 **Step 1: Create Supabase Project**

### **1.1 Sign up for Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `vieagent-production`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users (e.g., Singapore for Vietnam)
   - **Pricing Plan**: Start with Free tier, upgrade as needed

### **1.2 Get Connection Details**
After project creation, go to **Settings > Database**:
```
Host: db.[PROJECT-REF].supabase.co
Database name: postgres
Port: 5432
User: postgres
Password: [YOUR-PASSWORD]
```

---

## 🔧 **Step 2: Configure Environment Variables**

### **2.1 Update .env.production**
```bash
# Copy the template
cp env.production.template .env.production

# Update these values in .env.production:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase-specific
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

### **2.2 Get Supabase API Keys**
In Supabase Dashboard > **Settings > API**:
- **Project URL**: `https://[PROJECT-REF].supabase.co`
- **Anon/Public Key**: For client-side (not needed for this project)
- **Service Role Key**: For server-side operations (copy this!)

---

## 📊 **Step 3: Deploy Database Schema**

### **3.1 Switch to Production Schema**
```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema.sqlite.backup

# Replace with PostgreSQL schema
cp prisma/schema.production.prisma prisma/schema.prisma

# Generate Prisma client
npm run db:generate
```

### **3.2 Deploy to Supabase**
```bash
# Set environment to production
export NODE_ENV=production

# Deploy schema to Supabase
npx prisma db push --accept-data-loss

# OR create and run migration
npx prisma migrate dev --name init-production
npx prisma migrate deploy
```

### **3.3 Verify Schema Deployment**
Check in Supabase Dashboard > **Database > Tables**:
- Should see all tables created
- Verify indexes are in place
- Check relationships are correct

---

## 📦 **Step 4: Configure Supabase Features**

### **4.1 Enable Row Level Security (Optional but Recommended)**
```sql
-- Run in Supabase SQL Editor
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies (example for users table)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);
```

### **4.2 Setup Storage Bucket**
In Supabase Dashboard > **Storage**:
1. Create new bucket: `vieagent-uploads`
2. Set as public: `false` (private uploads)
3. Configure file size limits
4. Set allowed MIME types

### **4.3 Configure Database Extensions**
```sql
-- Enable useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

---

## 🔄 **Step 5: Data Migration (If Needed)**

### **5.1 Export Data from SQLite (Development)**
```bash
# If you have existing data to migrate
npx prisma db seed  # If you have seed scripts

# Or export specific data
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function exportData() {
  const users = await prisma.user.findMany();
  fs.writeFileSync('users-export.json', JSON.stringify(users, null, 2));
}

exportData();
"
```

### **5.2 Import Data to Supabase**
```bash
# Update DATABASE_URL to production
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run import script
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function importData() {
  const users = JSON.parse(fs.readFileSync('users-export.json'));
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
}

importData();
"
```

---

## ✅ **Step 6: Test & Validate**

### **6.1 Connection Test**
```bash
# Test database connection
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.\$connect();
    console.log('✅ Connected to Supabase successfully!');
    
    const userCount = await prisma.user.count();
    console.log(\`📊 Users in database: \${userCount}\`);
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

test();
"
```

### **6.2 Build Test**
```bash
# Test build with production database
npm run build
```

### **6.3 Basic Operations Test**
```bash
# Test creating a user (optional)
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreate() {
  const testUser = await prisma.user.create({
    data: {
      email: 'test@vieagent.com',
      name: 'Test User',
      role: 'USER'
    }
  });
  console.log('✅ Created test user:', testUser.id);
  
  // Clean up
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log('✅ Cleaned up test user');
}

testCreate();
"
```

---

## 🔧 **Step 7: Production Optimizations**

### **7.1 Connection Pooling**
Supabase includes PgBouncer for connection pooling. Your connection string should include:
```
?pgbouncer=true&connection_limit=1
```

### **7.2 Database Indexes**
The production schema includes optimized indexes. Verify they're created:
```sql
-- Check indexes
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### **7.3 Performance Monitoring**
- Enable Supabase metrics in Dashboard
- Set up alerts for high connection usage
- Monitor query performance

---

## 📋 **Migration Checklist**

- [ ] ✅ Supabase project created
- [ ] ✅ Connection details copied
- [ ] ✅ Environment variables updated
- [ ] ✅ Database schema deployed
- [ ] ✅ Storage bucket configured
- [ ] ✅ Extensions enabled
- [ ] ✅ Data migrated (if applicable)
- [ ] ✅ Connection tested
- [ ] ✅ Build tested
- [ ] ✅ Basic operations verified

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**Connection Timeout:**
```bash
# Check if IP is whitelisted (Supabase allows all by default)
# Verify connection string format
# Test with direct connection (without pgbouncer)
```

**Schema Sync Issues:**
```bash
# Reset Prisma client
rm -rf node_modules/.prisma
npm run db:generate

# Or force reset
npx prisma db push --force-reset
```

**Migration Errors:**
```bash
# Check Prisma migrate status
npx prisma migrate status

# Reset migrations
npx prisma migrate reset
```

---

## 💰 **Cost Optimization**

### **Free Tier Limits (Supabase):**
- **Database**: 500MB
- **Storage**: 1GB
- **Bandwidth**: 2GB
- **API Requests**: 50,000/month

### **Upgrade Path:**
- **Pro Plan**: $25/month
  - 8GB database
  - 100GB storage
  - 50GB bandwidth
  - Daily backups

### **Tips to Stay Within Free Tier:**
1. Optimize images before storage
2. Use efficient queries
3. Implement proper indexing
4. Regular cleanup of old data

---

## 🎯 **Next Steps**

After successful migration:
1. ✅ Update deployment plan status
2. 🚀 Proceed to ChromaDB setup on Railway
3. 🔄 Configure Upstash Redis
4. 📧 Setup email service
5. 🚀 Deploy to Vercel

---

**Migration Complete! Your VIEAgent platform is now running on production-grade PostgreSQL.** 🎉 