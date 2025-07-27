import { NextRequest, NextResponse } from 'next/server';
// ✅ FIXED Phase 4D True Fix - Fix getServerSession import for next-auth v4
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Lấy danh sách active sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'sessions':
        return await getActiveSessions(session.user.email);
      case 'performance':
        return await getPerformanceMetrics(session.user.email);
      case 'escalation-rules':
        return await getEscalationRules(session.user.email);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Live Management API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Tạo hoặc cập nhật session, handover actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sessionId, agentId, platform, userId, message } = body;

    switch (action) {
      case 'create-session':
        return await createSession(session.user.email, { agentId, platform, userId });
      case 'update-session':
        return await updateSession(sessionId, { message, status: 'active' });
      case 'handover':
        return await initiateHandover(sessionId, session.user.email);
      case 'return-to-agent':
        return await returnToAgent(sessionId);
      case 'switch-agent':
        return await switchAgent(sessionId, agentId);
      case 'auto-handover':
        return await performAutoHandover(sessionId, body.reason, body.type);
      case 'update-escalation-rules':
        return await updateEscalationRules(session.user.email, body.rules);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Live Management POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
async function getActiveSessions(userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { agents: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Mock data cho demo - trong production sẽ lấy từ database
  const mockSessions = [
    {
      id: 'session_1',
      agentName: 'AI Assistant',
      platform: 'Facebook',
      user: 'Nguyễn Văn A',
      status: 'active',
      startTime: new Date(Date.now() - 10 * 60 * 1000),
      messageCount: 15,
      lastMessage: 'Tôi cần hỗ trợ về sản phẩm',
      sentiment: 'neutral',
      priority: 'medium',
      agentId: user.agents[0]?.id || 'agent_1',
    },
    {
      id: 'session_2',
      agentName: 'Sales Bot',
      platform: 'Web',
      user: 'Anonymous User',
      status: 'waiting',
      startTime: new Date(Date.now() - 5 * 60 * 1000),
      messageCount: 3,
      lastMessage: 'Xin chào, tôi muốn tư vấn',
      sentiment: 'positive',
      priority: 'low',
      agentId: user.agents[1]?.id || 'agent_2',
    },
    {
      id: 'session_3',
      agentName: 'Support Bot',
      platform: 'Zalo',
      user: 'Trần Thị B',
      status: 'human_control',
      startTime: new Date(Date.now() - 15 * 60 * 1000),
      messageCount: 25,
      lastMessage: 'Vấn đề này phức tạp quá, tôi cần hỗ trợ trực tiếp',
      sentiment: 'negative',
      priority: 'high',
      agentId: user.agents[0]?.id || 'agent_1',
    },
  ];

  return NextResponse.json({ sessions: mockSessions });
}

async function getPerformanceMetrics(userEmail: string) {
  // Mock performance data
  const metrics = {
    responseTime: 2.3,
    successRate: 94,
    escalationRate: 6,
    activeSessions: 3,
    totalSessions: 15,
    averageSessionDuration: 8.5,
    satisfactionScore: 4.2,
  };

  return NextResponse.json({ metrics });
}

async function getEscalationRules(userEmail: string) {
  // Mock escalation rules
  const rules = {
    negativeSentiment: true,
    highPriority: true,
    longConversation: true,
    technicalIssue: true,
    responseTimeThreshold: 10,
    messageCountThreshold: 20,
  };

  return NextResponse.json({ rules });
}

async function createSession(userEmail: string, data: any) {
  const sessionId = `session_${Date.now()}`;

  // Trong production sẽ lưu vào database
  const newSession = {
    id: sessionId,
    agentId: data.agentId,
    platform: data.platform,
    userId: data.userId,
    status: 'active',
    startTime: new Date(),
    messageCount: 0,
    lastMessage: '',
    sentiment: 'neutral',
    priority: 'low',
  };

  return NextResponse.json({ session: newSession });
}

async function updateSession(sessionId: string, data: any) {
  // Trong production sẽ cập nhật database
  return NextResponse.json({
    success: true,
    message: 'Session updated successfully',
  });
}

async function initiateHandover(sessionId: string, userEmail: string) {
  // Cập nhật session status thành human_control
  return NextResponse.json({
    success: true,
    message: 'Handover initiated successfully',
    sessionId,
    status: 'human_control',
  });
}

async function returnToAgent(sessionId: string) {
  // Trả session về AI agent
  return NextResponse.json({
    success: true,
    message: 'Session returned to AI agent',
    sessionId,
    status: 'active',
  });
}

async function switchAgent(sessionId: string, newAgentId: string) {
  // Chuyển đổi agent cho session
  return NextResponse.json({
    success: true,
    message: 'Agent switched successfully',
    sessionId,
    newAgentId,
  });
}

async function performAutoHandover(
  sessionId: string,
  reason: string,
  type: 'human_agent' | 'escalation_rule'
) {
  // Thực hiện auto handover
  const handoverType =
    type === 'human_agent' ? 'Human Agent Available' : 'Escalation Rule Triggered';

  return NextResponse.json({
    success: true,
    message: `Auto handover performed: ${reason}`,
    sessionId,
    reason,
    type,
    handoverType,
    timestamp: new Date().toISOString(),
  });
}

async function updateEscalationRules(userEmail: string, rules: any) {
  // Lưu escalation rules vào database
  return NextResponse.json({
    success: true,
    message: 'Escalation rules updated successfully',
    rules,
  });
}
