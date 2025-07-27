// ✅ Phase 5 - User Feedback & Tracking Hook
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export interface FeedbackEntry {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  rating: number; // 1-5 stars
  message: string;
  context?: {
    page: string;
    action: string;
    timestamp: string;
    userAgent: string;
    url: string;
  };
  metadata?: Record<string, any>;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface UserAction {
  id: string;
  action: string;
  category: 'navigation' | 'interaction' | 'error' | 'performance' | 'feature_usage';
  details: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  feedbackByType: Record<string, number>;
  recentActions: UserAction[];
  sessionDuration: number;
}

interface UseFeedbackOptions {
  enableTracking?: boolean;
  enableAutoFeedback?: boolean;
  trackingCategories?: string[];
  maxActionsPerSession?: number;
}

export function useUserFeedback(options: UseFeedbackOptions = {}) {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [actions, setActions] = useState<UserAction[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );
  const [sessionStartTime] = useState(() => Date.now());

  const {
    enableTracking = true,
    enableAutoFeedback = true,
    trackingCategories = ['navigation', 'interaction', 'error', 'feature_usage'],
    maxActionsPerSession = 100,
  } = options;

  // Load existing feedback and stats
  useEffect(() => {
    if (session?.user) {
      loadFeedbackData();
      loadStats();
    }
  }, [session]);

  // Auto-track page visibility changes
  useEffect(() => {
    if (!enableTracking) return;

    const handleVisibilityChange = () => {
      trackAction('page_visibility_change', 'navigation', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
      });
    };

    const handleBeforeUnload = () => {
      trackAction('page_unload', 'navigation', {
        sessionDuration: Date.now() - sessionStartTime,
        actionsCount: actions.length,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableTracking, actions.length, sessionStartTime]);

  const loadFeedbackData = async () => {
    try {
      const response = await fetch('/api/user/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/user/feedback/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const submitFeedback = useCallback(
    async (
      type: FeedbackEntry['type'],
      rating: number,
      message: string,
      metadata?: Record<string, any>
    ) => {
      try {
        setLoading(true);

        const feedbackEntry: Omit<FeedbackEntry, 'id' | 'status' | 'createdAt'> = {
          type,
          rating,
          message,
          context: {
            page: window.location.pathname,
            action: 'feedback_submission',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
          metadata,
        };

        const response = await fetch('/api/user/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackEntry),
        });

        if (response.ok) {
          const result = await response.json();
          setFeedback(prev => [result.feedback, ...prev]);
          toast.success('Feedback submitted successfully!');

          // Track the feedback submission
          trackAction('feedback_submitted', 'interaction', {
            type,
            rating,
            messageLength: message.length,
          });

          return result.feedback;
        } else {
          throw new Error('Failed to submit feedback');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        toast.error('Failed to submit feedback');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const trackAction = useCallback(
    (action: string, category: UserAction['category'], details: Record<string, any> = {}) => {
      if (!enableTracking || !trackingCategories.includes(category)) return;

      const userAction: UserAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        category,
        details: {
          ...details,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
          sessionId,
          userAgent: navigator.userAgent,
        },
        timestamp: new Date().toISOString(),
        sessionId,
        userId: session?.user?.id,
      };

      setActions(prev => {
        const newActions = [userAction, ...prev];
        // Keep only the most recent actions
        return newActions.slice(0, maxActionsPerSession);
      });

      // Send to analytics endpoint (fire and forget)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userAction),
      }).catch(error => {
        console.warn('Failed to track action:', error);
      });
    },
    [enableTracking, trackingCategories, sessionId, session?.user?.id, maxActionsPerSession]
  );

  const trackError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      trackAction('error_occurred', 'error', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        ...context,
      });
    },
    [trackAction]
  );

  const trackFeatureUsage = useCallback(
    (feature: string, details?: Record<string, any>) => {
      trackAction(`feature_${feature}`, 'feature_usage', {
        feature,
        ...details,
      });
    },
    [trackAction]
  );

  const trackPerformance = useCallback(
    (metric: string, value: number, context?: Record<string, any>) => {
      trackAction(`performance_${metric}`, 'performance', {
        metric,
        value,
        ...context,
      });
    },
    [trackAction]
  );

  const showFeedbackDialog = useCallback(() => {
    // This would trigger a feedback modal/dialog
    trackAction('feedback_dialog_opened', 'interaction', {
      trigger: 'manual',
    });
  }, [trackAction]);

  const getSessionStats = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartTime;
    const actionsByCategory = actions.reduce(
      (acc, action) => {
        acc[action.category] = (acc[action.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      sessionId,
      sessionDuration,
      actionsCount: actions.length,
      actionsByCategory,
      startTime: new Date(sessionStartTime).toISOString(),
    };
  }, [actions, sessionId, sessionStartTime]);

  // Auto-feedback triggers
  useEffect(() => {
    if (!enableAutoFeedback) return;

    const checkAutoFeedback = () => {
      const sessionStats = getSessionStats();

      // Trigger feedback after significant session activity
      if (sessionStats.actionsCount >= 20 && sessionStats.sessionDuration > 5 * 60 * 1000) {
        // Show feedback request after 5 minutes and 20 actions
        trackAction('auto_feedback_trigger', 'interaction', {
          trigger: 'session_activity',
          ...sessionStats,
        });
      }
    };

    const interval = setInterval(checkAutoFeedback, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [enableAutoFeedback, getSessionStats, trackAction]);

  return {
    // Feedback management
    feedback,
    submitFeedback,
    showFeedbackDialog,
    loading,
    stats,

    // Action tracking
    trackAction,
    trackError,
    trackFeatureUsage,
    trackPerformance,
    actions,

    // Session info
    sessionId,
    getSessionStats,

    // Utilities
    refreshData: () => {
      loadFeedbackData();
      loadStats();
    },
  };
}
