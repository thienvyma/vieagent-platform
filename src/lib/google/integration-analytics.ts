import { PrismaClient } from '@prisma/client';
import { GoogleCalendarService } from './calendar';
import { GmailService } from './gmail';
import { GoogleDriveService } from './drive';
import { GoogleDocsService } from './docs';
import { GoogleFormsService } from './forms';
import { GoogleSheetsService } from './sheets';

const prisma = new PrismaClient();

export interface ServiceUsageMetrics {
  serviceName: 'calendar' | 'gmail' | 'drive' | 'docs' | 'forms' | 'sheets';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number; // percentage
  averageResponseTime: number; // milliseconds
  totalDataProcessed: number; // bytes
  apiCallsUsed: number;
  quotaLimit: number;
  quotaUsage: number; // percentage
  lastUsed: Date;
  peakUsageHours: Array<{
    hour: number;
    requestCount: number;
  }>;
  errorTypes: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

export interface IntegrationHealthMetrics {
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  healthScore: number; // 0-100
  servicesStatus: Array<{
    service: string;
    status: 'active' | 'degraded' | 'error' | 'offline';
    uptime: number; // percentage
    lastCheck: Date;
  }>;
  authenticationStatus: {
    validTokens: number;
    expiredTokens: number;
    refreshNeeded: number;
    lastRefresh: Date;
  };
  performanceMetrics: {
    averageLatency: number; // milliseconds
    p95Latency: number; // milliseconds
    throughput: number; // requests per minute
    errorRate: number; // percentage
  };
  resourceUsage: {
    memoryUsage: number; // MB
    cpuUsage: number; // percentage
    diskUsage: number; // MB
    networkUsage: number; // MB
  };
}

export interface UserEngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number; // percentage
  averageSessionDuration: number; // minutes
  mostUsedFeatures: Array<{
    feature: string;
    usageCount: number;
    userCount: number;
  }>;
  userSatisfactionScore: number; // 0-10
  supportTickets: {
    total: number;
    resolved: number;
    averageResolutionTime: number; // hours
  };
  featureAdoption: Array<{
    feature: string;
    adoptionRate: number; // percentage
    timeToAdopt: number; // days
  }>;
}

export interface BusinessImpactMetrics {
  productivityGains: {
    timesSaved: number; // hours
    tasksAutomated: number;
    meetingsScheduled: number;
    documentsProcessed: number;
    emailsAnalyzed: number;
  };
  costSavings: {
    totalSavings: number; // USD
    apiCosts: number; // USD
    operationalCosts: number; // USD
    timeCostSavings: number; // USD
  };
  qualityMetrics: {
    accuracyRate: number; // percentage
    userSatisfactionScore: number; // 0-10
    errorReductionRate: number; // percentage
    processEfficiency: number; // percentage
  };
  roi: {
    totalInvestment: number; // USD
    totalReturns: number; // USD
    roiPercentage: number; // percentage
    paybackPeriod: number; // months
  };
}

