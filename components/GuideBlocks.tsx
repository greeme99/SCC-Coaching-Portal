// 가이드 화면 공통 블록 (카드·질문 목록·표). 색은 토큰 유틸리티만 사용 (DESIGN.md)
import type { ReactNode } from 'react';

export function Card({ title, source, id, children }: { title: ReactNode; source?: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-6 scroll-mt-20 rounded-lg bg-surface p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h2 text-main">{title}</h2>
        {/* 출처 표시 — 문구가 가이드북 원문임을 확인할 수 있게 한다 (RULE-007) */}
        {source && <span className="text-caption text-body">{source}</span>}
      </div>
      {children}
    </section>
  );
}

export function QuestionList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-body">
      {items.map((q) => (
        <li key={q}>{q}</li>
      ))}
    </ul>
  );
}

// 항목 — 내용 2열 표. 내용이 빈 행은 기록 양식 항목이라 항목만 보여준다
export function KeyValueTable({ rows, caption }: { rows: [string, string][]; caption?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        {caption && <caption className="mb-2 text-left text-caption text-body">{caption}</caption>}
        <tbody>
          {rows.map(([key, value]) => (
            <tr key={key} className="border-b border-line last:border-b-0">
              <th scope="row" className="w-1/3 py-3 pr-4 align-top font-semibold text-main">
                {key}
              </th>
              <td className="py-3 text-body">{value || <span className="text-muted" aria-label="기록 칸">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GridTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="bg-subtle">
            {columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-3 text-caption font-semibold text-body">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join('|')} className="border-b border-line">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-3 py-3 align-top font-semibold text-main">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-3 py-3 align-top text-body">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Quote({ children }: { children: ReactNode }) {
  return <p className="rounded-md border-l-4 border-primary bg-primary-light px-4 py-3 text-main">{children}</p>;
}
