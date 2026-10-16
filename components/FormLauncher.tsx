'use client';

// 일지·소감 화면의 "폼 열기" 영역 (FN-006, SCR-006~009)
// 프로그램 목록(API-001)에서 프로그램·고객 코드·회차를 고르면 prefill 링크를 만든다. 링크 생성은 브라우저에서만 한다
import { useEffect, useId, useRef, useState } from 'react';
import { Copy, ExternalLink, Share2 } from 'lucide-react';
import type { ProgramSummary } from '@/lib/data/programs';
import type { RecordFormId } from '@/lib/navigation';
import { MAX_SESSION_NO, buildPrefillUrl, configuredKeys, parseExtraSession, type PrefillEntries } from '@/lib/prefill';

type Props = {
  formId: RecordFormId;
  title: string;
  formUrl: string;
  prefill: PrefillEntries;
  // 피코치용 폼은 코치가 직접 열지 않고 링크를 복사·공유한다
  shareOnly: boolean;
};

type ListState = { status: 'loading' } | { status: 'error' } | { status: 'ok'; programs: ProgramSummary[] };

// 회차 목록의 "추가 회차" 값. 숫자 회차와 겹치지 않게 문자열로 둔다
const EXTRA_SESSION = 'extra';

const fieldClass = 'min-h-11 w-full rounded-md border border-line bg-surface px-3 text-main';
const primaryClass = 'inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary';
const secondaryClass = 'inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 font-semibold text-main hover:bg-subtle';

