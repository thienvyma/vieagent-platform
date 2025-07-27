'use client';

import { useState, useEffect } from 'react';

interface Session {
  id: string;
  agentName: string;
  platform: string;
  user: string;
  status: 'active' | 'waiting' | 'human_control';
  startTime: Date;
  messageCount: number;
  lastMessage: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'high' | 'medium' | 'low';
  agentId: string;
}

interface Agent {
  id: string;
  name: string;
  model: string;
}

interface LiveManagementTabProps {
  agents: Agent[];
}

export default function LiveManagementTab({ agents }: LiveManagementTabProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [handoverMode, setHandoverMode] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const [escalationRules, setEscalationRules] = useState({
    negativeSentiment: true,
    highPriority: true,
    longConversation: true,
    technicalIssue: true,
  });
  const [loading, setLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    responseTime: 2.3,
    successRate: 94,
    escalationRate: 6,
    activeSessions: 0,
    totalSessions: 0,
    averageSessionDuration: 8.5,
    satisfactionScore: 4.2,
  });

  // Thêm state cho auto handover
  const [autoHandoverEnabled, setAutoHandoverEnabled] = useState(true);
  const [humanAgentOnline, setHumanAgentOnline] = useState(true); // Mock: giả sử có human agent online
  const [autoHandoverHistory, setAutoHandoverHistory] = useState<
    Array<{
      sessionId: string;
      reason: string;
      timestamp: Date;
      type: 'human_agent' | 'escalation_rule';
    }>
  >([]);

  // ✅ FIXED Phase 4D True Fix - Fix useEffect return value
  // Smart session loading with intelligent fallback
  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deployment/live-management?action=sessions');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.sessions && Array.isArray(data.sessions)) {
          // Transform session data to ensure proper format
          const transformedSessions = data.sessions.map((session: any) => ({
            ...session,
            startTime: new Date(session.startTime),
            lastActivity: session.lastActivity ? new Date(session.lastActivity) : new Date(),
            duration: session.startTime ? Date.now() - new Date(session.startTime).getTime() : 0,
          }));
          
          setSessions(transformedSessions);
          setPerformanceMetrics(prev => ({
            ...prev,
            activeSessions: transformedSessions.filter((s: any) => s.status === 'active').length,
            totalSessions: transformedSessions.length,
          }));
        } else {
          // API returned but no sessions
          setSessions([]);
          setPerformanceMetrics(prev => ({
            ...prev,
            activeSessions: 0,
            totalSessions: 0,
          }));
        }
      } else {
        console.warn('Live management API not available, showing empty state');
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/deployment/live-management?action=performance');
      const data = await response.json();
      
      if (data.metrics) {
        setPerformanceMetrics(prev => ({
          ...prev,
          ...data.metrics,
        }));
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const loadEscalationRules = async () => {
    try {
      const response = await fetch('/api/deployment/live-management?action=escalation-rules');
      const data = await response.json();
      
      if (data.rules) {
        setEscalationRules(data.rules);
      }
    } catch (error) {
      console.error('Error loading escalation rules:', error);
    }
  };

  // Load sessions from API
  useEffect(() => {
    loadSessions();
    loadPerformanceMetrics();
    loadEscalationRules();

    // Simulate auto handover detection
    if (autoHandoverEnabled && humanAgentOnline) {
      const interval = setInterval(() => {
        checkAutoHandoverConditions();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }

    // Return undefined for other cases
    return undefined;
  }, [autoHandoverEnabled, humanAgentOnline]);

  // Functions moved to top of component

  const handleTakeOver = async (session: Session) => {
    try {
      const response = await fetch('/api/deployment/live-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'handover',
          sessionId: session.id,
        }),
      });

      if (response.ok) {
        setSelectedSession(session);
        setHandoverMode(true);
        setSessions(prev =>
          prev.map(s => (s.id === session.id ? { ...s, status: 'human_control' as const } : s))
        );
      }
    } catch (error) {
      console.error('Error initiating handover:', error);
    }
  };

  const handleReturnToAgent = async (session: Session) => {
    try {
      const response = await fetch('/api/deployment/live-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'return-to-agent',
          sessionId: session.id,
        }),
      });

      if (response.ok) {
        setSessions(prev =>
          prev.map(s => (s.id === session.id ? { ...s, status: 'active' as const } : s))
        );
        setHandoverMode(false);
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error returning to agent:', error);
    }
  };

  const handleSwitchAgent = async (session: Session, newAgentName: string) => {
    const newAgent = agents.find(a => a.name === newAgentName);
    if (!newAgent) return;

    try {
      const response = await fetch('/api/deployment/live-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch-agent',
          sessionId: session.id,
          agentId: newAgent.id,
        }),
      });

      if (response.ok) {
        setSessions(prev =>
          prev.map(s =>
            s.id === session.id ? { ...s, agentName: newAgentName, agentId: newAgent.id } : s
          )
        );
      }
    } catch (error) {
      console.error('Error switching agent:', error);
    }
  };

  const handleUpdateEscalationRules = async () => {
    try {
      const response = await fetch('/api/deployment/live-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-escalation-rules',
          rules: escalationRules,
        }),
      });

      if (response.ok) {
        // Show success message
        console.log('Escalation rules updated successfully');
      }
    } catch (error) {
      console.error('Error updating escalation rules:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'waiting':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'human_control':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      case 'neutral':
        return '😐';
      default:
        return '😐';
    }
  };

  // Function to check auto handover conditions
  const checkAutoHandoverConditions = () => {
    if (!autoHandoverEnabled) return;

    sessions.forEach(session => {
      // Check if human agent is available and session needs handover
      if (humanAgentOnline && session.status === 'active') {
        let shouldHandover = false;
        let reason = '';

        // Check escalation rules
        if (escalationRules.negativeSentiment && session.sentiment === 'negative') {
          shouldHandover = true;
          reason = 'Sentiment tiêu cực';
        } else if (escalationRules.highPriority && session.priority === 'high') {
          shouldHandover = true;
          reason = 'Priority cao';
        } else if (escalationRules.longConversation && session.messageCount > 20) {
          shouldHandover = true;
          reason = 'Hội thoại dài';
        }

        if (shouldHandover) {
          performAutoHandover(session, reason, 'escalation_rule');
        }
      }
    });
  };

  // Function to perform auto handover
  const performAutoHandover = async (
    session: Session,
    reason: string,
    type: 'human_agent' | 'escalation_rule'
  ) => {
    try {
      const response = await fetch('/api/deployment/live-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-handover',
          sessionId: session.id,
          reason: reason,
          type: type,
        }),
      });

      if (response.ok) {
        // Update session status
        setSessions(prev =>
          prev.map(s => (s.id === session.id ? { ...s, status: 'human_control' as const } : s))
        );

        // Add to auto handover history
        setAutoHandoverHistory(prev => [
          ...prev,
          {
            sessionId: session.id,
            reason: reason,
            timestamp: new Date(),
            type: type,
          },
        ]);

        // Show notification
        showAutoHandoverNotification(session, reason, type);
      }
    } catch (error) {
      console.error('Error performing auto handover:', error);
    }
  };

  // Function to show auto handover notification
  const showAutoHandoverNotification = (
    session: Session,
    reason: string,
    type: 'human_agent' | 'escalation_rule'
  ) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 bg-${type === 'human_agent' ? 'purple' : 'orange'}-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm`;
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-2xl">${type === 'human_agent' ? '👤' : '🚨'}</span>
        <div>
          <div class="font-semibold">Auto Handover</div>
          <div class="text-sm opacity-90">${session.user} - ${reason}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-white text-lg'>Đang tải Live Management...</div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10'>
        <h2 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
          <span className='text-3xl'>🔄</span>
          <span>Live Agent Management</span>
        </h2>

        <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6 text-center'>
          <div className='text-4xl mb-4'>✅</div>
          <h3 className='text-green-300 font-semibold mb-2'>Real-time Management Active!</h3>
          <p className='text-green-200 text-sm'>
            Theo dõi và quản lý tất cả cuộc hội thoại AI trong thời gian thực.
          </p>
        </div>

        {/* Live Sessions */}
        <div className='mb-8'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-xl font-bold text-white'>Phiên Hoạt Động ({sessions.length})</h3>
            <div className='flex space-x-2'>
              <span className='bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30'>
                {sessions.filter(s => s.status === 'active').length} Active
              </span>
              <span className='bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm border border-orange-500/30'>
                {sessions.filter(s => s.status === 'waiting').length} Waiting
              </span>
              <span className='bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30'>
                {sessions.filter(s => s.status === 'human_control').length} Human Control
              </span>
            </div>
          </div>

          <div className='grid gap-4'>
            {sessions.map(session => (
              <div
                key={session.id}
                className={`bg-white/5 border rounded-xl p-6 hover:border-orange-500/30 transition-colors ${
                  session.status === 'human_control'
                    ? 'border-purple-500/30 bg-purple-500/5'
                    : session.status === 'active'
                      ? 'border-green-500/30'
                      : 'border-orange-500/30'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        session.platform === 'Facebook'
                          ? 'bg-blue-500'
                          : session.platform === 'Web'
                            ? 'bg-green-500'
                            : 'bg-purple-500'
                      }`}
                    >
                      <span className='text-2xl'>
                        {session.platform === 'Facebook'
                          ? '📘'
                          : session.platform === 'Web'
                            ? '🌐'
                            : '💬'}
                      </span>
                    </div>

                    <div>
                      <h4 className='text-white font-semibold'>{session.user}</h4>
                      <p className='text-gray-400 text-sm'>
                        {session.agentName} • {session.platform}
                      </p>
                      <p className='text-gray-400 text-xs'>
                        {Math.floor((Date.now() - session.startTime.getTime()) / 60000)} phút trước
                        • {session.messageCount} tin nhắn
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-3'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(session.status)}`}
                    >
                      {session.status === 'active'
                        ? 'AI Active'
                        : session.status === 'waiting'
                          ? '⏳ Chờ phản hồi'
                          : '👤 Human Control'}
                    </span>

                    {/* Auto Handover Indicator */}
                    {session.status === 'human_control' && (
                      <span className='px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30'>
                        {autoHandoverHistory.find(h => h.sessionId === session.id)
                          ? 'Auto'
                          : '👤 Manual'}
                      </span>
                    )}

                    <div className='flex items-center space-x-2'>
                      <span className='text-lg'>{getSentimentIcon(session.sentiment)}</span>
                      <span className={`text-xs ${getPriorityColor(session.priority)}`}>
                        {session.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className='flex space-x-2'>
                      {session.status !== 'human_control' ? (
                        <button
                          onClick={() => handleTakeOver(session)}
                          className='bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30 text-sm'
                        >
                          👤 Tiếp Quản
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReturnToAgent(session)}
                          className='bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30 text-sm'
                        >
                          AI Trả Về AI
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setShowSessionDetails(true);
                        }}
                        className='bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30 text-sm'
                      >
                        📋 Chi Tiết
                      </button>
                    </div>
                  </div>
                </div>

                <div className='mt-4 bg-gray-800/50 rounded-lg p-3'>
                  <p className='text-gray-300 text-sm'>Tin nhắn cuối: "{session.lastMessage}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Tools */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-blue-500/10 border border-blue-500/20 rounded-xl p-6'>
            <h3 className='text-blue-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>⚡</span>
              <span>Auto Switch</span>
            </h3>
            <p className='text-blue-200 text-sm mb-4'>
              Tự động chuyển đổi giữa các AI agents dựa trên context.
            </p>
            <div className='flex items-center space-x-3 mb-4'>
              <input
                type='checkbox'
                id='autoSwitch'
                checked={autoSwitchEnabled}
                onChange={e => setAutoSwitchEnabled(e.target.checked)}
                className='rounded border-gray-600 bg-gray-800 text-blue-500'
              />
              <label htmlFor='autoSwitch' className='text-white text-sm'>
                Bật tự động chuyển đổi
              </label>
            </div>
            <button className='bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30 text-sm w-full'>
              Cấu Hình Auto Switch
            </button>
          </div>

          <div className='bg-orange-500/10 border border-orange-500/20 rounded-xl p-6'>
            <h3 className='text-orange-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>🚨</span>
              <span>Escalation Rules</span>
            </h3>
            <p className='text-orange-200 text-sm mb-4'>
              Thiết lập quy tắc chuyển sang human support.
            </p>
            <div className='space-y-2 text-sm'>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={escalationRules.negativeSentiment}
                  onChange={e =>
                    setEscalationRules(prev => ({ ...prev, negativeSentiment: e.target.checked }))
                  }
                  className='rounded border-gray-600 bg-gray-800 text-orange-500'
                />
                <span className='text-white'>Sentiment tiêu cực</span>
              </label>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={escalationRules.highPriority}
                  onChange={e =>
                    setEscalationRules(prev => ({ ...prev, highPriority: e.target.checked }))
                  }
                  className='rounded border-gray-600 bg-gray-800 text-orange-500'
                />
                <span className='text-white'>Priority cao</span>
              </label>
            </div>
            <button
              onClick={handleUpdateEscalationRules}
              className='bg-orange-500/20 text-orange-300 px-4 py-2 rounded-lg hover:bg-orange-500/30 transition-colors border border-orange-500/30 text-sm w-full mt-4'
            >
              Thiết Lập Escalation
            </button>
          </div>

          <div className='bg-green-500/10 border border-green-500/20 rounded-xl p-6'>
            <h3 className='text-green-300 font-semibold mb-2 flex items-center space-x-2'>
              <span>📊</span>
              <span>Performance Monitor</span>
            </h3>
            <p className='text-green-200 text-sm mb-4'>
              Theo dõi hiệu suất và chất lượng hội thoại.
            </p>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Response Time:</span>
                <span className='text-green-300'>{performanceMetrics.responseTime}s</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Success Rate:</span>
                <span className='text-green-300'>{performanceMetrics.successRate}%</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Escalation Rate:</span>
                <span className='text-orange-300'>{performanceMetrics.escalationRate}%</span>
              </div>
            </div>
            <button className='bg-green-500/20 text-green-300 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30 text-sm w-full mt-4'>
              Xem Performance
            </button>
          </div>
        </div>

        {/* Auto Handover Controls */}
        <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-6'>
          <h3 className='text-purple-300 font-semibold mb-4 flex items-center space-x-2'>
            <span className='text-blue-400'>AI</span>
            <span>Auto Handover System</span>
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Auto Handover Status */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-white font-medium'>Auto Handover:</span>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='autoHandover'
                    checked={autoHandoverEnabled}
                    onChange={e => setAutoHandoverEnabled(e.target.checked)}
                    className='rounded border-gray-600 bg-gray-800 text-purple-500'
                  />
                  <label htmlFor='autoHandover' className='text-white text-sm'>
                    {autoHandoverEnabled ? 'Đang bật' : 'Đã tắt'}
                  </label>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-white font-medium'>Human Agent Status:</span>
                <div className='flex items-center space-x-2'>
                  <div
                    className={`w-3 h-3 rounded-full ${humanAgentOnline ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span
                    className={`text-sm ${humanAgentOnline ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {humanAgentOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-white font-medium'>Auto Handovers Today:</span>
                <span className='text-purple-300 font-semibold'>{autoHandoverHistory.length}</span>
              </div>
            </div>

            {/* Auto Handover History */}
            <div>
              <h4 className='text-purple-300 font-medium mb-3'>Lịch Sử Auto Handover</h4>
              <div className='space-y-2 max-h-32 overflow-y-auto'>
                {autoHandoverHistory.length === 0 ? (
                  <p className='text-gray-400 text-sm'>Chưa có auto handover nào</p>
                ) : (
                  autoHandoverHistory
                    .slice(-5)
                    .reverse()
                    .map((record, index) => (
                      <div key={index} className='bg-gray-800/50 rounded-lg p-2 text-sm'>
                        <div className='flex items-center justify-between'>
                          <span className='text-white'>
                            {record.type === 'human_agent' ? '👤' : '🚨'} {record.reason}
                          </span>
                          <span className='text-gray-400 text-xs'>
                            {record.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Auto Handover Info */}
          <div className='mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
            <h4 className='text-purple-300 font-medium mb-2'>Cách Hoạt Động</h4>
            <div className='text-purple-200 text-sm space-y-1'>
              <p>• AI sẽ tự động nhường quyền khi có human agent online</p>
              <p>• Tự động chuyển sang human support khi thỏa mãn escalation rules</p>
              <p>• Hiển thị thông báo real-time khi có auto handover</p>
              <p>• Có thể tắt/bật auto handover tùy ý</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-xl font-bold text-white'>
                Chi Tiết Phiên: {selectedSession.user}
              </h3>
              <button
                onClick={() => setShowSessionDetails(false)}
                className='text-gray-400 hover:text-white text-2xl'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Session Info */}
              <div className='bg-gray-800/50 rounded-xl p-6'>
                <h4 className='text-white font-semibold mb-4'>Thông Tin Phiên</h4>
                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Platform:</span>
                    <span className='text-white'>{selectedSession.platform}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Agent:</span>
                    <span className='text-white'>{selectedSession.agentName}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedSession.status)}`}
                    >
                      {selectedSession.status}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Duration:</span>
                    <span className='text-white'>
                      {Math.floor((Date.now() - selectedSession.startTime.getTime()) / 60000)} phút
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Messages:</span>
                    <span className='text-white'>{selectedSession.messageCount}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Sentiment:</span>
                    <span className='text-white flex items-center space-x-2'>
                      <span>{getSentimentIcon(selectedSession.sentiment)}</span>
                      <span>{selectedSession.sentiment}</span>
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-400'>Priority:</span>
                    <span className={`${getPriorityColor(selectedSession.priority)}`}>
                      {selectedSession.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agent Switching */}
              <div className='bg-gray-800/50 rounded-xl p-6'>
                <h4 className='text-white font-semibold mb-4'>Chuyển Đổi Agent</h4>
                <div className='space-y-3'>
                  <p className='text-gray-400 text-sm'>Chọn AI agent khác để xử lý phiên này:</p>
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => handleSwitchAgent(selectedSession, agent.name)}
                      className={`w-full p-3 rounded-lg border transition-colors ${
                        selectedSession.agentName === agent.name
                          ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                          : 'bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50'
                      }`}
                    >
                      <div className='flex items-center space-x-3'>
                        <span className='text-2xl text-blue-400'>AI</span>
                        <div className='text-left'>
                          <div className='font-medium'>{agent.name}</div>
                          <div className='text-sm text-gray-400'>{agent.model}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-4 mt-6'>
              <button
                onClick={() => setShowSessionDetails(false)}
                className='flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors'
              >
                Đóng
              </button>
              {selectedSession.status !== 'human_control' ? (
                <button
                  onClick={() => {
                    handleTakeOver(selectedSession);
                    setShowSessionDetails(false);
                  }}
                  className='flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors'
                >
                  👤 Tiếp Quản Phiên
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleReturnToAgent(selectedSession);
                    setShowSessionDetails(false);
                  }}
                  className='flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors'
                >
                  AI Trả Về AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Handover Interface */}
      {handoverMode && selectedSession && (
        <div className='bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20'>
          <h3 className='text-xl font-bold text-white mb-6 flex items-center space-x-3'>
            <span className='text-2xl'>👤</span>
            <span>Human Takeover: {selectedSession.user}</span>
          </h3>

          <div className='bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-6'>
            <h4 className='text-purple-300 font-semibold mb-2'>Thông Tin Handover</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-400'>Platform:</span>
                <span className='text-white ml-2'>{selectedSession.platform}</span>
              </div>
              <div>
                <span className='text-gray-400'>Agent:</span>
                <span className='text-white ml-2'>{selectedSession.agentName}</span>
              </div>
              <div>
                <span className='text-gray-400'>Duration:</span>
                <span className='text-white ml-2'>
                  {Math.floor((Date.now() - selectedSession.startTime.getTime()) / 60000)} phút
                </span>
              </div>
              <div>
                <span className='text-gray-400'>Messages:</span>
                <span className='text-white ml-2'>{selectedSession.messageCount}</span>
              </div>
              <div>
                <span className='text-gray-400'>Sentiment:</span>
                <span className='text-white ml-2 flex items-center space-x-1'>
                  <span>{getSentimentIcon(selectedSession.sentiment)}</span>
                  <span>{selectedSession.sentiment}</span>
                </span>
              </div>
              <div>
                <span className='text-gray-400'>Priority:</span>
                <span className={`ml-2 ${getPriorityColor(selectedSession.priority)}`}>
                  {selectedSession.priority.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className='bg-gray-800/50 rounded-xl p-6 mb-6'>
            <h4 className='text-white font-semibold mb-4'>Lịch Sử Hội Thoại</h4>
            <div className='space-y-3 max-h-40 overflow-y-auto'>
              <div className='bg-gray-700 rounded-lg p-3'>
                <div className='flex justify-between items-start mb-2'>
                  <span className='text-blue-300 font-medium'>User</span>
                  <span className='text-gray-400 text-xs'>2 phút trước</span>
                </div>
                <p className='text-white text-sm'>Tôi cần hỗ trợ về sản phẩm</p>
              </div>
              <div className='bg-gray-700 rounded-lg p-3'>
                <div className='flex justify-between items-start mb-2'>
                  <span className='text-green-300 font-medium'>AI Assistant</span>
                  <span className='text-gray-400 text-xs'>1 phút trước</span>
                </div>
                <p className='text-white text-sm'>
                  Xin chào! Tôi có thể giúp gì cho bạn về sản phẩm?
                </p>
              </div>
              <div className='bg-gray-700 rounded-lg p-3'>
                <div className='flex justify-between items-start mb-2'>
                  <span className='text-blue-300 font-medium'>User</span>
                  <span className='text-gray-400 text-xs'>30 giây trước</span>
                </div>
                <p className='text-white text-sm'>
                  Vấn đề này phức tạp quá, tôi cần hỗ trợ trực tiếp
                </p>
              </div>
            </div>
          </div>

          <div className='flex space-x-4'>
            <button
              onClick={() => handleReturnToAgent(selectedSession)}
              className='bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-medium'
            >
              AI Trả Về AI Agent
            </button>
            <button
              onClick={() => {
                setHandoverMode(false);
                setSelectedSession(null);
              }}
              className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors'
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
