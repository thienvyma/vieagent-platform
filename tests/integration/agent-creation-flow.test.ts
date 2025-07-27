/**
 * 🧪 Agent Creation Flow Integration Test
 * Tests the complete end-to-end agent creation workflow
 * Based on CODE_SITEMAP.md integration flows
 */

import { jest } from '@jest/globals';

// Mock all external dependencies
jest.mock('next-auth/react');
jest.mock('../../src/lib/prisma');
jest.mock('../../src/lib/vector-knowledge-service');
jest.mock('../../src/lib/google/calendar');

describe('Agent Creation Flow Integration', () => {
  let mockPrisma: any;
  let mockVectorService: any;
  let mockGoogleCalendar: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup prisma mock
    mockPrisma = {
      agent: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: 'USER'
        })
      },
      document: {
        findMany: jest.fn().mockResolvedValue([])
      },
      googleAccount: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };

    // Setup vector service mock
    mockVectorService = {
      createCollection: jest.fn().mockResolvedValue('collection-id'),
      addDocuments: jest.fn().mockResolvedValue(true),
      search: jest.fn().mockResolvedValue([])
    };

    // Setup Google service mock
    mockGoogleCalendar = {
      listEvents: jest.fn().mockResolvedValue([]),
      createEvent: jest.fn().mockResolvedValue({ id: 'event-123' })
    };

    require('../../src/lib/prisma').default = mockPrisma;
    require('../../src/lib/vector-knowledge-service').VectorKnowledgeService = mockVectorService;
    require('../../src/lib/google/calendar').GoogleCalendarService = mockGoogleCalendar;
  });

  describe('Complete Agent Creation Workflow', () => {
    it('should create agent with basic configuration successfully', async () => {
      // Mock successful agent creation
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        description: 'Test Description',
        userId: 'user-123',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a helpful assistant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.agent.create.mockResolvedValue(mockAgent);

      // Simulate wizard flow
      const agentData = {
        name: 'Test Agent',
        description: 'Test Description',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a helpful assistant',
        knowledgeBase: { enabled: false },
        googleIntegration: { enabled: false }
      };

      // Test API endpoint
      const createAgentResponse = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      // Verify agent creation
      expect(mockPrisma.agent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Agent',
          description: 'Test Description',
          userId: 'user-123',
          model: 'gpt-4'
        })
      });

      // Verify response
      expect(createAgentResponse.status).toBe(201);
      const responseData = await createAgentResponse.json();
      expect(responseData.success).toBe(true);
      expect(responseData.agent.id).toBe('agent-123');
    });

    it('should create agent with knowledge base integration', async () => {
      // Setup mock documents
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Test Document',
          content: 'Test content',
          userId: 'user-123'
        }
      ];

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
      mockVectorService.createCollection.mockResolvedValue('knowledge-collection-123');

      const agentDataWithKnowledge = {
        name: 'Knowledge Agent',
        description: 'Agent with knowledge base',
        model: 'gpt-4',
        knowledgeBase: {
          enabled: true,
          maxDocuments: 50,
          strategy: 'smart'
        },
        googleIntegration: { enabled: false }
      };

      // Create agent
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentDataWithKnowledge)
      });

      // Verify knowledge base setup
      expect(mockVectorService.createCollection).toHaveBeenCalledWith(
        expect.stringContaining('knowledge-agent')
      );

      expect(mockPrisma.agent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          knowledgeBase: expect.objectContaining({
            enabled: true,
            collectionId: 'knowledge-collection-123'
          })
        })
      });
    });

    it('should create agent with Google integration', async () => {
      // Mock connected Google account
      const mockGoogleAccount = {
        id: 'google-123',
        userId: 'user-123',
        email: 'test@gmail.com',
        accessToken: 'token-123',
        refreshToken: 'refresh-123'
      };

      mockPrisma.googleAccount.findFirst.mockResolvedValue(mockGoogleAccount);

      const agentDataWithGoogle = {
        name: 'Google Agent',
        description: 'Agent with Google integration',
        model: 'gpt-4',
        knowledgeBase: { enabled: false },
        googleIntegration: {
          enabled: true,
          services: ['calendar', 'gmail'],
          permissions: ['read', 'write']
        }
      };

      // Create agent
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentDataWithGoogle)
      });

      // Verify Google integration setup
      expect(mockPrisma.agent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          googleIntegration: expect.objectContaining({
            enabled: true,
            accountId: 'google-123',
            services: ['calendar', 'gmail']
          })
        })
      });
    });

    it('should handle agent creation with both knowledge base and Google integration', async () => {
      // Setup mocks for both integrations
      const mockDocuments = [
        { id: 'doc-1', title: 'Doc 1', content: 'Content 1', userId: 'user-123' }
      ];
      const mockGoogleAccount = {
        id: 'google-123',
        userId: 'user-123',
        email: 'test@gmail.com'
      };

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
      mockPrisma.googleAccount.findFirst.mockResolvedValue(mockGoogleAccount);
      mockVectorService.createCollection.mockResolvedValue('full-collection-123');

      const fullAgentData = {
        name: 'Full Integration Agent',
        description: 'Agent with all features',
        model: 'gpt-4',
        knowledgeBase: {
          enabled: true,
          maxDocuments: 100,
          strategy: 'auto'
        },
        googleIntegration: {
          enabled: true,
          services: ['calendar', 'gmail', 'sheets'],
          permissions: ['read', 'write']
        }
      };

      // Create agent
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullAgentData)
      });

      // Verify both integrations
      expect(mockVectorService.createCollection).toHaveBeenCalled();
      expect(mockPrisma.agent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          knowledgeBase: expect.objectContaining({ enabled: true }),
          googleIntegration: expect.objectContaining({ enabled: true })
        })
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Agent Testing and Validation', () => {
    it('should validate agent after creation', async () => {
      const mockAgent = {
        id: 'agent-test-123',
        name: 'Test Agent',
        model: 'gpt-4',
        userId: 'user-123'
      };

      mockPrisma.agent.findUnique.mockResolvedValue(mockAgent);

      // Test agent functionality
      const testResponse = await fetch('/api/agents/agent-test-123/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello, test message'
        })
      });

      expect(testResponse.status).toBe(200);
      
      const testData = await testResponse.json();
      expect(testData.success).toBe(true);
      expect(testData.response).toBeDefined();
    });

    it('should test agent with knowledge base queries', async () => {
      const mockAgent = {
        id: 'knowledge-agent-123',
        knowledgeBase: { enabled: true, collectionId: 'collection-123' }
      };

      mockPrisma.agent.findUnique.mockResolvedValue(mockAgent);
      mockVectorService.search.mockResolvedValue([
        {
          content: 'Relevant document content',
          metadata: { title: 'Test Document' },
          score: 0.95
        }
      ]);

      // Test knowledge-enhanced query
      const knowledgeResponse = await fetch('/api/agents/knowledge-agent-123/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What do you know about the test topic?'
        })
      });

      expect(mockVectorService.search).toHaveBeenCalledWith(
        'collection-123',
        expect.stringContaining('test topic'),
        expect.any(Number)
      );

      expect(knowledgeResponse.status).toBe(200);
    });

    it('should test agent with Google Calendar integration', async () => {
      const mockAgent = {
        id: 'google-agent-123',
        googleIntegration: { 
          enabled: true, 
          accountId: 'google-123',
          services: ['calendar']
        }
      };

      mockPrisma.agent.findUnique.mockResolvedValue(mockAgent);
      mockGoogleCalendar.listEvents.mockResolvedValue([
        {
          id: 'event-1',
          summary: 'Test Meeting',
          start: { dateTime: '2024-01-15T10:00:00Z' }
        }
      ]);

      // Test Google Calendar query
      const calendarResponse = await fetch('/api/agents/google-agent-123/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What meetings do I have today?'
        })
      });

      expect(mockGoogleCalendar.listEvents).toHaveBeenCalled();
      expect(calendarResponse.status).toBe(200);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors during agent creation', async () => {
      mockPrisma.agent.create.mockRejectedValue(new Error('Database connection failed'));

      const agentData = {
        name: 'Error Test Agent',
        description: 'Testing error handling',
        model: 'gpt-4'
      };

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      expect(response.status).toBe(500);
      
      const errorData = await response.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error).toContain('Database connection failed');
    });

    it('should handle vector service failures gracefully', async () => {
      mockVectorService.createCollection.mockRejectedValue(new Error('Vector service unavailable'));

      const agentData = {
        name: 'Vector Error Agent',
        knowledgeBase: { enabled: true }
      };

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      // Should create agent but disable knowledge base
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.warnings).toContain('Knowledge base could not be initialized');
    });

    it('should handle Google API failures', async () => {
      mockGoogleCalendar.listEvents.mockRejectedValue(new Error('Google API rate limit'));

      const agentData = {
        name: 'Google Error Agent',
        googleIntegration: { 
          enabled: true,
          services: ['calendar']
        }
      };

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      // Should create agent but show Google warnings
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.warnings).toContain('Google Calendar service validation failed');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple agent creations concurrently', async () => {
      const agentPromises = Array(5).fill(null).map((_, index) => 
        fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Concurrent Agent ${index}`,
            description: `Agent created concurrently`,
            model: 'gpt-4'
          })
        })
      );

      const responses = await Promise.all(agentPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Database should have been called 5 times
      expect(mockPrisma.agent.create).toHaveBeenCalledTimes(5);
    });

    it('should complete agent creation within performance bounds', async () => {
      const startTime = performance.now();

      const agentData = {
        name: 'Performance Test Agent',
        description: 'Testing creation performance',
        model: 'gpt-4',
        knowledgeBase: { enabled: true },
        googleIntegration: { enabled: true }
      };

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Security and Permissions', () => {
    it('should prevent unauthorized agent creation', async () => {
      // Mock unauthenticated user
      require('next-auth/react').useSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      });

      const agentData = {
        name: 'Unauthorized Agent',
        model: 'gpt-4'
      };

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      expect(response.status).toBe(401);
    });

    it('should validate user permissions for Google integration', async () => {
      mockPrisma.googleAccount.findFirst.mockResolvedValue(null);

      const agentData = {
        name: 'Google Permission Agent',
        googleIntegration: { 
          enabled: true,
          services: ['calendar']
        }
      };

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      // Should create agent but warn about missing Google account
      expect(response.status).toBe(201);
      
      const responseData = await response.json();
      expect(responseData.warnings).toContain('No Google account connected');
    });
  });
}); 