/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost', 
      ...(process.env.VERCEL_URL ? [process.env.VERCEL_URL] : []),
      ...(process.env.NEXT_PUBLIC_BASE_URL ? [new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname] : [])
    ],
    unoptimized: true
  },
  serverExternalPackages: ['@prisma/client'],
  eslint: {
    // Production: Allow warnings but block on errors
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  typescript: {
    // Production: TypeScript errors will block builds
    ignoreBuildErrors: false,
  },
  experimental: {
    // Reserved for future experimental features
  },
  
  // 🔒 SECURITY HEADERS CONFIGURATION
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.openai.com https://api.anthropic.com wss: ws:",
              "media-src 'self'",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          },
          
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          
          // Permissions Policy (Feature Policy)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()',
              'payment=()',
              'usb=()',
              'bluetooth=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()',
              'ambient-light-sensor=()',
              'autoplay=(self)',
              'encrypted-media=(self)',
              'picture-in-picture=(self)'
            ].join(', ')
          },
          
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          
          // Cross-Origin Policies
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          },
          
          // Remove server information
          {
            key: 'Server',
            value: ''
          },
          
          // Remove powered by header
          {
            key: 'X-Powered-By',
            value: ''
          }
        ]
      },
      
      // API-specific headers
      {
        source: '/api/(.*)',
        headers: [
          // CORS headers for API routes
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? (process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`)
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
          
          // API-specific security
          {
            key: 'X-API-Version',
            value: '1.0'
          },
          {
            key: 'X-RateLimit-Policy',
            value: 'enabled'
          }
        ]
      },
      
      // Admin panel specific headers
      {
        source: '/admin/(.*)',
        headers: [
          // Extra security for admin routes
          {
            key: 'X-Admin-Protection',
            value: 'enabled'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      },
      
      // Static assets caching
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      
      // Images and media caching
      {
        source: '/(.*\\.(?:jpg|jpeg|png|gif|ico|svg|webp))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400'
          }
        ]
      }
    ];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Build optimization
  compress: true,
  
  // Power additional security
  poweredByHeader: false,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // HTTP Keep-Alive
  httpAgentOptions: {
    keepAlive: true,
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Redirect HTTP to HTTPS in production
    async redirects() {
      return [
        {
          source: '/(.*)',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: `${process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`}/$1`,
          permanent: true,
        },
      ];
    },
    
    // Security rewrites for production
    async rewrites() {
      return [
        // Hide .well-known directory
        {
          source: '/.well-known/:path*',
          destination: '/404'
        },
        
        // Hide sensitive files
        {
          source: '/:file(\.env.*|\.git.*|\.DS_Store|Thumbs\.db)',
          destination: '/404'
        }
      ];
    }
  })
};

module.exports = nextConfig; 