export interface IntegrationInsights {
  id: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  serviceUsage: ServiceUsageMetrics[];
  healthMetrics: IntegrationHealthMetrics;
  userEngagement: UserEngagementMetrics;
  businessImpact: BusinessImpactMetrics;
  recommendations: Array<{
    type: 'optimization' | 'security' | 'feature' | 'performance';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    estimatedBenefit: string;
  }>;
  trends: Array<{
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    service: string;
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

export interface AnalyticsConfig {
  enableRealTimeMonitoring: boolean;
  alertThresholds: {
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    quotaUsage: number; // percentage
    healthScore: number; // 0-100
  };
  reportingFrequency: 'hourly' | 'daily' | 'weekly';
  dataRetentionDays: number;
  customMetrics: Array<{
    name: string;
    query: string;
    aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min';
  }>;
}

export class IntegrationAnalyticsService {
  private calendarService: GoogleCalendarService;
  private gmailService: GmailService;
  private driveService: GoogleDriveService;
  private docsService: GoogleDocsService;
  private formsService: GoogleFormsService;
  private sheetsService: GoogleSheetsService;

  constructor() {
    this.calendarService = new GoogleCalendarService();
    this.gmailService = new GmailService();
    this.driveService = new GoogleDriveService();
    this.docsService = new GoogleDocsService();
    this.formsService = new GoogleFormsService();
    this.sheetsService = new GoogleSheetsService();
  }

  /**
   * Generate comprehensive integration analytics
   */
  async generateIntegrationAnalytics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    startDate?: Date,
    endDate?: Date
  ): Promise<IntegrationInsights> {
    try {
      console.log('📊 Generating integration analytics for user:', userId);

      const end = endDate || new Date();
      const start = startDate || this.calculateStartDate(end, period);

      // Collect metrics from all services
      const [serviceUsage, healthMetrics, userEngagement, businessImpact] = await Promise.all([
        this.collectServiceUsageMetrics(userId, start, end),
        this.collectHealthMetrics(userId, start, end),
        this.collectUserEngagementMetrics(userId, start, end),
        this.collectBusinessImpactMetrics(userId, start, end),
      ]);

      // Generate insights and recommendations
      const recommendations = await this.generateRecommendations(
        serviceUsage,
        healthMetrics,
        userEngagement,
        businessImpact
      );

      // Analyze trends
      const trends = await this.analyzeTrends(userId, start, end);

      // Check for alerts
      const alerts = await this.checkAlerts(userId, serviceUsage, healthMetrics);

      const insights: IntegrationInsights = {
        id: `insights_${userId}_${Date.now()}`,
        userId,
        period,
        startDate: start,
        endDate: end,
        serviceUsage,
        healthMetrics,
        userEngagement,
        businessImpact,
        recommendations,
        trends,
        alerts,
      };

      // Store insights in database
      await this.saveInsights(insights);

      console.log('✅ Integration analytics generated successfully');
      return insights;
    } catch (error) {
      console.error('❌ Error generating integration analytics:', error);
      throw new Error(
        `Failed to generate analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Collect service usage metrics
   */
  private async collectServiceUsageMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceUsageMetrics[]> {
    const services = ['calendar', 'gmail', 'drive', 'docs', 'forms', 'sheets'] as const;
    const metrics: ServiceUsageMetrics[] = [];

    for (const serviceName of services) {
      try {
        const serviceMetrics = await this.getServiceMetrics(
          userId,
          serviceName,
          startDate,
          endDate
        );
        metrics.push(serviceMetrics);
      } catch (error) {
        console.error(`❌ Error collecting metrics for ${serviceName}:`, error);
        // Add default metrics for failed service
        metrics.push(this.getDefaultServiceMetrics(serviceName));
      }
    }

    return metrics;
  }

  /**
   * Get metrics for specific service
   */
  private async getServiceMetrics(
    userId: string,
    serviceName: ServiceUsageMetrics['serviceName'],
    startDate: Date,
    endDate: Date
  ): Promise<ServiceUsageMetrics> {
    try {
      // Get metrics from database
      const metrics = await prisma.serviceMetrics.findMany({
        where: {
          userId,
          serviceName,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      if (metrics.length === 0) {
        return this.getDefaultServiceMetrics(serviceName);
      }

      // Aggregate metrics
      const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
      const successfulRequests = metrics.reduce((sum, m) => sum + m.successCount, 0);
      const failedRequests = totalRequests - successfulRequests;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

      const responseTimes = metrics.filter(m => m.responseTime > 0).map(m => m.responseTime);
      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

      const totalDataProcessed = metrics.reduce((sum, m) => sum + (m.dataProcessed || 0), 0);
      const apiCallsUsed = metrics.reduce((sum, m) => sum + (m.apiCalls || 0), 0);

      // Calculate peak usage hours
      const hourlyUsage = metrics.reduce(
        (acc, m) => {
          const hour = new Date(m.timestamp).getHours();
          acc[hour] = (acc[hour] || 0) + m.requestCount;
          return acc;
        },
        {} as Record<number, number>
      );

      const peakUsageHours = Object.entries(hourlyUsage)
        .map(([hour, count]) => ({ hour: parseInt(hour), requestCount: count }))
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 5);

      // Calculate error types
      const errorCounts = metrics.reduce(
        (acc, m) => {
          if (m.errorType) {
            acc[m.errorType] = (acc[m.errorType] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      const errorTypes = Object.entries(errorCounts).map(([errorType, count]) => ({
        errorType,
        count,
        percentage: (count / failedRequests) * 100,
      }));

      return {
        serviceName,
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate,
        averageResponseTime,
        totalDataProcessed,
        apiCallsUsed,
        quotaLimit: this.getQuotaLimit(serviceName),
        quotaUsage: (apiCallsUsed / this.getQuotaLimit(serviceName)) * 100,
        lastUsed: metrics[metrics.length - 1]?.timestamp || new Date(),
        peakUsageHours,
        errorTypes,
      };
    } catch (error) {
      console.error(`❌ Error getting service metrics for ${serviceName}:`, error);
      return this.getDefaultServiceMetrics(serviceName);
    }
  }

  /**
   * Collect health metrics
   */
  private async collectHealthMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IntegrationHealthMetrics> {
    try {
      const services = ['calendar', 'gmail', 'drive', 'docs', 'forms', 'sheets'];
      const servicesStatus = await Promise.all(
        services.map(async service => {
          const status = await this.checkServiceHealth(userId, service);
          return {
            service,
            status: status.isHealthy ? 'active' : 'error',
            uptime: status.uptime,
            lastCheck: new Date(),
          };
        })
      );

      // Calculate overall health score
      const healthyServices = servicesStatus.filter(s => s.status === 'active').length;
      const healthScore = (healthyServices / services.length) * 100;

      const overallHealth =
        healthScore >= 90
          ? 'excellent'
          : healthScore >= 70
            ? 'good'
            : healthScore >= 50
              ? 'warning'
              : 'critical';

      // Get authentication status
      const authStatus = await this.getAuthenticationStatus(userId);

      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(userId, startDate, endDate);

      // Get resource usage
      const resourceUsage = await this.getResourceUsage();

      return {
        overallHealth,
        healthScore,
        servicesStatus,
        authenticationStatus: authStatus,
        performanceMetrics,
        resourceUsage,
      };
    } catch (error) {
      console.error('❌ Error collecting health metrics:', error);
      return this.getDefaultHealthMetrics();
    }
  }

  /**
   * Collect user engagement metrics
   */
  private async collectUserEngagementMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserEngagementMetrics> {
    try {
      const userSessions = await prisma.userSession.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const featureUsage = await prisma.featureUsage.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalUsers = 1; // Single user analysis
      const activeUsers = userSessions.length > 0 ? 1 : 0;
      const newUsers = 0; // Would be calculated based on user creation date

      const averageSessionDuration =
        userSessions.length > 0
          ? userSessions.reduce((sum, session) => sum + (session.duration || 0), 0) /
            userSessions.length
          : 0;

      // Most used features
      const featureCounts = featureUsage.reduce(
        (acc, usage) => {
          acc[usage.featureName] = (acc[usage.featureName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const mostUsedFeatures = Object.entries(featureCounts)
        .map(([feature, usageCount]) => ({
          feature,
          usageCount,
          userCount: 1,
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);

      return {
        totalUsers,
        activeUsers,
        newUsers,
        retentionRate: 100, // Single user, so 100% if active
        averageSessionDuration,
        mostUsedFeatures,
        userSatisfactionScore: 8.5, // Would be calculated from feedback
        supportTickets: {
          total: 0,
          resolved: 0,
          averageResolutionTime: 0,
        },
        featureAdoption: [],
      };
    } catch (error) {
      console.error('❌ Error collecting user engagement metrics:', error);
      return this.getDefaultUserEngagementMetrics();
    }
  }

  /**
   * Collect business impact metrics
   */
  private async collectBusinessImpactMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessImpactMetrics> {
    try {
      const automationMetrics = await prisma.automationMetrics.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalTimeSaved = automationMetrics.reduce((sum, m) => sum + (m.timeSaved || 0), 0);
      const tasksAutomated = automationMetrics.reduce((sum, m) => sum + (m.tasksAutomated || 0), 0);
      const meetingsScheduled = automationMetrics.reduce(
        (sum, m) => sum + (m.meetingsScheduled || 0),
        0
      );
      const documentsProcessed = automationMetrics.reduce(
        (sum, m) => sum + (m.documentsProcessed || 0),
        0
      );
      const emailsAnalyzed = automationMetrics.reduce((sum, m) => sum + (m.emailsAnalyzed || 0), 0);

      // Calculate cost savings (rough estimates)
      const hourlyRate = 50; // USD per hour
      const timeCostSavings = totalTimeSaved * hourlyRate;
      const apiCosts = 100; // Estimated monthly API costs
      const operationalCosts = 200; // Estimated operational costs
      const totalSavings = timeCostSavings - apiCosts - operationalCosts;

      return {
        productivityGains: {
          timesSaved: totalTimeSaved,
          tasksAutomated,
          meetingsScheduled,
          documentsProcessed,
          emailsAnalyzed,
        },
        costSavings: {
          totalSavings,
          apiCosts,
          operationalCosts,
          timeCostSavings,
        },
        qualityMetrics: {
          accuracyRate: 95,
          userSatisfactionScore: 8.5,
          errorReductionRate: 80,
          processEfficiency: 85,
        },
        roi: {
          totalInvestment: apiCosts + operationalCosts,
          totalReturns: timeCostSavings,
          roiPercentage:
            totalSavings > 0 ? (totalSavings / (apiCosts + operationalCosts)) * 100 : 0,
          paybackPeriod: 3,
        },
      };
    } catch (error) {
      console.error('❌ Error collecting business impact metrics:', error);
      return this.getDefaultBusinessImpactMetrics();
    }
  }

  /**
   * Generate recommendations based on metrics
   */
  private async generateRecommendations(
    serviceUsage: ServiceUsageMetrics[],
    healthMetrics: IntegrationHealthMetrics,
    userEngagement: UserEngagementMetrics,
    businessImpact: BusinessImpactMetrics
  ): Promise<IntegrationInsights['recommendations']> {
    const recommendations: IntegrationInsights['recommendations'] = [];

    // Performance recommendations
    const slowServices = serviceUsage.filter(s => s.averageResponseTime > 2000);
    for (const service of slowServices) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: `Optimize ${service.serviceName} performance`,
        description: `${service.serviceName} has an average response time of ${service.averageResponseTime}ms, which is above the recommended 2000ms threshold.`,
        impact: 'Improved user experience and faster operations',
        effort: 'medium',
        estimatedBenefit: 'Reduce response time by 30-50%',
      });
    }

    // Quota usage recommendations
    const highQuotaServices = serviceUsage.filter(s => s.quotaUsage > 80);
    for (const service of highQuotaServices) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: `Optimize ${service.serviceName} quota usage`,
        description: `${service.serviceName} is using ${service.quotaUsage.toFixed(1)}% of its quota limit.`,
        impact: 'Prevent service interruptions and reduce costs',
        effort: 'low',
        estimatedBenefit: 'Reduce quota usage by 20-30%',
      });
    }

    // Health recommendations
    if (healthMetrics.healthScore < 80) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'Improve overall system health',
        description: `System health score is ${healthMetrics.healthScore.toFixed(1)}%, which is below the recommended 80% threshold.`,
        impact: 'Better reliability and user experience',
        effort: 'high',
        estimatedBenefit: 'Increase health score to 90%+',
      });
    }

    // Authentication recommendations
    if (healthMetrics.authenticationStatus.expiredTokens > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Refresh expired authentication tokens',
        description: `${healthMetrics.authenticationStatus.expiredTokens} authentication tokens have expired.`,
        impact: 'Prevent service access issues',
        effort: 'low',
        estimatedBenefit: 'Maintain 100% service availability',
      });
    }

    // Feature adoption recommendations
    const underutilizedServices = serviceUsage.filter(s => s.totalRequests < 10);
    for (const service of underutilizedServices) {
      recommendations.push({
        type: 'feature',
        priority: 'low',
        title: `Increase ${service.serviceName} usage`,
        description: `${service.serviceName} has low usage with only ${service.totalRequests} requests.`,
        impact: 'Better ROI on integration investment',
        effort: 'medium',
        estimatedBenefit: 'Increase productivity by 15-25%',
      });
    }

    return recommendations;
  }

  /**
   * Analyze trends
   */
  private async analyzeTrends(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IntegrationInsights['trends']> {
    try {
      const trends: IntegrationInsights['trends'] = [];

      // Get previous period data for comparison
      const periodDuration = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodDuration);
      const previousEnd = new Date(endDate.getTime() - periodDuration);

      const currentMetrics = await this.collectServiceUsageMetrics(userId, startDate, endDate);
      const previousMetrics = await this.collectServiceUsageMetrics(
        userId,
        previousStart,
        previousEnd
      );

      // Compare metrics
      for (let i = 0; i < currentMetrics.length; i++) {
        const current = currentMetrics[i];
        const previous = previousMetrics[i];

        if (previous) {
          // Usage trend
          const usageChange =
            ((current.totalRequests - previous.totalRequests) / previous.totalRequests) * 100;
          trends.push({
            metric: `${current.serviceName}_usage`,
            trend: usageChange > 5 ? 'increasing' : usageChange < -5 ? 'decreasing' : 'stable',
            changePercentage: usageChange,
            significance:
              Math.abs(usageChange) > 20 ? 'high' : Math.abs(usageChange) > 10 ? 'medium' : 'low',
          });

          // Performance trend
          const performanceChange =
            ((current.averageResponseTime - previous.averageResponseTime) /
              previous.averageResponseTime) *
            100;
          trends.push({
            metric: `${current.serviceName}_performance`,
            trend:
              performanceChange > 5
                ? 'decreasing'
                : performanceChange < -5
                  ? 'increasing'
                  : 'stable',
            changePercentage: -performanceChange, // Negative because lower response time is better
            significance:
              Math.abs(performanceChange) > 30
                ? 'high'
                : Math.abs(performanceChange) > 15
                  ? 'medium'
                  : 'low',
          });
        }
      }

      return trends;
    } catch (error) {
      console.error('❌ Error analyzing trends:', error);
      return [];
    }
  }

  /**
   * Check for alerts
   */
  private async checkAlerts(
    userId: string,
    serviceUsage: ServiceUsageMetrics[],
    healthMetrics: IntegrationHealthMetrics
  ): Promise<IntegrationInsights['alerts']> {
    const alerts: IntegrationInsights['alerts'] = [];

    // Check error rates
    for (const service of serviceUsage) {
      const errorRate = (service.failedRequests / service.totalRequests) * 100;
      if (errorRate > 10) {
        alerts.push({
          type: 'error',
          service: service.serviceName,
          message: `High error rate detected: ${errorRate.toFixed(1)}%`,
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // Check quota usage
    for (const service of serviceUsage) {
      if (service.quotaUsage > 90) {
        alerts.push({
          type: 'warning',
          service: service.serviceName,
          message: `Quota usage is at ${service.quotaUsage.toFixed(1)}%`,
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // Check health score
    if (healthMetrics.healthScore < 70) {
      alerts.push({
        type: 'warning',
        service: 'system',
        message: `System health score is low: ${healthMetrics.healthScore.toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check authentication
    if (healthMetrics.authenticationStatus.expiredTokens > 0) {
      alerts.push({
        type: 'error',
        service: 'authentication',
        message: `${healthMetrics.authenticationStatus.expiredTokens} authentication tokens have expired`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    return alerts;
  }

  /**
   * Save insights to database
   */
  private async saveInsights(insights: IntegrationInsights): Promise<void> {
    try {
      await prisma.integrationInsights.create({
        data: {
          id: insights.id,
          userId: insights.userId,
          period: insights.period,
          startDate: insights.startDate,
          endDate: insights.endDate,
          serviceUsage: JSON.stringify(insights.serviceUsage),
          healthMetrics: JSON.stringify(insights.healthMetrics),
          userEngagement: JSON.stringify(insights.userEngagement),
          businessImpact: JSON.stringify(insights.businessImpact),
          recommendations: JSON.stringify(insights.recommendations),
          trends: JSON.stringify(insights.trends),
          alerts: JSON.stringify(insights.alerts),
          createdAt: new Date(),
        },
      });

      console.log('✅ Integration insights saved to database');
    } catch (error) {
      console.error('❌ Error saving insights:', error);
    }
  }

  /**
   * Helper methods
   */
  private calculateStartDate(endDate: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    const start = new Date(endDate);
    switch (period) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  private getQuotaLimit(serviceName: string): number {
    const quotas = {
      calendar: 1000000, // 1M requests per day
      gmail: 1000000000, // 1B quota units per day
      drive: 1000000000, // 1B quota units per day
      docs: 300, // 300 requests per minute
      forms: 100, // 100 requests per minute
      sheets: 300, // 300 requests per minute
    };
    return quotas[serviceName as keyof typeof quotas] || 1000;
  }

  private getDefaultServiceMetrics(
    serviceName: ServiceUsageMetrics['serviceName']
  ): ServiceUsageMetrics {
    return {
      serviceName,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      totalDataProcessed: 0,
      apiCallsUsed: 0,
      quotaLimit: this.getQuotaLimit(serviceName),
      quotaUsage: 0,
      lastUsed: new Date(),
      peakUsageHours: [],
      errorTypes: [],
    };
  }

  private getDefaultHealthMetrics(): IntegrationHealthMetrics {
    return {
      overallHealth: 'warning',
      healthScore: 50,
      servicesStatus: [],
      authenticationStatus: {
        validTokens: 0,
        expiredTokens: 0,
        refreshNeeded: 0,
        lastRefresh: new Date(),
      },
      performanceMetrics: {
        averageLatency: 0,
        p95Latency: 0,
        throughput: 0,
        errorRate: 0,
      },
      resourceUsage: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        networkUsage: 0,
      },
    };
  }

  private getDefaultUserEngagementMetrics(): UserEngagementMetrics {
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      retentionRate: 0,
      averageSessionDuration: 0,
      mostUsedFeatures: [],
      userSatisfactionScore: 0,
      supportTickets: {
        total: 0,
        resolved: 0,
        averageResolutionTime: 0,
      },
      featureAdoption: [],
    };
  }

  private getDefaultBusinessImpactMetrics(): BusinessImpactMetrics {
    return {
      productivityGains: {
        timesSaved: 0,
        tasksAutomated: 0,
        meetingsScheduled: 0,
        documentsProcessed: 0,
        emailsAnalyzed: 0,
      },
      costSavings: {
        totalSavings: 0,
        apiCosts: 0,
        operationalCosts: 0,
        timeCostSavings: 0,
      },
      qualityMetrics: {
        accuracyRate: 0,
        userSatisfactionScore: 0,
        errorReductionRate: 0,
        processEfficiency: 0,
      },
      roi: {
        totalInvestment: 0,
        totalReturns: 0,
        roiPercentage: 0,
        paybackPeriod: 0,
      },
    };
  }

  private async checkServiceHealth(
    userId: string,
    serviceName: string
  ): Promise<{ isHealthy: boolean; uptime: number }> {
    // This would implement actual health checks
    // For now, return default values
    return {
      isHealthy: true,
      uptime: 99.5,
    };
  }

  private async getAuthenticationStatus(
    userId: string
  ): Promise<IntegrationHealthMetrics['authenticationStatus']> {
    try {
      const tokens = await prisma.googleTokens.findMany({
        where: { userId },
      });

      const validTokens = tokens.filter(t => t.expiresAt > new Date()).length;
      const expiredTokens = tokens.filter(t => t.expiresAt <= new Date()).length;
      const refreshNeeded = tokens.filter(
        t => t.expiresAt <= new Date(Date.now() + 24 * 60 * 60 * 1000)
      ).length;

      return {
        validTokens,
        expiredTokens,
        refreshNeeded,
        lastRefresh: tokens[0]?.updatedAt || new Date(),
      };
    } catch (error) {
      console.error('❌ Error getting authentication status:', error);
      return {
        validTokens: 0,
        expiredTokens: 0,
        refreshNeeded: 0,
        lastRefresh: new Date(),
      };
    }
  }

  private async getPerformanceMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IntegrationHealthMetrics['performanceMetrics']> {
    try {
      const metrics = await prisma.serviceMetrics.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const responseTimes = metrics.filter(m => m.responseTime > 0).map(m => m.responseTime);
      const averageLatency =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

      // Calculate P95 latency
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p95Latency = sortedTimes[p95Index] || 0;

      const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
      const totalErrors = metrics.reduce((sum, m) => sum + (m.errorCount || 0), 0);
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

      const periodHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const throughput = totalRequests / (periodHours * 60); // requests per minute

      return {
        averageLatency,
        p95Latency,
        throughput,
        errorRate,
      };
    } catch (error) {
      console.error('❌ Error getting performance metrics:', error);
      return {
        averageLatency: 0,
        p95Latency: 0,
        throughput: 0,
        errorRate: 0,
      };
    }
  }

  private async getResourceUsage(): Promise<IntegrationHealthMetrics['resourceUsage']> {
    // This would implement actual resource monitoring
    // For now, return simulated values
    return {
      memoryUsage: 256, // MB
      cpuUsage: 15, // percentage
      diskUsage: 1024, // MB
      networkUsage: 128, // MB
    };
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealTimeAnalytics(userId: string): Promise<{
    currentStatus: 'healthy' | 'warning' | 'critical';
    activeServices: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    recentAlerts: IntegrationInsights['alerts'];
  }> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const recentMetrics = await prisma.serviceMetrics.findMany({
        where: {
          userId,
          timestamp: {
            gte: oneHourAgo,
            lte: now,
          },
        },
      });

      const totalRequests = recentMetrics.reduce((sum, m) => sum + m.requestCount, 0);
      const totalErrors = recentMetrics.reduce((sum, m) => sum + (m.errorCount || 0), 0);
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

      const responseTimes = recentMetrics.filter(m => m.responseTime > 0).map(m => m.responseTime);
      const averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

      const activeServices = new Set(recentMetrics.map(m => m.serviceName)).size;

      const currentStatus =
        errorRate > 10
          ? 'critical'
          : errorRate > 5 || averageResponseTime > 3000
            ? 'warning'
            : 'healthy';

      // Get recent alerts
      const recentAlerts = await prisma.integrationAlerts.findMany({
        where: {
          userId,
          timestamp: {
            gte: oneHourAgo,
            lte: now,
          },
          resolved: false,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 5,
      });

      return {
        currentStatus,
        activeServices,
        totalRequests,
        errorRate,
        averageResponseTime,
        recentAlerts: recentAlerts.map(alert => ({
          type: alert.type as 'warning' | 'error' | 'info',
          service: alert.service,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
        })),
      };
    } catch (error) {
      console.error('❌ Error getting real-time analytics:', error);
      return {
        currentStatus: 'warning',
        activeServices: 0,
        totalRequests: 0,
        errorRate: 0,
        averageResponseTime: 0,
        recentAlerts: [],
      };
    }
  }
}
