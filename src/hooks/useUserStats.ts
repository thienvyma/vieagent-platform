import { useState, useEffect } from 'react';

interface UserStats {
  usage: {
    percentage: number;
    plan: string;
  };
}

interface UserStatsHook {
  userStats: UserStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserStats(): UserStatsHook {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUserStats({
            usage: {
              percentage: data.data.usage.percentage,
              plan: data.data.usage.plan,
            },
          });
        }
      } else {
        throw new Error('Failed to fetch user stats');
      }
    } catch (err) {
      console.error('Error loading user stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  return {
    userStats,
    loading,
    error,
    refetch: fetchUserStats,
  };
}
