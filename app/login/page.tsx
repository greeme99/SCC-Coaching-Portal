import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = { title: '입장하기' };

type SearchParams = Promise<{ next?: string | string[]; error?: string | string[] }>;

// 첫 접속 화면 (SCR-012, DEC-029): 공용 비밀번호 하나로 입장한다. 이름·계정은 받지 않는다 (CLAUDE.md §7)
export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-base px-4 py-10">
      <section className="w-full max-w-md rounded-lg bg-surface p-8 shadow-card">
        <Image
          src="/brand/samkodong-logo-original.svg"
          alt="삼코동 Samsung Coaching Club"
          width={114}
          height={40}
          priority
          className="h-10 w-auto"
        />
        <h1 className="mt-6 break-keep text-h1 text-main">삼코동 코칭 포털에 오신 것을 환영합니다</h1>
        <p className="mt-2 text-body">코치 전용 공간 접속하기</p>
        {/* 주소의 next·error는 요청 시점에 서버에서 채운다 — 화면이 다 뜨기 전에 눌러도 돌아갈 주소가 빠지지 않게 */}
        <Suspense fallback={<LoginForm next="" error={false} />}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
        <p className="mt-6 text-center text-caption text-muted">코치 전용 공간입니다. 비밀번호는 운영진에게 문의하세요.</p>
      </section>
    </div>
  );
}

async function LoginFormWithParams({ searchParams }: { searchParams: SearchParams }) {
  const { next, error } = await searchParams;
  return <LoginForm next={typeof next === 'string' ? next : ''} error={error === '1'} />;
}
