import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface OptimizationRecommendation {
  id: string;
  type: 'performance' | 'cost' | 'accuracy' | 'engagement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  actionItems: string[];
  agentId?: string;
  confidence: number;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');

    // Get agent data for analysis
    const whereClause: any = {
      userId: session.user.id,
    };

    if (agentId && agentId !== 'all') {
      whereClause.id = agentId;
    }

    const agents = await prisma.agent.findMany({
      where: whereClause,
      include: {
        conversations: {
          include: {
            messages: true,
          },
        },
        knowledgeSources: true,
      },
    });

    // Get recent conversations for analysis
    const recentConversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
        ...(agentId && agentId !== 'all' ? { agentId } : {}),
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        messages: true,
        agent: true,
      },
    });

    // Generate recommendations based on analysis
    const recommendations = await generateRecommendations(agents, recentConversations);

    return NextResponse.json({
      success: true,
      recommendations,
      agentId: agentId || 'all',
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

async function generateRecommendations(
  agents: any[],
  conversations: any[]
): Promise<OptimizationRecommendation[]> {
  const recommendations: OptimizationRecommendation[] = [];

  // Analyze performance metrics
  const totalConversations = conversations.length;
  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
  const avgMessagesPerConversation =
    totalConversations > 0 ? totalMessages / totalConversations : 0;

  // Performance recommendations
  if (avgMessagesPerConversation > 10) {
    recommendations.push({
      id: 'perf-001',
      type: 'performance',
      priority: 'high',
      title: 'Optimize Response Accuracy',
      description:
        'Your agents are having longer conversations than optimal, suggesting they may not be finding the right information quickly enough.',
      impact: 'Reduce conversation length by 40%',
      effort: 'medium',
      estimatedImprovement: '+25% user satisfaction',
      actionItems: [
        'Review and optimize knowledge base organization',
        'Improve document chunking strategy',
        'Add more specific training examples',
        'Implement better context retrieval algorithms',
      ],
      confidence: 0.85,
      createdAt: new Date(),
    });
  }

  // Cost optimization
  const highCostAgents = agents.filter(agent => {
    const agentConversations = conversations.filter(conv => conv.agentId === agent.id);
    const agentMessages = agentConversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    return agentMessages > 1000; // High usage threshold
  });

  if (highCostAgents.length > 0) {
    recommendations.push({
      id: 'cost-001',
      type: 'cost',
      priority: 'medium',
      title: 'Optimize Model Usage',
      description:
        'Some agents are using expensive models for routine tasks. Consider implementing smart model routing.',
      impact: 'Reduce monthly costs by 30-50%',
      effort: 'low',
      estimatedImprovement: '-$150/month in costs',
      actionItems: [
        'Implement query complexity analysis',
        'Route simple queries to cheaper models',
        'Use GPT-3.5 for routine tasks, GPT-4 for complex ones',
        'Enable response caching for common queries',
      ],
      confidence: 0.92,
      createdAt: new Date(),
    });
  }

  // Knowledge base recommendations
  const agentsWithFewSources = agents.filter(agent => agent.knowledgeSources.length < 3);
  if (agentsWithFewSources.length > 0) {
    recommendations.push({
      id: 'accuracy-001',
      type: 'accuracy',
      priority: 'high',
      title: 'Expand Knowledge Base',
      description:
        'Some agents have limited knowledge sources, which may impact their ability to provide comprehensive answers.',
      impact: 'Improve answer accuracy by 35%',
      effort: 'high',
      estimatedImprovement: '+30% success rate',
      actionItems: [
        'Add more diverse knowledge sources',
        'Include FAQ documents and troubleshooting guides',
        'Add industry-specific documentation',
        'Implement knowledge source quality scoring',
      ],
      confidence: 0.78,
      createdAt: new Date(),
    });
  }

  // Engagement recommendations
  const shortConversations = conversations.filter(conv => conv.messages.length < 3);
  if (shortConversations.length > totalConversations * 0.4) {
    recommendations.push({
      id: 'engagement-001',
      type: 'engagement',
      priority: 'medium',
      title: 'Improve User Engagement',
      description:
        'Many conversations are ending quickly, suggesting users may not be getting the help they need.',
      impact: 'Increase conversation depth by 50%',
      effort: 'medium',
      estimatedImprovement: '+40% user retention',
      actionItems: [
        'Add follow-up questions to responses',
        'Implement proactive help suggestions',
        'Add quick reply buttons for common actions',
        'Improve conversation flow with better prompts',
      ],
      confidence: 0.71,
      createdAt: new Date(),
    });
  }

  // Model-specific recommendations
  const openAIAgents = agents.filter(agent => agent.aiModel?.includes('gpt'));
  if (openAIAgents.length > 0) {
    recommendations.push({
      id: 'perf-002',
      type: 'performance',
      priority: 'low',
      title: 'Consider Model Alternatives',
      description:
        'Explore alternative AI models that might offer better performance or cost efficiency for your use cases.',
      impact: 'Potential 20% cost reduction or performance improvement',
      effort: 'low',
      estimatedImprovement: 'Variable based on use case',
      actionItems: [
        'Test Anthropic Claude for complex reasoning tasks',
        'Try Google Gemini for multimodal capabilities',
        'Benchmark different models for your specific use cases',
        'Implement A/B testing for model comparison',
      ],
      confidence: 0.65,
      createdAt: new Date(),
    });
  }

  // Response time recommendations
  const slowAgents = agents.filter(agent => {
    const agentConversations = conversations.filter(conv => conv.agentId === agent.id);
    // Mock response time calculation
    const avgResponseTime =
      agentConversations.length > 0
        ? agentConversations.reduce((sum, conv) => sum + conv.messages.length * 0.3, 0) /
          agentConversations.length
        : 0;
    return avgResponseTime > 3; // Slow response threshold
  });

  if (slowAgents.length > 0) {
    recommendations.push({
      id: 'perf-003',
      type: 'performance',
      priority: 'high',
      title: 'Optimize Response Speed',
      description:
        'Some agents are responding slower than optimal. This could impact user experience significantly.',
      impact: 'Reduce response time by 50%',
      effort: 'medium',
      estimatedImprovement: '+20% user satisfaction',
      actionItems: [
        'Optimize knowledge base search algorithms',
        'Implement response caching for common queries',
        'Consider using faster AI models for time-sensitive tasks',
        'Reduce context window size if possible',
      ],
      confidence: 0.88,
      createdAt: new Date(),
    });
  }

  // Sort recommendations by priority and confidence
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recommendationId, action, agentId } = body;

    // Log recommendation action
    const recommendationAction = await prisma.recommendationAction.create({
      data: {
        recommendationId,
        userId: session.user.id,
        agentId,
        action,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      action: recommendationAction,
    });
  } catch (error) {
    console.error('Error processing recommendation action:', error);
    return NextResponse.json({ error: 'Failed to process recommendation action' }, { status: 500 });
  }
}
