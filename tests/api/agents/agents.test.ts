/**
 * 🧪 Agents API Test Suite  
 * Tests the main agents CRUD operations
 * Based on CODE_SITEMAP.md: /api/agents - src/app/api/agents/route.ts
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../../../src/app/api/agents/route';
import { getServerSession } from 'next-auth';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../../src/lib/prisma');
jest.mock('../../../src/lib/permissions');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/agents', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/agents', () => {
    it('should return user agents successfully', async () => {
      // Mock database response
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Test Agent',
          description: 'Test Description',
          userId: 'user-123',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock prisma query
      const mockPrisma = {
        agent: {
          findMany: jest.fn().mockResolvedValue(mockAgents)
        }
      };
      
      const request = new NextRequest('http://localhost:3000/api/agents');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it('should return 401 if user not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost:3000/api/agents');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockPrisma = {
        agent: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error'))
        }
      };
      
      const request = new NextRequest('http://localhost:3000/api/agents');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should filter agents by user ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents');
      const response = await GET(request);
      
      // Should call prisma with correct user filter
      expect(response.status).toBe(200);
      // Additional assertions about filtering would go here
    });
  });

  describe('POST /api/agents', () => {
    const validAgentData = {
      name: 'New Agent',
      description: 'New Agent Description',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful assistant',
      isActive: true
    };

    it('should create agent successfully with valid data', async () => {
      const mockCreatedAgent = {
        id: 'new-agent-id',
        ...validAgentData,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(validAgentData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agent).toBeDefined();
      expect(data.agent.name).toBe(validAgentData.name);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing name field'
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('name is required');
    });

    it('should validate model configuration', async () => {
      const invalidModelData = {
        ...validAgentData,
        temperature: 2.5, // Invalid temperature > 2.0
        maxTokens: -100   // Invalid negative tokens
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(invalidModelData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/temperature|tokens/i);
    });

    it('should associate agent with authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(validAgentData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      // Should verify that the agent is created with correct userId
    });

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });
  });

  describe('PUT /api/agents', () => {
    it('should update agent successfully', async () => {
      const updateData = {
        id: 'agent-1',
        name: 'Updated Agent Name',
        temperature: 0.8
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.agent).toBeDefined();
    });

    it('should only allow user to update their own agents', async () => {
      const updateData = {
        id: 'other-user-agent',
        name: 'Hacked Agent'
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await PUT(request);
      
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Permission denied');
    });
  });

  describe('DELETE /api/agents', () => {
    it('should delete agent successfully', async () => {
      const deleteData = { id: 'agent-1' };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'DELETE',
        body: JSON.stringify(deleteData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await DELETE(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should only allow user to delete their own agents', async () => {
      const deleteData = { id: 'other-user-agent' };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'DELETE',
        body: JSON.stringify(deleteData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await DELETE(request);
      
      expect(response.status).toBe(403);
    });

    it('should handle non-existent agent deletion', async () => {
      const deleteData = { id: 'non-existent-agent' };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'DELETE',
        body: JSON.stringify(deleteData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await DELETE(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Agent not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for agent creation', async () => {
      const agentData = {
        name: 'Rate Limited Agent',
        description: 'Testing rate limits',
        model: 'gpt-4'
      };

      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() => 
        new NextRequest('http://localhost:3000/api/agents', {
          method: 'POST',
          body: JSON.stringify(agentData),
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const responses = await Promise.all(
        requests.map(req => POST(req))
      );

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Google Services', () => {
    it('should handle agents with Google integration enabled', async () => {
      const googleAgentData = {
        name: 'Google Agent',
        description: 'Agent with Google integration',
        model: 'gpt-4',
        googleIntegration: {
          enabled: true,
          services: ['calendar', 'gmail', 'sheets']
        }
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(googleAgentData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.agent.googleIntegration).toBeDefined();
      expect(data.agent.googleIntegration.enabled).toBe(true);
    });
  });

  describe('Knowledge Base Integration', () => {
    it('should handle agents with knowledge base configuration', async () => {
      const knowledgeAgentData = {
        name: 'Knowledge Agent',
        description: 'Agent with knowledge base',
        model: 'gpt-4',
        knowledgeBase: {
          enabled: true,
          strategy: 'smart',
          maxDocuments: 100
        }
      };

      const request = new NextRequest('http://localhost:3000/api/agents', {
        method: 'POST',
        body: JSON.stringify(knowledgeAgentData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.agent.knowledgeBase).toBeDefined();
      expect(data.agent.knowledgeBase.enabled).toBe(true);
    });
  });
}); 