export function FormLauncher({ formId, title, formUrl, prefill, shareOnly }: Props) {
  const [list, setList] = useState<ListState>({ status: 'loading' });
  const [programId, setProgramId] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [sessionNo, setSessionNo] = useState('');
  // 회차 목록에서 "추가 회차"를 고르면 번호를 직접 입력한다 (회기 수를 넘는 추가 진행 회차)
  const [extraSession, setExtraSession] = useState('');
  const [toast, setToast] = useState('');
  const [fallbackLink, setFallbackLink] = useState('');
  const fallbackRef = useRef<HTMLInputElement>(null);
  const reasonId = useId();
  const fieldId = useId();

  useEffect(() => {
    let alive = true;
    fetch('/api/programs')
      .then(async (res) => {
        const body = (await res.json()) as { programs?: ProgramSummary[] };
        // 502여도 마지막 성공 목록이 함께 오면 그 목록을 쓴다
        if (alive) setList(body.programs ? { status: 'ok', programs: body.programs } : { status: 'error' });
      })
      .catch(() => alive && setList({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    fallbackRef.current?.focus();
    fallbackRef.current?.select();
  }, [fallbackLink]);

  const needsSession = formId === 'journal';
  const program = list.status === 'ok' ? list.programs.find((p) => p.programId === programId) : undefined;
  // 프로그램 전용 폼이 있으면 그 주소, 없으면 공용 폼 (CLAUDE.md §5.2 A안)
  const targetUrl = program?.formUrls[formId] || formUrl;
  const prefillReady = configuredKeys(prefill).length > 0;

  const sessionCount = program?.sessionCount ?? 0;
  const isExtra = sessionNo === EXTRA_SESSION;
  const effectiveSession = isExtra ? parseExtraSession(extraSession, sessionCount) : sessionNo;
  const missing = !programId || !clientCode || (needsSession && !effectiveSession);
  const link =
    list.status === 'error' ? formUrl : !missing && targetUrl ? buildPrefillUrl(targetUrl, prefill, { programName: program?.name ?? '', programId, clientCode, sessionNo: effectiveSession ?? '' }) : '';
  const extraRange = `${sessionCount + 1} ~ ${MAX_SESSION_NO}`;
  const reason =
    list.status === 'error' || !missing
      ? '구글폼 주소가 아직 등록되지 않았습니다'
      : needsSession && programId && clientCode && isExtra
        ? `추가 회차 번호를 ${extraRange} 사이 숫자로 입력하세요`
        : needsSession
          ? '프로그램, 고객 코드, 회차를 선택하세요'
          : '프로그램과 고객 코드를 선택하세요';

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setFallbackLink('');
      setToast('링크를 복사했습니다');
    } catch {
      // 클립보드를 쓸 수 없으면 링크를 선택된 상태로 보여줘 직접 복사하게 한다
      setFallbackLink(link);
    }
  }

  async function share() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, url: link });
    } catch {
      // 사용자가 공유 창을 닫은 경우 — 아무것도 하지 않는다
    }
  }

  return (
    <div className="space-y-4">
      {list.status === 'loading' && (
        <div className="grid gap-3 md:grid-cols-3" aria-busy="true" aria-label="목록을 불러오는 중">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-md bg-subtle" />
          ))}
        </div>
      )}

      {list.status === 'error' && <p className="text-body">목록을 불러오지 못했습니다. 아래 버튼으로 폼을 열어 값을 직접 입력할 수 있습니다.</p>}

      {list.status === 'ok' && (
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label htmlFor={`${fieldId}-program`} className="mb-1 block text-caption text-body">
              프로그램
            </label>
            <select
              id={`${fieldId}-program`}
              className={fieldClass}
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value);
                setClientCode('');
                setSessionNo('');
                setExtraSession('');
              }}
            >
              <option value="">선택</option>
              {list.programs.map((p) => (
                <option key={p.programId} value={p.programId}>
                  {p.programId}
                  {p.name && ` · ${p.name}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${fieldId}-client`} className="mb-1 block text-caption text-body">
              고객 코드
            </label>
            <select id={`${fieldId}-client`} className={fieldClass} value={clientCode} onChange={(e) => setClientCode(e.target.value)} disabled={!program}>
              <option value="">선택</option>
              {program?.clientCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          {needsSession && (
            <div>
              <label htmlFor={`${fieldId}-session`} className="mb-1 block text-caption text-body">
                회차
              </label>
              <select id={`${fieldId}-session`} className={fieldClass} value={sessionNo} onChange={(e) => setSessionNo(e.target.value)} disabled={!program}>
                <option value="">선택</option>
                {Array.from({ length: sessionCount }, (_, i) => String(i + 1)).map((n) => (
                  <option key={n} value={n}>
                    {n}회차
                  </option>
                ))}
                {program && <option value={EXTRA_SESSION}>추가 회차 (직접 입력)</option>}
              </select>
              {isExtra && (
                <>
                  <label htmlFor={`${fieldId}-extra`} className="mt-3 mb-1 block text-caption text-body">
                    추가 회차 번호
                  </label>
                  <input
                    id={`${fieldId}-extra`}
                    className={fieldClass}
                    type="number"
                    inputMode="numeric"
                    min={sessionCount + 1}
                    max={MAX_SESSION_NO}
                    placeholder={`예: ${sessionCount + 1}`}
                    value={extraSession}
                    onChange={(e) => setExtraSession(e.target.value)}
                    aria-describedby={`${fieldId}-extra-hint`}
                  />
                  <p id={`${fieldId}-extra-hint`} className="mt-1 text-caption text-muted">
                    이 프로그램은 {sessionCount}회기입니다. {sessionCount + 1}회차부터 입력합니다.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {list.status !== 'loading' && (
        <div className="flex flex-wrap items-center gap-3">
          {link ? (
            shareOnly ? (
              <>
                <button type="button" className={primaryClass} onClick={copy}>
                  <Copy size={18} aria-hidden /> 링크 복사
                </button>
                <button type="button" className={secondaryClass} onClick={share}>
                  <Share2 size={18} aria-hidden /> 공유
                </button>
              </>
            ) : (
              <a className={primaryClass} href={link} target="_blank" rel="noopener noreferrer">
                {list.status === 'error' ? '값 없이 구글폼 열기' : '구글폼 열기'} <ExternalLink size={18} aria-hidden />
              </a>
            )
          ) : (
            <>
              <button type="button" className={`${primaryClass} cursor-not-allowed opacity-50`} aria-disabled="true" aria-describedby={reasonId}>
                {shareOnly ? '링크 복사' : '구글폼 열기'}
              </button>
              <span id={reasonId} className="text-caption text-body">
                {reason}
              </span>
            </>
          )}
        </div>
      )}

      {fallbackLink && (
        <label className="block">
          <span className="mb-1 block text-caption text-body">아래 링크를 복사해 전달하세요</span>
          <input ref={fallbackRef} className={fieldClass} readOnly value={fallbackLink} onFocus={(e) => e.target.select()} />
        </label>
      )}

      {list.status === 'ok' && !prefillReady && (
        <p className="text-caption text-muted">구글폼의 미리 채우기 항목이 아직 등록되지 않아, 폼에서 값을 직접 입력해야 합니다.</p>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-surface px-5 py-3 text-main shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}
