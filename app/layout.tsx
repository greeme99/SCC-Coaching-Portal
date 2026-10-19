import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
// 한글 기본 폰트 Pretendard (DEC-010). npm 패키지의 파일을 빌드에 포함해 자체 호스팅한다
// 통짜 파일(2MB)은 휴대폰에서 첫 화면을 크게 늦춰서(LCP 약 12초, TC-050) 글자 범위별로 나뉜 파일을 쓴다 — 화면에 쓰인 글자 묶음만 내려받는다
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '삼코동 코칭 포털', template: '%s · 삼코동 코칭 포털' },
  description: '삼코동 코치의 다회기 코칭 가이드·기록·진행 현황',
  // 비밀번호로 보호하는 내부용 사이트 — 검색 노출 차단
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" data-theme="light">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
