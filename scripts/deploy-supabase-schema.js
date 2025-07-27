#!/usr/bin/env node
/**
 * 🗄️ Supabase PostgreSQL Schema Deployment Script
 * 
 * This script deploys the VIEAgent schema to Supabase production database
 * Run this after setting up your Supabase project and updating .env.production
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🚀 VIEAgent Supabase Schema Deployment');
console.log('=====================================\n');

// Check if we're in production mode
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  Setting NODE_ENV to production for deployment...');
  process.env.NODE_ENV = 'production';
}

async function validateEnvironment() {
  console.log('1️⃣ Validating Environment Variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Please update your .env.production file with Supabase credentials');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables present\n');
}

async function testConnection() {
  console.log('2️⃣ Testing Database Connection...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully');
    
    // Test basic query
    await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful');
    
    await prisma.$disconnect();
    console.log('✅ Connection test completed\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n💡 Check your DATABASE_URL and network connectivity');
    process.exit(1);
  }
}

async function deploySchema() {
  console.log('3️⃣ Deploying Database Schema...');
  
  try {
    // Generate Prisma client for production
    console.log('   📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Deploy schema to Supabase
    console.log('   🚀 Deploying schema to Supabase...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    console.log('✅ Schema deployed successfully\n');
  } catch (error) {
    console.error('❌ Schema deployment failed:', error.message);
    process.exit(1);
  }
}

async function validateDeployment() {
  console.log('4️⃣ Validating Schema Deployment...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Check if main tables exist
    const tables = [
      'User', 'Agent', 'Conversation', 'Knowledge', 
      'Document', 'Subscription', 'AdminLog'
    ];
    
    console.log('   📊 Checking table creation...');
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`      ✅ ${table}: ${count} records`);
      } catch (error) {
        console.log(`      ❌ ${table}: Not found or accessible`);
      }
    }
    
    // Check database info
    const result = await prisma.$queryRaw`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version
    `;
    
    console.log('\n   📋 Database Information:');
    console.log(`      Database: ${result[0].database}`);
    console.log(`      User: ${result[0].user}`);
    console.log(`      Version: ${result[0].version.split(' ')[0]}`);
    
    await prisma.$disconnect();
    console.log('\n✅ Schema validation completed\n');
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    process.exit(1);
  }
}

async function createInitialData() {
  console.log('5️⃣ Creating Initial Production Data...');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Check if admin user exists
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    if (adminCount === 0) {
      console.log('   👤 Creating initial admin user...');
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@vieagent.com',
          name: 'System Administrator',
          role: 'ADMIN',
          plan: 'ENTERPRISE',
          isActive: true,
          verified: true
        }
      });
      
      console.log(`   ✅ Admin user created: ${adminUser.id}`);
    } else {
      console.log(`   ✅ Admin users exist: ${adminCount}`);
    }
    
    // Create initial subscription plans if none exist
    const planCount = await prisma.subscriptionPlan.count();
    
    if (planCount === 0) {
      console.log('   💳 Creating subscription plans...');
      
      const plans = [
        {
          name: 'Free',
          priceId: 'free',
          price: 0,
          maxAgents: 1,
          maxDocuments: 10,
          features: ['Basic AI Chat', 'Limited Knowledge Base']
        },
        {
          name: 'Starter',
          priceId: 'price_starter',
          price: 1500, // 15 USD
          maxAgents: 3,
          maxDocuments: 100,
          features: ['Multi-AI Providers', 'Google Integration', 'Email Support']
        },
        {
          name: 'Professional',
          priceId: 'price_professional', 
          price: 4900, // 49 USD
          maxAgents: 10,
          maxDocuments: 1000,
          features: ['All Starter Features', 'Priority Support', 'Advanced Analytics']
        }
      ];
      
      for (const plan of plans) {
        await prisma.subscriptionPlan.create({ data: plan });
      }
      
      console.log(`   ✅ Created ${plans.length} subscription plans`);
    } else {
      console.log(`   ✅ Subscription plans exist: ${planCount}`);
    }
    
    await prisma.$disconnect();
    console.log('✅ Initial data creation completed\n');
  } catch (error) {
    console.error('❌ Initial data creation failed:', error.message);
    process.exit(1);
  }
}

async function generateReport() {
  console.log('6️⃣ Generating Deployment Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    database: process.env.SUPABASE_URL,
    tables_created: 0,
    indexes_created: 0,
    initial_data: {
      admin_users: 0,
      subscription_plans: 0
    }
  };
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Count tables
    const tables = await prisma.$queryRaw`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    report.tables_created = parseInt(tables[0].count);
    
    // Count indexes
    const indexes = await prisma.$queryRaw`
      SELECT count(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    report.indexes_created = parseInt(indexes[0].count);
    
    // Count initial data
    report.initial_data.admin_users = await prisma.user.count({ where: { role: 'ADMIN' } });
    report.initial_data.subscription_plans = await prisma.subscriptionPlan.count();
    
    await prisma.$disconnect();
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'reports', `supabase-deployment-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📋 Deployment Summary:');
    console.log(`   📊 Tables Created: ${report.tables_created}`);
    console.log(`   🔍 Indexes Created: ${report.indexes_created}`);
    console.log(`   👤 Admin Users: ${report.initial_data.admin_users}`);
    console.log(`   💳 Subscription Plans: ${report.initial_data.subscription_plans}`);
    console.log(`   📄 Report saved: ${reportPath}`);
    
    console.log('\n🎉 Supabase PostgreSQL deployment completed successfully!');
    console.log('🔗 Your database is ready and configured.');
    
  } catch (error) {
    console.error('❌ Report generation failed:', error.message);
    report.status = 'ERROR';
    report.error = error.message;
  }
}

// Main execution
async function main() {
  try {
    await validateEnvironment();
    await testConnection();
    await deploySchema();
    await validateDeployment();
    await createInitialData();
    await generateReport();
    
    console.log('\n✅ All deployment steps completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n⚠️ Deployment interrupted by user');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main }; 