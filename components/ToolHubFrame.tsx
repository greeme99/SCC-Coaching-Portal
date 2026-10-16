'use client';

// SCR-010 코칭 툴 나눔터 (FN-005): 나눔터를 화면 안에 삽입. 8초 안에 불러오지 못하면 새 창 안내로 바꾼다
// 다른 사이트를 삽입하므로 sandbox로 권한을 좁힌다 (스크립트·같은 출처·새 창 열기만 허용)
import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

const TIMEOUT_MS = 8000;

export function ToolHubFrame({ url }: { url: string }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // 주소는 화면이 준비된 뒤에 넣는다 — 서버 HTML에 넣으면 React가 붙기 전에 불러오기가 끝나 완료 신호를 놓친다
    if (frameRef.current) frameRef.current.src = url;
  }, [url]);

  useEffect(() => {
    // 타이머 콜백 안에서만 상태를 바꾼다 (이미 불러왔으면 그대로)
    const timer = setTimeout(() => setState((s) => (s === 'loading' ? 'failed' : s)), TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const openButton = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-on-primary"
    >
      새 창에서 열기 <ExternalLink size={18} aria-hidden />
    </a>
  );

  return (
    <>
      {/* 새 창 버튼이 iframe보다 먼저 초점을 받는다 (SCR-010) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-body">코칭 도구 상세와 워크시트는 나눔터에서 관리합니다.</p>
        {openButton}
      </div>

      {state === 'failed' ? (
        <section className="rounded-lg bg-surface p-6 shadow-card">
          <p className="text-body">이 화면에서 나눔터를 표시할 수 없습니다. 새 창에서 열어 주세요.</p>
          <div className="mt-4">{openButton}</div>
        </section>
      ) : (
        <div className="relative overflow-hidden rounded-lg bg-surface shadow-card">
          {state === 'loading' && (
            <p className="absolute inset-x-0 top-0 bg-subtle px-4 py-2 text-caption text-body" role="status">
              불러오는 중
            </p>
          )}
          <iframe
            ref={frameRef}
            title="코칭 툴 나눔터"
            // 주소를 넣기 전 빈 화면(about:blank)의 완료 신호는 무시한다
            onLoad={(e) => e.currentTarget.getAttribute('src') && setState('loaded')}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            className="block w-full"
            style={{ height: 'max(480px, calc(100dvh - 240px))' }}
          />
        </div>
      )}
    </>
  );
}
