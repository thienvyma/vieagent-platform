import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: string;
  isPublic: boolean;
  knowledgeFiles: string[];
  messageDelayMs?: number;
  enableSmartDelay?: boolean;
  maxDelayMs?: number;
  minDelayMs?: number;
  enableVietnameseMode?: boolean;
  enableAutoHandover?: boolean;
  // ✅ FIXED IN Phase 4A.2 - Replace any types with more specific types
  handoverTriggers?: Record<string, unknown>;
  handoverThresholds?: Record<string, unknown>;
  handoverTimeoutMinutes?: number;
  enableGoogleIntegration?: boolean;
  // ✅ FIXED IN Phase 4A.2 - Replace any type with more specific type
  googleServices?: Record<string, unknown>;
  smartSchedulingDuration?: number;
  createdAt: string;
  _count: {
    conversations: number;
  };
}

interface AgentsHook {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgents(): AgentsHook {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/agents');
      if (response.ok) {
        const agentsData = await response.json();
        setAgents(agentsData);
      } else {
        throw new Error('Failed to fetch agents');
      }
    } catch (err) {
      console.error('Error loading agents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
  };
}
