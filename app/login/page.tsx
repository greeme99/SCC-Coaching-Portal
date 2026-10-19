import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { JourneyIllustration } from '@/components/JourneyIllustration';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = { title: '입장하기' };

type SearchParams = Promise<{ next?: string | string[]; error?: string | string[] }>;

// 코칭 여정 3단계 — 포털 기능(가이드 → 일지 → 종료 리포트·소감)을 그대로 소개한다
const STEPS = [
  { title: '코칭 전, 준비', body: '회기별 목적과 질문, 시간 흐름을 코칭 가이드에서 미리 살핍니다.' },
  { title: '회기와 회기 사이', body: '대화 뒤에는 코칭일지를 남기고, 고객은 작은 실험으로 방향을 확인합니다.' },
  { title: '마치며, 성찰', body: '종료 리포트와 종료소감으로 과정을 돌아보고 다음 걸음을 정합니다.' },
];

// 첫 접속 화면 (SCR-012, DEC-029·031): 랜딩 C안 '여정' + 공용 비밀번호 입장. 이름·계정은 받지 않는다 (CLAUDE.md §7)
export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="min-h-dvh bg-base text-main">
      <header className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-5 sm:px-8">
        <Image src="/brand/samkodong-logo-original.svg" alt="삼코동 Samsung Coaching Club" width={114} height={40} priority className="h-10 w-auto" />
        <span className="border-l border-line pl-3 font-medium text-body">삼성코칭동호회 코칭 포털</span>
      </header>

      <section className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-6 pt-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:pt-10">
        <div className="flex min-w-0 flex-col gap-5">
          <p className="self-start rounded-full bg-primary-light px-4 py-2 text-caption font-semibold text-primary-strong">
            삼성코칭동호회 · 고객 주도형 다회기 코칭
          </p>
          <h1 className="break-keep text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold leading-tight tracking-tight">
            더 나은 내일로 향하는
            <br />
            <span className="text-primary">코칭 가이드</span>
          </h1>
          <p className="max-w-[34em] break-keep text-lg leading-relaxed text-body">
            삼성코칭동호회와 함께 걷는 코칭의 길. 시작 세션의 첫 대화부터 Follow-up까지, 고객이 스스로 방향을 찾아가는 여정을 곁에서 돕습니다.
          </p>
          <p className="break-keep text-lg font-semibold text-primary-strong">함께, 더 멀리 — 당신의 여정을 응원합니다</p>
        </div>

        <section aria-labelledby="enter-title" className="rounded-lg bg-surface p-8 shadow-card">
          <h2 id="enter-title" className="break-keep text-h2 font-bold text-main">
            삼코동 코칭 포털에 오신 것을 환영합니다
          </h2>
          <p className="mt-2 text-body">코치 전용 공간 접속하기</p>
          {/* 주소의 next·error는 요청 시점에 서버에서 채운다 — 화면이 다 뜨기 전에 눌러도 돌아갈 주소가 빠지지 않게 */}
          <Suspense fallback={<LoginForm next="" error={false} />}>
            <LoginFormWithParams searchParams={searchParams} />
          </Suspense>
          <p className="mt-6 text-center text-caption text-muted">코치 전용 공간입니다. 비밀번호는 운영진에게 문의하세요.</p>
        </section>
      </section>

      <div className="mx-auto flex max-w-[1440px] justify-end overflow-hidden">
        <JourneyIllustration />
      </div>

      <section className="bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-16 sm:px-8">
          <h2 className="break-keep text-h1 font-bold">준비하고, 대화하고, 성찰합니다</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3 rounded-lg bg-base p-7">
                <span aria-hidden className="grid size-11 place-items-center rounded-full bg-primary font-bold text-on-primary">
                  {i + 1}
                </span>
                <strong className="text-lg">{step.title}</strong>
                <span className="break-keep leading-relaxed text-body">{step.body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1000px] px-4 py-16 text-center sm:px-8">
        <p className="break-keep text-[clamp(1.5rem,2.8vw,2.25rem)] font-semibold leading-snug">
          “좋은 질문이 좋은 대화를 만들고,
          <br />
          좋은 대화가 더 나은 변화를 만듭니다.”
        </p>
        <p className="mt-4 font-semibold text-primary-strong">삼성코칭동호회가 함께합니다</p>
      </section>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-6 text-caption text-muted sm:px-8">삼성코칭동호회(삼코동) 코치 전용 포털 · 공용 비밀번호로 입장합니다</p>
      </footer>
    </div>
  );
}

async function LoginFormWithParams({ searchParams }: { searchParams: SearchParams }) {
  const { next, error } = await searchParams;
  return <LoginForm next={typeof next === 'string' ? next : ''} error={error === '1'} />;
}
