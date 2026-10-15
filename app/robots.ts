import type { MetadataRoute } from 'next';

// 내부용 사이트: 모든 검색 로봇 차단
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } };
}
