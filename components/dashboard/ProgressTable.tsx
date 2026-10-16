'use client';

// SCR-003 프로그램 진행 현황표 (FN-008): 고객 × 기록 제출 여부. 응답 내용은 없다 (RULE-003)
// 색은 제출 = primary, 나머지 = muted만 쓴다. 경고색·순위 없음 (RULE-001·002)
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { COACHING_TYPE_INFO } from '@/lib/navigation';
import type { ProgramSummary } from '@/lib/data/programs';
import type { Cell, Progress, ProgressColumn, ProgressRow } from '@/lib/data/progress';
import { LoadError, Notice, STALE_NOTICE, UpdatedAt, shortDate, spokenDate, useApi } from './shared';

type ProgressBody = Progress & { program: Omit<ProgramSummary, 'clientCodes' | 'formUrls'>; fetchedAt: string };
type Sort = { column: string; dir: 'asc' | 'desc' };

const SYMBOL = { submitted: '✓', overdue: '○', planned: '·' } as const;
const SPOKEN = { submitted: '제출', overdue: '예정일 지남', planned: '예정' } as const;
const backLink = 'inline-flex min-h-11 items-center gap-1 font-semibold text-primary';

function columnName(col: ProgressColumn): string {
  if (col.form === 'journal') return `${col.extra ? '추가 ' : ''}${col.sessionNo}회기 코칭일지`;
  return { 'final-report': '종료 리포트', 'coach-reflection': '코치 종료소감', 'client-reflection': '피코치 종료소감' }[col.form];
}

// 정렬: 고객 코드 또는 회차별 제출일. 미제출 칸은 방향과 관계없이 뒤로
function sortRows(rows: ProgressRow[], sort: Sort): ProgressRow[] {
  const sign = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.column === 'client') return sign * a.clientCode.localeCompare(b.clientCode);
    const da = a.cells[sort.column]?.submittedAt ?? '';
    const db = b.cells[sort.column]?.submittedAt ?? '';
    if (!da || !db) return da ? -1 : db ? 1 : a.clientCode.localeCompare(b.clientCode);
    return sign * da.localeCompare(db) || a.clientCode.localeCompare(b.clientCode);
  });
}

export function ProgressTable({ programId }: { programId: string }) {
  const [result, reload] = useApi<ProgressBody>(`/api/programs/${encodeURIComponent(programId)}/progress`, (b) => Boolean(b.program));
  const [sort, setSort] = useState<Sort>({ column: 'client', dir: 'asc' });

  const back = (
    <Link href="/dashboard" className={backLink}>
      <ArrowLeft size={18} aria-hidden /> 프로그램 현황
    </Link>
  );

  if (result.status === 'loading') {
    return (
      <>
        {back}
        <div className="mt-4 space-y-2" aria-busy="true" aria-label="불러오는 중">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-subtle" />
          ))}
        </div>
      </>
    );
  }

  if (result.status === 'error') {
    return (
      <>
        {back}
        <div className="mt-4">
          {result.code === 404 ? (
            <section className="rounded-lg bg-surface p-6 shadow-card">
              <h1 className="text-h2 text-main">프로그램을 찾을 수 없습니다</h1>
              <p className="mt-2 text-body">주소의 프로그램 ID를 확인하거나 프로그램 현황에서 다시 선택해 주세요.</p>
            </section>
          ) : (
            <LoadError onRetry={reload} />
          )}
        </div>
      </>
    );
  }

  const { program, columns, rows, notices, fetchedAt } = result.data;
  const period = program.startDate || program.endDate ? `${shortDate(program.startDate)} ~ ${shortDate(program.endDate)}` : '기간 미정';
  const sorted = sortRows(rows, sort);

  function toggle(column: string) {
    setSort((s) => (s.column === column ? { column, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { column, dir: 'asc' }));
  }

  return (
    <>
      {back}
      <header className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-h1 text-main">{program.name || program.programId}</h1>
          <p className="mt-2 text-body">
            {program.programId} · {COACHING_TYPE_INFO[program.type].name} · {program.status} · {period}
          </p>
        </div>
        <UpdatedAt fetchedAt={fetchedAt} />
      </header>

      {result.stale && <Notice>{STALE_NOTICE}</Notice>}
      {notices.unknownResponses > 0 && <Notice>명단에 없는 응답 {notices.unknownResponses}건이 있습니다. 고객 코드와 회차를 확인해 주세요.</Notice>}
      {notices.orderCheck > 0 && <Notice>종료 리포트보다 종료소감이 먼저 제출된 고객이 {notices.orderCheck}명 있습니다. 작성 순서를 확인해 주세요.</Notice>}

      {rows.length === 0 ? (
        <section className="rounded-lg bg-surface p-6 shadow-card">
          <p className="text-body">등록된 참여자가 없습니다. roster 시트에 고객을 추가하세요.</p>
        </section>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg bg-surface shadow-card">
            <table className="min-w-full border-collapse text-left">
              <caption className="sr-only">고객별 기록 제출 현황. ✓ 제출, ○ 예정일 지남, · 예정</caption>
              <thead>
                <tr className="bg-subtle">
                  <SortHeader column="client" label="고객" sort={sort} onSort={toggle} sticky />
                  {columns.map((col) =>
                    col.form === 'journal' ? (
                      <SortHeader key={col.id} column={col.id} label={col.label} sort={sort} onSort={toggle} />
                    ) : (
                      <th key={col.id} scope="col" className="whitespace-nowrap px-3 py-3 text-caption font-semibold text-body">
                        {col.label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.clientCode} className="border-b border-line last:border-b-0 hover:bg-subtle">
                    <th scope="row" className="sticky left-0 z-10 h-12 bg-surface px-3 font-semibold text-main">
                      {row.clientCode}
                    </th>
                    {columns.map((col) => (
                      <StatusCell key={col.id} clientCode={row.clientCode} column={col} cell={row.cells[col.id]} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-caption text-muted">✓ 제출 · ○ 예정일 지남 · · 예정</p>
        </>
      )}
    </>
  );
}

function SortHeader({ column, label, sort, onSort, sticky }: { column: string; label: string; sort: Sort; onSort: (column: string) => void; sticky?: boolean }) {
  const active = sort.column === column;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`whitespace-nowrap px-3 py-3 text-caption font-semibold text-body ${sticky ? 'sticky left-0 z-10 bg-subtle' : ''}`}
    >
      <button type="button" onClick={() => onSort(column)} className="inline-flex min-h-11 items-center gap-1">
        {label}
        <span aria-hidden className={active ? 'text-primary' : 'opacity-35'}>
          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </button>
    </th>
  );
}

function StatusCell({ clientCode, column, cell }: { clientCode: string; column: ProgressColumn; cell: Cell }) {
  const date = cell.submittedAt ?? '';
  const spoken = [clientCode, columnName(column), SPOKEN[cell.state], spokenDate(date)].filter(Boolean).join(', ');
  return (
    <td className="relative whitespace-nowrap px-3 text-center">
      <span aria-hidden className={cell.state === 'submitted' ? 'text-primary' : 'text-muted'}>
        {SYMBOL[cell.state]}
        {date && <span className="ml-1 text-caption">{shortDate(date)}</span>}
      </span>
      <span className="sr-only">{spoken}</span>
    </td>
  );
}
