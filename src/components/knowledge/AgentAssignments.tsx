'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'active' | 'inactive';
  knowledgeCount: number;
  lastActive: string;
}

interface KnowledgeAssignment {
  id: string;
  agentId: string;
  knowledgeItemId: string;
  permissions: {
    read: boolean;
    search: boolean;
    summarize: boolean;
    reference: boolean;
  };
  priority: 'high' | 'medium' | 'low';
  assignedAt: string;
  assignedBy: string;
}

interface AgentAssignmentsProps {
  knowledgeItemId: string;
  onClose: () => void;
}

export default function AgentAssignments({ knowledgeItemId, onClose }: AgentAssignmentsProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assignments, setAssignments] = useState<KnowledgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [permissions, setPermissions] = useState({
    read: true,
    search: true,
    summarize: false,
    reference: false,
  });
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    fetchAgents();
    fetchAssignments();
  }, [knowledgeItemId]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');

      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/knowledge/${knowledgeItemId}/assignments`);
      if (!response.ok) throw new Error('Failed to fetch assignments');

      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    try {
      const response = await fetch(`/api/knowledge/${knowledgeItemId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent,
          permissions,
          priority,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign agent');

      const newAssignment = await response.json();
      setAssignments(prev => [...prev, newAssignment]);

      // Reset form
      setSelectedAgent('');
      setPermissions({
        read: true,
        search: true,
        summarize: false,
        reference: false,
      });
      setPriority('medium');

      toast.success('Agent assigned successfully');
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    }
  };

  const handleUnassignAgent = async (assignmentId: string) => {
    try {
      const response = await fetch(
        `/api/knowledge/${knowledgeItemId}/assignments/${assignmentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to unassign agent');

      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      toast.success('Agent unassigned successfully');
    } catch (error) {
      console.error('Error unassigning agent:', error);
      toast.error('Failed to unassign agent');
    }
  };

  const handleUpdatePermissions = async (assignmentId: string, newPermissions: any) => {
    try {
      const response = await fetch(
        `/api/knowledge/${knowledgeItemId}/assignments/${assignmentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permissions: newPermissions,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update permissions');

      setAssignments(prev =>
        prev.map(a => (a.id === assignmentId ? { ...a, permissions: newPermissions } : a))
      );
      toast.success('Permissions updated successfully');
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-400/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'low':
        return 'text-green-400 bg-green-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/20';
      case 'inactive':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
        <div className='bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4'>
          <div className='flex items-center space-x-3'>
            <div className='animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent'></div>
            <span className='text-white'>Loading agent assignments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-white/10'>
          <div>
            <h2 className='text-2xl font-bold text-white'>Agent Assignments</h2>
            <p className='text-gray-400'>Manage which agents can access this knowledge item</p>
          </div>
          <button onClick={onClose} className='text-gray-400 hover:text-white transition-colors'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
          {/* Assign New Agent */}
          <div className='bg-white/5 rounded-xl p-6 border border-white/10 mb-6'>
            <h3 className='text-lg font-semibold text-white mb-4'>Assign New Agent</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Agent Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Select Agent</label>
                <select
                  value={selectedAgent}
                  onChange={e => setSelectedAgent(e.target.value)}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
                >
                  <option value=''>Choose an agent...</option>
                  {agents
                    .filter(agent => !assignments.some(a => a.agentId === agent.id))
                    .map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.model})
                      </option>
                    ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className='w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500'
                >
                  <option value='low'>Low</option>
                  <option value='medium'>Medium</option>
                  <option value='high'>High</option>
                </select>
              </div>
            </div>

            {/* Permissions */}
            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-300 mb-2'>Permissions</label>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {Object.entries(permissions).map(([key, value]) => (
                  <label key={key} className='flex items-center space-x-2 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={value}
                      onChange={e =>
                        setPermissions(prev => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                    />
                    <span className='text-sm text-gray-300 capitalize'>{key}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assign Button */}
            <div className='mt-6'>
              <button
                onClick={handleAssignAgent}
                disabled={!selectedAgent}
                className='bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                Assign Agent
              </button>
            </div>
          </div>

          {/* Current Assignments */}
          <div className='bg-white/5 rounded-xl p-6 border border-white/10'>
            <h3 className='text-lg font-semibold text-white mb-4'>Current Assignments</h3>

            {assignments.length === 0 ? (
              <p className='text-gray-400 text-center py-8'>
                No agents assigned to this knowledge item yet.
              </p>
            ) : (
              <div className='space-y-4'>
                {assignments.map(assignment => {
                  const agent = agents.find(a => a.id === assignment.agentId);
                  return (
                    <div
                      key={assignment.id}
                      className='bg-white/5 rounded-lg p-4 border border-white/10'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center space-x-3'>
                          <div>
                            <h4 className='font-medium text-white'>
                              {agent?.name || 'Unknown Agent'}
                            </h4>
                            <p className='text-sm text-gray-400'>
                              {agent?.model || 'Unknown Model'}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getAgentStatusColor(agent?.status || 'inactive')}`}
                          >
                            {agent?.status || 'inactive'}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(assignment.priority)}`}
                          >
                            {assignment.priority}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUnassignAgent(assignment.id)}
                          className='text-red-400 hover:text-red-300 transition-colors'
                          title='Unassign agent'
                        >
                          <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Permissions */}
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        {Object.entries(assignment.permissions).map(([key, value]) => (
                          <label key={key} className='flex items-center space-x-2 cursor-pointer'>
                            <input
                              type='checkbox'
                              checked={value}
                              onChange={e =>
                                handleUpdatePermissions(assignment.id, {
                                  ...assignment.permissions,
                                  [key]: e.target.checked,
                                })
                              }
                              className='w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500'
                            />
                            <span className='text-sm text-gray-300 capitalize'>{key}</span>
                          </label>
                        ))}
                      </div>

                      {/* Assignment Info */}
                      <div className='mt-3 text-xs text-gray-400'>
                        Assigned on {new Date(assignment.assignedAt).toLocaleDateString()} by{' '}
                        {assignment.assignedBy}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
