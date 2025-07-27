/**
 * 🧪 Agent Configuration Wizard Test Suite
 * Tests the core agent creation wizard functionality
 * Based on CODE_SITEMAP.md: AgentConfigurationWizard (2185 lines) - Main wizard
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import AgentConfigurationWizard from '../../../src/components/agents/AgentConfigurationWizard';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('../../../src/lib/permissions');
jest.mock('../../../src/hooks/useAgents');

const mockUseSession = {
  data: {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER'
    }
  },
  status: 'authenticated'
};

const mockUseAgents = {
  agents: [],
  isLoading: false,
  error: null,
  createAgent: jest.fn(),
  updateAgent: jest.fn(),
  deleteAgent: jest.fn()
};

describe('AgentConfigurationWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    require('next-auth/react').useSession.mockReturnValue(mockUseSession);
    require('../../../src/hooks/useAgents').useAgents.mockReturnValue(mockUseAgents);
  });

  describe('Wizard Initialization', () => {
    it('should render wizard in closed state initially', () => {
      render(<AgentConfigurationWizard />);
      
      // Should show create agent button
      expect(screen.getByRole('button', { name: /create new agent/i })).toBeInTheDocument();
      
      // Should not show wizard modal
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should open wizard when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      const createButton = screen.getByRole('button', { name: /create new agent/i });
      await user.click(createButton);
      
      // Should show wizard modal
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/agent configuration wizard/i)).toBeInTheDocument();
    });

    it('should show step 1 (Basic Information) initially', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Should show step 1 content
      expect(screen.getByText(/basic information/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
    });

    it('should navigate to next step when valid data is entered', async () => {
      const user = userEvent.setup();
      
      // Fill step 1 data
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      
      // Click next
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Should show step 2
      expect(screen.getByText(/ai model configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
    });

    it('should show validation errors when trying to proceed with invalid data', async () => {
      const user = userEvent.setup();
      
      // Try to proceed without filling required fields
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Should show validation errors
      expect(screen.getByText(/agent name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      
      // Should stay on step 1
      expect(screen.getByText(/basic information/i)).toBeInTheDocument();
    });

    it('should allow going back to previous step', async () => {
      const user = userEvent.setup();
      
      // Fill step 1 and navigate to step 2
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Go back to step 1
      await user.click(screen.getByRole('button', { name: /back/i }));
      
      // Should show step 1 again
      expect(screen.getByText(/basic information/i)).toBeInTheDocument();
      
      // Data should be preserved
      expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    });

    it('should show step progress indicator', async () => {
      render(<AgentConfigurationWizard />);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Should show progress indicator
      expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
      
      // Fill step 1 and navigate
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Should show step 2 progress
      expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();
    });
  });

  describe('Step Content Validation', () => {
    it('should validate AI model configuration in step 2', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      // Navigate to step 2
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Test invalid temperature
      const temperatureInput = screen.getByLabelText(/temperature/i);
      await user.clear(temperatureInput);
      await user.type(temperatureInput, '3.0'); // Invalid: > 2.0
      
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Should show validation error
      expect(screen.getByText(/temperature must be between 0 and 2/i)).toBeInTheDocument();
    });

    it('should validate knowledge base configuration in step 4', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      // Navigate through steps to step 4
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Fill basic info
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Skip model config (default values)
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Skip prompts config
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Now at knowledge base step
      expect(screen.getByText(/knowledge base/i)).toBeInTheDocument();
      
      // Enable knowledge base
      const enableCheckbox = screen.getByLabelText(/enable knowledge base/i);
      await user.click(enableCheckbox);
      
      // Should show knowledge base options
      expect(screen.getByText(/max documents/i)).toBeInTheDocument();
      expect(screen.getByText(/search strategy/i)).toBeInTheDocument();
    });
  });

  describe('Google Integration Configuration', () => {
    it('should handle Google integration setup in step 5', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      // Navigate to step 5 (Google Integration)
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Navigate through previous steps
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
      }
      
      // Should show Google integration options
      expect(screen.getByText(/google integration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enable google integration/i)).toBeInTheDocument();
    });

    it('should show warning when Google integration is enabled but no account connected', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      // Navigate to Google integration step
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
      }
      
      // Enable Google integration
      await user.click(screen.getByLabelText(/enable google integration/i));
      
      // Should show warning about no connected account
      expect(screen.getByText(/no google account connected/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /connect google account/i })).toBeInTheDocument();
    });
  });

  describe('Agent Creation', () => {
    it('should create agent successfully when all steps are completed', async () => {
      const user = userEvent.setup();
      
      // Mock successful creation
      mockUseAgents.createAgent.mockResolvedValue({
        id: 'new-agent-id',
        name: 'Test Agent',
        description: 'Test Description'
      });
      
      render(<AgentConfigurationWizard />);
      
      // Complete wizard
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Step 1: Basic Info
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Skip through remaining steps with default values
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
      }
      
      // Final step - create agent
      await user.click(screen.getByRole('button', { name: /create agent/i }));
      
      // Should call createAgent
      await waitFor(() => {
        expect(mockUseAgents.createAgent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Agent',
            description: 'Test Description'
          })
        );
      });
    });

    it('should handle creation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock creation error
      mockUseAgents.createAgent.mockRejectedValue(new Error('Creation failed'));
      
      render(<AgentConfigurationWizard />);
      
      // Complete wizard
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
      }
      
      await user.click(screen.getByRole('button', { name: /create agent/i }));
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
      });
    });

    it('should show success message and close wizard after successful creation', async () => {
      const user = userEvent.setup();
      
      mockUseAgents.createAgent.mockResolvedValue({
        id: 'new-agent-id',
        name: 'Test Agent'
      });
      
      render(<AgentConfigurationWizard />);
      
      // Complete wizard flow
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      await user.type(screen.getByLabelText(/agent name/i), 'Test Agent');
      await user.type(screen.getByLabelText(/description/i), 'Test Description');
      
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }));
      }
      
      await user.click(screen.getByRole('button', { name: /create agent/i }));
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/agent created successfully/i)).toBeInTheDocument();
      });
      
      // Wizard should close after a delay
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Wizard Persistence', () => {
    it('should preserve data when switching between steps', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Fill step 1
      await user.type(screen.getByLabelText(/agent name/i), 'Persistent Agent');
      await user.type(screen.getByLabelText(/description/i), 'Persistent Description');
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Navigate to step 3 and back
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /back/i }));
      await user.click(screen.getByRole('button', { name: /back/i }));
      
      // Data should be preserved
      expect(screen.getByDisplayValue('Persistent Agent')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Persistent Description')).toBeInTheDocument();
    });

    it('should reset wizard data when closed and reopened', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      // Open wizard and fill data
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      await user.type(screen.getByLabelText(/agent name/i), 'Temporary Agent');
      
      // Close wizard
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      // Reopen wizard
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Data should be reset
      expect(screen.getByLabelText(/agent name/i)).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      await user.click(screen.getByRole('button', { name: /create new agent/i }));
      
      // Dialog should have proper role
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Form elements should have labels
      expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      
      // Navigation buttons should have accessible names
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<AgentConfigurationWizard />);
      
      // Tab to create button and activate
      await user.tab();
      await user.keyboard('{Enter}');
      
      // Should open wizard
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Should be able to tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/agent name/i)).toHaveFocus();
    });
  });
}); 