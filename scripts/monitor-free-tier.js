#!/usr/bin/env node

/**
 * 🔍 FREE TIER MONITORING SCRIPT
 * Giám sát các rủi ro của free tier deployment
 */

const axios = require('axios');
const nodemailer = require('nodemailer');

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_ANON_KEY,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  ALERT_EMAIL: process.env.ALERT_EMAIL,
  APP_URL: process.env.NEXTAUTH_URL,
};

// Risk thresholds
const THRESHOLDS = {
  DATABASE_SIZE: 400 * 1024 * 1024, // 400MB (80% of 500MB)
  BANDWIDTH_USAGE: 80 * 1024 * 1024 * 1024, // 80GB (80% of 100GB)
  STORAGE_USAGE: 20 * 1024 * 1024 * 1024, // 20GB (80% of 25GB)
  VECTOR_COUNT: 800000, // 800K (80% of 1M)
  EMAIL_COUNT: 80, // 80 emails/day (80% of 100)
};

class FreeTierMonitor {
  constructor() {
    this.risks = [];
    this.alerts = [];
  }

  async checkSupabaseHealth() {
    try {
      console.log('🔍 Checking Supabase health...');
      
      // Check database connection
      const response = await axios.get(`${CONFIG.SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': CONFIG.SUPABASE_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
        }
      });

      if (response.status !== 200) {
        this.addRisk('SUPABASE_DOWN', 'Critical', 'Supabase database is not responding');
      }

      // Check database size (approximate)
      const sizeResponse = await axios.get(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/get_db_size`, {
        headers: {
          'apikey': CONFIG.SUPABASE_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
        }
      }).catch(() => ({ data: 0 }));

      const dbSize = sizeResponse.data || 0;
      if (dbSize > THRESHOLDS.DATABASE_SIZE) {
        this.addRisk('DATABASE_SIZE', 'High', `Database size: ${this.formatBytes(dbSize)}`);
      }

      // Ping to prevent pause
      await this.pingSupabase();

      console.log('✅ Supabase health check completed');
    } catch (error) {
      this.addRisk('SUPABASE_ERROR', 'Critical', `Supabase error: ${error.message}`);
    }
  }

