'use client';

// 대시보드: 주소에 program이 있으면 진행 현황표, 없으면 프로그램 현황 (CLAUDE.md §5.2 — 선택한 프로그램은 주소에 담는다)
import { useSearchParams } from 'next/navigation';
import { ProgramCards } from './ProgramCards';
import { ProgressTable } from './ProgressTable';

export function Dashboard() {
  const programId = useSearchParams().get('program');
  return programId ? <ProgressTable programId={programId} /> : <ProgramCards />;
}
