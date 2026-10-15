import type { NextConfig } from 'next';

// 나눔터 주소만 화면 삽입(iframe)을 허용한다 (FN-005, 06.development-plan §6)
const TOOL_HUB_ORIGIN = 'https://mkgreeme-web.github.io';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [`frame-src ${TOOL_HUB_ORIGIN}`, "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"].join('; '),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
