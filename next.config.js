/**
 * AUREUS SOCIAL PRO — next.config.js
 * 
 * AJOUTE:
 * - Security headers (CSP, X-Frame-Options, HSTS...)
 * - Bundle analyzer (optionnel)
 * - Optimisations build
 * 
 * Destination: next.config.js (racine du projet)
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // ─── Headers de sécurité sur toutes les routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Anti-clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          
          // Prévenir MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          
          // HSTS — HTTPS forcé 1 an
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          
          // Permissions policy — désactiver features inutilisées
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline + Supabase
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval requis par Next.js dev
              // Styles: self + inline (Tailwind/CSS-in-JS)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + data URIs + Supabase storage
              "img-src 'self' data: blob: https://*.supabase.co https://supabase.com",
              // Connexions: self + Supabase + Anthropic API
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.kbo.be`,
              // Frames: aucun
              "frame-src 'none'",
              // Objects: aucun
              "object-src 'none'",
              // Base URI: self uniquement
              "base-uri 'self'",
              // Form action: self
              "form-action 'self'",
            ].join('; ')
          },
          
          // X-XSS-Protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      
      // Headers spécifiques API
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // ─── Optimisations bundle
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      'lucide-react',
      'recharts',
    ],
  },

  // ─── Compression
  compress: true,

  // ─── Images optimisées
  images: {
    domains: ['qcunxnadjxggizdksvay.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // ─── Variables d'env exposées au client (whitelist explicite)
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },

  // ─── Redirection www → non-www
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [{ type: 'host', value: 'www.app.aureussocial.be' }],
        destination: 'https://app.aureussocial.be/:path*',
        permanent: true,
      },
    ];
  },

  // ─── Webpack : supprimer les console.log en production
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Remplacer console.log/debug par des no-ops en prod
      config.optimization.minimizer?.forEach(minimizer => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              ...minimizer.options.terserOptions?.compress,
              drop_console: true,      // Supprime console.log
              drop_debugger: true,     // Supprime debugger
              pure_funcs: ['console.debug', 'console.info'],
            },
          };
        }
      });
    }
    return config;
  },
};

module.exports = nextConfig;
