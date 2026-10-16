'use client';

// 대시보드 화면 공통: API 조회 훅, 날짜 표시, 안내·오류 블록
import { useEffect, useState, type ReactNode } from 'react';

export type Fetched<T> =
  | { status: 'loading' }
  | { status: 'error'; code: number }
  // stale: 조회는 실패했지만 서버가 마지막 성공 결과를 함께 보낸 경우
  | { status: 'ok'; data: T; stale: boolean };

// API를 한 번 읽는다. reload()로 다시 시도
export function useApi<T>(url: string, hasData: (body: Partial<T>) => boolean): [Fetched<T>, () => void] {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; value: Fetched<T> }>({ key: '', value: { status: 'loading' } });
  const key = `${url}#${attempt}`;

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as Partial<T>;
        const value: Fetched<T> = hasData(body) ? { status: 'ok', data: body as T, stale: !res.ok } : { status: 'error', code: res.status };
        if (alive) setResult({ key, value });
      })
      .catch(() => alive && setResult({ key, value: { status: 'error', code: 0 } }));
    return () => {
      alive = false;
    };
    // hasData는 호출마다 새 함수라 의존성에서 뺀다 (판정 기준은 바뀌지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, url]);

  // 주소가 바뀌거나 다시 시도하면 결과가 도착할 때까지 로딩으로 본다
  return [result.key === key ? result.value : { status: 'loading' }, () => setAttempt((n) => n + 1)];
}

// "2026-10-18" → "10.18"
export const shortDate = (iso: string) => (iso ? `${iso.slice(5, 7)}.${iso.slice(8, 10)}` : '');
// "2026-10-18" → "10월 18일" (화면 낭독용)
export const spokenDate = (iso: string) => (iso ? `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일` : '');

export function UpdatedAt({ fetchedAt }: { fetchedAt: string }) {
  const time = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(fetchedAt));
  return <span className="text-caption text-muted">마지막 갱신 {time}</span>;
}

// 안내 문구 — 중립 색만 쓴다 (RULE-001)
export function Notice({ children }: { children: ReactNode }) {
  return <p className="mb-4 rounded-md bg-subtle px-4 py-3 text-body">{children}</p>;
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-lg bg-surface p-6 shadow-card">
      <p className="text-body">구글 시트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-5 font-semibold text-main hover:bg-subtle">
        다시 시도
      </button>
    </section>
  );
}

export const STALE_NOTICE = '최신 내용을 불러오지 못해 마지막으로 불러온 내용을 보여줍니다.';
