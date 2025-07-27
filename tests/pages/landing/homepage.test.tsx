/**
 * 🧪 Homepage Test Suite
 * Tests the main landing page functionality
 * Based on CODE_SITEMAP.md: Route "/" - src/app/page.tsx
 */

import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import HomePage from '../../../src/app/page';

// Mock the API call
global.fetch = jest.fn();

describe('Homepage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render the main hero section', async () => {
      // Mock API response for featured content
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // Check for main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for CTA buttons
      expect(screen.getByText(/bắt đầu ngay/i)).toBeInTheDocument();
      expect(screen.getByText(/xem tính năng/i)).toBeInTheDocument();
    });

    it('should render feature cards section', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // Check for feature cards
      expect(screen.getByText(/ai agents thông minh/i)).toBeInTheDocument();
      expect(screen.getByText(/google workspace/i)).toBeInTheDocument();
      expect(screen.getByText(/knowledge base/i)).toBeInTheDocument();
    });

    it('should render stats section', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // Check for stats
      expect(screen.getByText(/10,000\+/)).toBeInTheDocument();
      expect(screen.getByText(/99\.9%/)).toBeInTheDocument();
      expect(screen.getByText(/24\/7/)).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should call featured content API on load', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [
            {
              id: '1',
              title: 'Test Blog',
              excerpt: 'Test excerpt',
              slug: 'test-blog',
              viewCount: 100,
              categories: ['AI'],
              author: { name: 'Test Author' }
            }
          ],
          testimonials: [
            {
              id: '1',
              title: 'Great Platform',
              content: 'Amazing service',
              author: 'Test User'
            }
          ],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // Wait for API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/featured-content');
      });
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<HomePage />);
      
      // Should not crash and show fallback content
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display blog posts when API returns data', async () => {
      const mockBlogs = [
        {
          id: '1',
          title: 'AI Agents for Business',
          excerpt: 'Learn how AI agents can transform your business',
          slug: 'ai-agents-business',
          viewCount: 1500,
          categories: ['AI', 'Business'],
          author: { name: 'VIEAgent Team' }
        }
      ];

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: mockBlogs,
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByText('AI Agents for Business')).toBeInTheDocument();
        expect(screen.getByText('Learn how AI agents can transform your business')).toBeInTheDocument();
        expect(screen.getByText('1,500 lượt xem')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have working navigation links', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // Check navigation links
      expect(screen.getByRole('link', { name: /trang chủ/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /blog/i })).toHaveAttribute('href', '/blog');
      expect(screen.getByRole('link', { name: /pricing/i })).toHaveAttribute('href', '/pricing');
      expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact');
    });

    it('should have working CTA buttons', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // Check CTA buttons
      expect(screen.getByRole('link', { name: /bắt đầu ngay/i })).toHaveAttribute('href', '/register');
      expect(screen.getByRole('link', { name: /đăng nhập/i })).toHaveAttribute('href', '/login');
    });
  });

  describe('Responsive Design', () => {
    it('should be mobile responsive', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HomePage />);
      
      // Should render without issues on mobile
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('SEO and Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // Check heading hierarchy
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should have alt text for images', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      // All images should have alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('Performance', () => {
    it('should load efficiently', async () => {
      const startTime = performance.now();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          blogs: [],
          testimonials: [],
          announcements: []
        })
      });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
    });
  });
}); 