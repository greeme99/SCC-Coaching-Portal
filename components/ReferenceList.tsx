'use client';

// SCR-011 참조 자료실 (FN-009): 고정 가이드북 + 드라이브 '참조자료' 폴더 목록 + 이름 검색
// 목록을 못 불러와도 고정 자료는 항상 보인다
import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, ExternalLink, Search } from 'lucide-react';
import { searchReferences, type ReferenceFile } from '@/lib/data/references';
import { LoadError, Notice, STALE_NOTICE, UpdatedAt, useApi } from '@/components/ApiState';

type ReferencesBody = { files: ReferenceFile[]; fetchedAt: string };
type Sort = { column: 'name' | 'modifiedDate'; dir: 'asc' | 'desc' };

function sortFiles(files: ReferenceFile[], sort: Sort): ReferenceFile[] {
  const sign = sort.dir === 'asc' ? 1 : -1;
  return [...files].sort((a, b) => sign * a[sort.column].localeCompare(b[sort.column], 'ko') || a.name.localeCompare(b.name, 'ko'));
}

export function ReferenceList() {
  const [result, reload] = useApi<ReferencesBody>('/api/references', (b) => Array.isArray(b.files));
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>({ column: 'name', dir: 'asc' });

  const toggle = (column: Sort['column']) =>
    setSort((s) => (s.column === column ? { column, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { column, dir: column === 'name' ? 'asc' : 'desc' }));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="relative block w-full max-w-sm">
          <span className="sr-only">자료 이름 검색</span>
          <Search size={18} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="자료 이름 검색"
            className="min-h-11 w-full rounded-md border border-line bg-surface pl-10 pr-3 text-main"
          />
        </label>
        {result.status === 'ok' && <UpdatedAt fetchedAt={result.data.fetchedAt} />}
      </div>

      {/* 고정 자료 — 저장소 가이드북 */}
      <Link href="/references/guidebook" className="mb-4 flex min-h-11 items-center justify-between gap-3 rounded-lg bg-primary-light px-5 py-4 text-main">
        <span className="flex items-center gap-2 font-semibold">
          <BookOpen size={20} aria-hidden className="text-primary" /> 코칭 프로그램 가이드북 <span className="text-caption font-normal text-body">(기본 자료)</span>
        </span>
        <span className="font-semibold text-primary-strong">열기</span>
      </Link>

      {result.status === 'loading' && (
        <div className="space-y-2" aria-busy="true" aria-label="불러오는 중">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-subtle" />
          ))}
        </div>
      )}

      {result.status === 'error' && <LoadError onRetry={reload} source="구글 드라이브" />}

      {result.status === 'ok' && (
        <>
          {result.stale && <Notice>{STALE_NOTICE}</Notice>}
          {result.data.files.length === 0 ? (
            <Notice>추가된 자료가 없습니다. 관리자가 구글 드라이브 &apos;참조자료&apos; 폴더에 올리면 표시됩니다.</Notice>
          ) : (
            <FileTable files={sortFiles(searchReferences(result.data.files, query), sort)} sort={sort} onSort={toggle} />
          )}
        </>
      )}
    </>
  );
}

function SortButton({ column, label, sort, onSort }: { column: Sort['column']; label: string; sort: Sort; onSort: (c: Sort['column']) => void }) {
  const active = sort.column === column;
  return (
    <button type="button" onClick={() => onSort(column)} className="inline-flex min-h-11 items-center gap-1">
      {label}
      <span aria-hidden className={active ? 'text-primary' : 'opacity-35'}>
        {active ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </button>
  );
}

function FileTable({ files, sort, onSort }: { files: ReferenceFile[]; sort: Sort; onSort: (c: Sort['column']) => void }) {
  const ariaSort = (column: Sort['column']) => (sort.column === column ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  if (files.length === 0) return <Notice>검색어와 맞는 자료가 없습니다.</Notice>;
  return (
    <div className="overflow-hidden rounded-lg bg-surface shadow-card">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-subtle text-caption font-semibold text-body">
            <th scope="col" aria-sort={ariaSort('name')} className="px-4">
              <SortButton column="name" label="이름" sort={sort} onSort={onSort} />
            </th>
            <th scope="col" className="hidden px-4 md:table-cell">
              형식
            </th>
            <th scope="col" aria-sort={ariaSort('modifiedDate')} className="hidden px-4 md:table-cell">
              <SortButton column="modifiedDate" label="수정일" sort={sort} onSort={onSort} />
            </th>
            <th scope="col" className="px-4">
              <span className="sr-only">열기</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id} className="border-b border-line last:border-b-0 hover:bg-subtle">
              <td className="px-4 py-3 text-main">
                {f.name}
                {/* 좁은 화면에서는 형식·수정일을 이름 아래에 */}
                <span className="block text-caption text-muted md:hidden">
                  {f.kind} · {f.modifiedDate}
                </span>
              </td>
              <td className="hidden px-4 py-3 text-body md:table-cell">{f.kind}</td>
              <td className="hidden px-4 py-3 text-body md:table-cell">{f.modifiedDate}</td>
              <td className="px-4 py-3 text-right">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary">
                  열기 <ExternalLink size={16} aria-hidden />
                  <span className="sr-only">{f.name} (새 창)</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
