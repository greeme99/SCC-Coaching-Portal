import type { ReactNode } from 'react';

export function PageHeader({ title, description, eyebrow }: { title: ReactNode; description?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="mb-2 text-caption text-body">{eyebrow}</p>}
      <h1 className="text-h1 text-main">{title}</h1>
      {description && <p className="mt-2 text-body">{description}</p>}
    </header>
  );
}

// Phase 1 뼈대 화면 — 각 기능은 해당 Phase에서 채운다 (docs/development/06.development-plan.md §8)
export function PhaseNotice({ phase, children }: { phase: number; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-surface p-6 shadow-card">
      <p className="text-caption text-body">Phase {phase}에서 구현 예정</p>
      <p className="mt-2 text-body">{children}</p>
    </section>
  );
}
