import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';

export const metadata: Metadata = { title: '프로그램 현황' };

// 데이터는 브라우저에서 API-001·002로 읽는다 (서버에서 5분 캐시). 주소 쿼리를 읽으므로 Suspense로 감싼다
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-44 animate-pulse rounded-lg bg-subtle" aria-busy="true" aria-label="불러오는 중" />}>
      <Dashboard />
    </Suspense>
  );
}