  async pingSupabase() {
    try {
      // Simple query to keep database active
      await axios.post(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/ping`, {}, {
        headers: {
          'apikey': CONFIG.SUPABASE_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('📡 Supabase ping successful');
    } catch (error) {
      console.log('⚠️ Supabase ping failed:', error.message);
    }
  }

  async checkVercelUsage() {
    try {
      console.log('🔍 Checking Vercel usage...');
      
      if (!CONFIG.VERCEL_TOKEN) {
        console.log('⚠️ Vercel token not configured');
        return;
      }

      // Get usage data
      const response = await axios.get('https://api.vercel.com/v1/usage', {
        headers: {
          'Authorization': `Bearer ${CONFIG.VERCEL_TOKEN}`
        }
      });

      const usage = response.data;
      
      // Check bandwidth usage
      if (usage.bandwidth && usage.bandwidth.total > THRESHOLDS.BANDWIDTH_USAGE) {
        this.addRisk('BANDWIDTH_LIMIT', 'High', `Bandwidth: ${this.formatBytes(usage.bandwidth.total)}`);
      }

      // Check function executions
      if (usage.functions && usage.functions.total > 90000) { // 90% of 100K
        this.addRisk('FUNCTION_LIMIT', 'Medium', `Functions: ${usage.functions.total}`);
      }

      console.log('✅ Vercel usage check completed');
    } catch (error) {
      this.addRisk('VERCEL_ERROR', 'Medium', `Vercel error: ${error.message}`);
    }
  }

  async checkPineconeUsage() {
    try {
      console.log('🔍 Checking Pinecone usage...');
      
      if (!CONFIG.PINECONE_API_KEY) {
        console.log('⚠️ Pinecone API key not configured');
        return;
      }

      // Get index stats
      const response = await axios.get('https://api.pinecone.io/indexes', {
        headers: {
          'Api-Key': CONFIG.PINECONE_API_KEY
        }
      });

      const indexes = response.data.indexes || [];
      
      for (const index of indexes) {
        if (index.vector_count > THRESHOLDS.VECTOR_COUNT) {
          this.addRisk('VECTOR_LIMIT', 'High', `Vectors: ${index.vector_count}`);
        }
      }

      console.log('✅ Pinecone usage check completed');
    } catch (error) {
      this.addRisk('PINECONE_ERROR', 'Medium', `Pinecone error: ${error.message}`);
    }
  }

  async checkCloudinaryUsage() {
    try {
      console.log('🔍 Checking Cloudinary usage...');
      
      if (!CONFIG.CLOUDINARY_API_KEY) {
        console.log('⚠️ Cloudinary API key not configured');
        return;
      }

      // Get usage stats
      const response = await axios.get('https://api.cloudinary.com/v1_1/usage', {
        auth: {
          username: CONFIG.CLOUDINARY_API_KEY,
          password: process.env.CLOUDINARY_API_SECRET
        }
      });

      const usage = response.data;
      
      if (usage.storage && usage.storage.total > THRESHOLDS.STORAGE_USAGE) {
        this.addRisk('STORAGE_LIMIT', 'Medium', `Storage: ${this.formatBytes(usage.storage.total)}`);
      }

      console.log('✅ Cloudinary usage check completed');
    } catch (error) {
      this.addRisk('CLOUDINARY_ERROR', 'Low', `Cloudinary error: ${error.message}`);
    }
  }

  async checkAppHealth() {
    try {
      console.log('🔍 Checking app health...');
      
      // Health check endpoint
      const response = await axios.get(`${CONFIG.APP_URL}/api/health`, {
        timeout: 5000
      });

      if (response.status !== 200) {
        this.addRisk('APP_DOWN', 'Critical', 'Application health check failed');
      }

      // Check response time
      const startTime = Date.now();
      await axios.get(`${CONFIG.APP_URL}/api/agents`);
      const responseTime = Date.now() - startTime;

      if (responseTime > 5000) {
        this.addRisk('SLOW_RESPONSE', 'Medium', `Response time: ${responseTime}ms`);
      }

      console.log('✅ App health check completed');
    } catch (error) {
      this.addRisk('APP_ERROR', 'Critical', `App error: ${error.message}`);
    }
  }

  addRisk(type, severity, message) {
    const risk = {
      type,
      severity,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.risks.push(risk);
    
    if (severity === 'Critical') {
      this.alerts.push(risk);
    }
    
    console.log(`⚠️ Risk detected: ${severity} - ${message}`);
  }

  async sendAlerts() {
    if (this.alerts.length === 0) {
      console.log('✅ No critical alerts to send');
      return;
    }

    try {
      console.log('📧 Sending alerts...');
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      const alertsText = this.alerts.map(alert => 
        `${alert.severity}: ${alert.message} (${alert.timestamp})`
      ).join('\n');

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: CONFIG.ALERT_EMAIL,
        subject: '🚨 AI Agent Platform - Critical Alerts',
        text: `Critical alerts detected:\n\n${alertsText}`
      });

      console.log('✅ Alerts sent successfully');
    } catch (error) {
      console.error('❌ Failed to send alerts:', error.message);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      risks: this.risks,
      alerts: this.alerts,
      summary: {
        total_risks: this.risks.length,
        critical_risks: this.risks.filter(r => r.severity === 'Critical').length,
        high_risks: this.risks.filter(r => r.severity === 'High').length,
        medium_risks: this.risks.filter(r => r.severity === 'Medium').length,
        low_risks: this.risks.filter(r => r.severity === 'Low').length
      }
    };

    console.log('\n📊 MONITORING REPORT');
    console.log('===================');
    console.log(`Total risks: ${report.summary.total_risks}`);
    console.log(`Critical: ${report.summary.critical_risks}`);
    console.log(`High: ${report.summary.high_risks}`);
    console.log(`Medium: ${report.summary.medium_risks}`);
    console.log(`Low: ${report.summary.low_risks}`);
    
    return report;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Free Tier Monitoring...');
  
  const monitor = new FreeTierMonitor();
  
  // Run all checks
  await monitor.checkSupabaseHealth();
  await monitor.checkVercelUsage();
  await monitor.checkPineconeUsage();
  await monitor.checkCloudinaryUsage();
  await monitor.checkAppHealth();
  
  // Send alerts if needed
  await monitor.sendAlerts();
  
  // Generate report
  const report = monitor.generateReport();
  
  // Save report
  const fs = require('fs');
  fs.writeFileSync(
    `monitoring-report-${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(report, null, 2)
  );
  
  console.log('✅ Monitoring completed');
  
  // Exit with error code if critical risks found
  if (report.summary.critical_risks > 0) {
    process.exit(1);
  }
}

// Run monitoring
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = { FreeTierMonitor }; 