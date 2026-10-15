import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { AppShell } from '@/components/AppShell';
import './globals.css';

// 한글 기본 폰트 Pretendard (DEC-010). npm 패키지의 파일을 빌드에 포함해 자체 호스팅한다
const pretendard = localFont({
  src: '../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
});

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
    <html lang="ko" data-theme="light" className={pretendard.variable}>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
