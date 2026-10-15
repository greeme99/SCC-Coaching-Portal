'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Sidebar, SidebarFallback } from './Sidebar';

type SidebarState = 'auto' | 'open' | 'closed';
const STORAGE_KEY = 'scd.sidebar';
const DESKTOP_QUERY = '(min-width: 1024px)';

const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

// 저장소 접근이 막힌 환경(사생활 보호 모드 등)에서도 기본값으로 동작하게 한다 (TC-005)
function readPreference(): SidebarState | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'open' || value === 'closed' ? value : null;
  } catch {
    return null;
  }
}
function writePreference(value: SidebarState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // 저장 실패는 무시 — 다음 접속 때 기본값 사용
  }
}

// 화면 폭 구독. 서버 렌더 시점에는 폭을 모르므로 null
function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
const noopSubscribe = () => () => {};

export function AppShell({ children }: { children: ReactNode }) {
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => null);
  // 데스크톱에서만 저장된 선택을 되살린다. 모바일은 항상 접힌 상태로 시작
  const saved = useSyncExternalStore(noopSubscribe, readPreference, () => null);
  // 사용자가 이번 방문에서 직접 고른 상태. 없으면 저장값 → 'auto'(CSS가 화면 폭으로 결정)
  const [choice, setChoice] = useState<SidebarState | null>(null);
  const state: SidebarState = choice ?? (desktop && saved ? saved : 'auto');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const visible = useCallback(
    () => (state === 'auto' ? isDesktop() : state === 'open'),
    [state],
  );

  const setOpen = useCallback((open: boolean, focusMenu = false) => {
    const next = open ? 'open' : 'closed';
    setChoice(next);
    if (isDesktop()) writePreference(next);
    if (open && !isDesktop()) {
      // 서랍 메뉴가 열리면 초점을 첫 메뉴로 옮긴다
      requestAnimationFrame(() => sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus());
    }
    if (!open && focusMenu) menuButtonRef.current?.focus();
  }, []);

  // 모바일 서랍 메뉴: Esc로 닫기, 열린 동안 Tab 초점을 메뉴 안에 가두기
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isDesktop() || state !== 'open') return;
      if (event.key === 'Escape') {
        setOpen(false, true);
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;
      const items = [
        menuButtonRef.current,
        ...sidebarRef.current.querySelectorAll<HTMLElement>('a, button'),
      ].filter((el): el is HTMLElement => !!el);
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [state, setOpen]);

  // 모바일에서 메뉴를 고르면 서랍을 닫는다
  const onNavigate = useCallback(() => {
    if (!isDesktop()) setChoice('closed');
  }, []);

  const sidebarVisible = state === 'auto' ? desktop !== false : state === 'open';
  const drawerOpen = state === 'open' && desktop === false;

  return (
    <div className="app-shell" data-sidebar={state}>
      <a
        href="#main"
        className="absolute -left-[999px] top-2 z-50 rounded-md bg-surface px-4 py-2 focus:left-2"
      >
        본문 바로가기
      </a>

      <header className="app-topbar">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(!visible())}
          aria-controls="sidebar"
          aria-expanded={sidebarVisible}
          aria-label="메뉴 열기/닫기"
          className="grid size-11 shrink-0 place-items-center rounded-md border border-line bg-surface text-body transition hover:bg-subtle active:scale-[0.97]"
        >
          <Menu size={22} strokeWidth={1.75} aria-hidden />
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2" onClick={onNavigate}>
          <Image
            src="/brand/samkodong-logo-original.svg"
            alt="삼코동 Samsung Coaching Club"
            width={114}
            height={40}
            priority
            className="h-10 w-auto shrink-0"
          />
          <span className="truncate text-h3 text-main">삼코동 코칭 포털</span>
        </Link>
      </header>

      <nav
        id="sidebar"
        ref={sidebarRef}
        aria-label="주 메뉴"
        className="app-sidebar"
        // 화면 밖으로 숨긴 메뉴는 Tab 이동·화면 낭독 대상에서 뺀다
        inert={desktop !== null && !sidebarVisible}
      >
        <Suspense fallback={<SidebarFallback />}>
          <Sidebar onNavigate={onNavigate} />
        </Suspense>
      </nav>

      {drawerOpen && (
        <div className="app-scrim" aria-hidden onClick={() => setOpen(false, true)} />
      )}

      <main id="main" tabIndex={-1} className="app-main">
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>
    </div>
  );
}
