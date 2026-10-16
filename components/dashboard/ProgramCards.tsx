'use client';

// SCR-002 프로그램 현황 (FN-007): 필터 + 프로그램 카드. 필터는 주소 쿼리에 남긴다
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { COACHING_TYPES, COACHING_TYPE_INFO } from '@/lib/navigation';
import { filterPrograms, programYear, readFilter, type ProgramFilter, type ProgramSummary } from '@/lib/data/programs';
import type { ProgramStats } from '@/lib/data/progress';
import { LoadError, Notice, STALE_NOTICE, UpdatedAt, shortDate, useApi } from '@/components/ApiState';

type ProgramCard = ProgramSummary & { stats: ProgramStats };
type ProgramsBody = { programs: ProgramCard[]; invalidCount: number; fetchedAt: string };

const FILTERS: { key: keyof ProgramFilter; label: string }[] = [
  { key: 'status', label: '상태' },
  { key: 'year', label: '연도' },
  { key: 'round', label: '차수' },
  { key: 'type', label: '유형' },
];

const selectClass = 'min-h-11 w-full rounded-md border border-line bg-surface px-3 text-main';

export function ProgramCards() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = readFilter(params);
  const [result, reload] = useApi<ProgramsBody>('/api/programs', (b) => Array.isArray(b.programs));

  function setFilter(key: keyof ProgramFilter, value: string) {
    // 네이티브 history API는 주소를 바로 바꾸고 useSearchParams와 동기화된다 (Next.js 문서: Native History API)
    // router.replace는 비동기라 필터를 연달아 바꾸면 앞의 값이 사라질 수 있다
    const next = new URLSearchParams(window.location.search);
    next.set(key, value);
    window.history.replaceState(null, '', `/dashboard?${next}`);
  }

  const programs = result.status === 'ok' ? result.data.programs : [];
  const years = [...new Set(programs.map((p) => programYear(p.programId)))].sort().reverse();
  const options: Record<keyof ProgramFilter, [string, string][]> = {
    status: [['active', '운영중'], ['ready', '준비'], ['closed', '종료'], ['unset', '상태 미지정'], ['all', '전체']],
    year: [['all', '전체'], ...years.map((y): [string, string] => [y, y])],
    round: [['all', '전체'], ['1', '1차'], ['2', '2차']],
    type: [['all', '전체'], ...COACHING_TYPES.map((t): [string, string] => [t, COACHING_TYPE_INFO[t].name])],
  };
  const shown = filterPrograms(programs, filter);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <PageHeader title="프로그램 현황" description="코칭 프로그램별 운영 현황과 기록 제출 현황을 확인합니다." />
        {result.status === 'ok' && <UpdatedAt fetchedAt={result.data.fetchedAt} />}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {FILTERS.map(({ key, label }) => (
          <div key={key}>
            <label htmlFor={`filter-${key}`} className="mb-1 block text-caption text-body">
              {label}
            </label>
            <select id={`filter-${key}`} className={selectClass} value={filter[key]} onChange={(e) => setFilter(key, e.target.value)}>
              {options[key].map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {result.status === 'loading' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="불러오는 중">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-subtle" />
          ))}
        </div>
      )}

      {result.status === 'error' && <LoadError onRetry={reload} code={result.code} />}

      {result.status === 'ok' && (
        <>
          {result.stale && <Notice>{STALE_NOTICE}</Notice>}
          {result.data.invalidCount > 0 && <Notice>형식이 맞지 않는 프로그램 {result.data.invalidCount}건은 표시하지 않았습니다.</Notice>}
          {shown.length === 0 ? (
            <section className="rounded-lg bg-surface p-6 shadow-card">
              <p className="text-body">조건에 맞는 프로그램이 없습니다.</p>
              <button
                type="button"
                onClick={() => router.replace('/dashboard', { scroll: false })}
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-5 font-semibold text-main hover:bg-subtle"
              >
                필터 초기화
              </button>
            </section>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shown.map((p) => (
                <li key={p.programId}>
                  <ProgramCardLink program={p} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

function ProgramCardLink({ program: p }: { program: ProgramCard }) {
  const period = p.startDate || p.endDate ? `${shortDate(p.startDate)} ~ ${shortDate(p.endDate)}` : '기간 미정';
  return (
    <Link
      href={`/dashboard?program=${encodeURIComponent(p.programId)}`}
      className="flex h-full flex-col rounded-lg bg-surface p-5 shadow-card transition-shadow hover:shadow-hover"
    >
      <span className="text-h3 text-main">{p.name || p.programId}</span>
      <span className="mt-1 text-caption text-muted">{p.programId}</span>
      <span className="mt-3 text-body">
        {COACHING_TYPE_INFO[p.type].name} · {p.status}
      </span>
      <span className="text-body">
        {period} · {p.stats.clientCount}명
      </span>
      <span className="text-body">
        코칭일지 {p.stats.journalSubmitted} / {p.stats.journalPlanned}
      </span>
      <span className="mt-3 flex items-center justify-between text-body">
        다음 일정 {p.stats.nextDate ? shortDate(p.stats.nextDate) : '없음'}
        <ChevronRight size={18} aria-hidden className="text-primary" />
      </span>
      {/* 링크 이름 = 카드에 보이는 글자 + 목적 (WCAG 2.5.3 보이는 글자와 이름 일치) */}
      <span className="sr-only">진행 현황 보기</span>
    </Link>
  );
}
