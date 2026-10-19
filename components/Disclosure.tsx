'use client';

// 펼침·접힘 묶음 (DEC-035): 가이드북 원문을 모두 남기되 처음에는 제목만 보여 화면을 짧게 한다
// 브라우저 기본 <details>라 자바스크립트 없이도 열리고, 주소의 #id로 들어오면 펼친 채로 보여준다
import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

export function Disclosure({ id, title, meta, children }: { id?: string; title: string; meta?: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!id) return;
    const openIfTarget = () => {
      if (ref.current && window.location.hash === `#${id}`) {
        ref.current.open = true;
        ref.current.scrollIntoView({ block: 'start' });
      }
    };
    openIfTarget();
    window.addEventListener('hashchange', openIfTarget);
    return () => window.removeEventListener('hashchange', openIfTarget);
  }, [id]);

  return (
    <details ref={ref} id={id} className="group scroll-mt-20 border-b border-line last:border-b-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
        <ChevronRight size={20} aria-hidden className="shrink-0 text-muted transition-transform group-open:rotate-90" />
        <span className="font-semibold text-main">{title}</span>
        {meta && <span className="ml-auto hidden shrink-0 text-caption text-body sm:inline">{meta}</span>}
      </summary>
      <div className="pb-5 pl-8">{children}</div>
    </details>
  );
}
