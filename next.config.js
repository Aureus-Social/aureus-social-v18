/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // ─── Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.kbo.be https://ec.europa.eu https://open.fts.be https://entreprises.api.gouv.be https://cbsv.economie.fgov.be https://api.kbodata.be https://ipapi.co https://api.ipify.org https://api.github.com",
              "frame-src 'none'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join('; ')
          },
        ],
      },
    ];
  },

  // ─── Images (Next.js 15 syntax)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qcunxnadjxggizdksvay.supabase.co',
      },
    ],
  },

  // ─── Compression
  compress: true,

  // ─── Webpack : drop console.log en prod
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.minimizer?.forEach(minimizer => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              ...minimizer.options.terserOptions?.compress,
              drop_console: true,
              drop_debugger: true,
            },
          };
        }
      });
    }
    return config;
  },
};

module.exports = nextConfig;
