// 사이드 메뉴 구조 (DEC-011) — docs/development/02.PRD-FS-functional-spec.md FN-001 표 기준
// 회차 주제는 가이드북 5.1, 17.4, 18.3, 19.4의 회기 설계 표 표기를 그대로 쓴다 (RULE-007)

export const COACHING_TYPES = ['career', 'mentoring', 'life'] as const;
export type CoachingType = (typeof COACHING_TYPES)[number];

export const STAGES = ['start', '1', '2', '3', '4', '5', 'follow-up'] as const;
export type Stage = (typeof STAGES)[number];

export const COACHING_TYPE_INFO: Record<CoachingType, { name: string; themes: Record<Stage, string> }> = {
  career: {
    name: '커리어 코칭',
    themes: {
      start: '연결·합의·방향 설정',
      '1': '경험 자산과 현재 위치',
      '2': '가치·강점·환경 조건',
      '3': '미래 방향과 가설',
      '4': '선택지·장애·실험',
      '5': '자기주도 경력관리',
      'follow-up': '후속 점검',
    },
  },
  mentoring: {
    name: '멘토링 코칭',
    themes: {
      start: '관계·기대·경계·목표',
      '1': '나의 이야기와 현재 위치',
      '2': '가치·강점·성장 기준',
      '3': '미래 방향과 자원',
      '4': '선택지·행동·도움 요청',
      '5': '성장 통합·자립·종료',
      'follow-up': '후속 점검',
    },
  },
  life: {
    name: '라이프 코칭',
    themes: {
      start: '연결·합의·방향 설정',
      '1': '삶의 이야기와 현재 위치',
      '2': '가치·강점·나다운 삶',
      '3': '원하는 삶의 장면',
      '4': '선택지·경계·실행',
      '5': '통합·회복·지속',
      'follow-up': '후속 점검',
    },
  },
};

export function stageTitle(stage: Stage): string {
  if (stage === 'start') return '시작 세션';
  if (stage === 'follow-up') return 'Follow-up';
  return `${stage}회기`;
}

export function stageBadge(stage: Stage): string {
  if (stage === 'start') return '0';
  if (stage === 'follow-up') return 'F';
  return stage;
}

export function isCoachingType(value: string): value is CoachingType {
  return (COACHING_TYPES as readonly string[]).includes(value);
}

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

// 일지·소감 4종 (구글폼 연계는 Phase 3)
export const RECORD_FORMS = {
  journal: { title: '코칭일지', author: '코치', timing: '매 회기 종료 후' },
  'final-report': { title: '종료 리포트', author: '코치', timing: '마지막 회기 후' },
  'coach-reflection': { title: '코치 종료소감', author: '코치', timing: '종료 리포트 제출 후' },
  'client-reflection': { title: '피코치 종료소감', author: '고객', timing: '종료 리포트 제출 후' },
} as const;
export type RecordFormId = keyof typeof RECORD_FORMS;

export function isRecordFormId(value: string): value is RecordFormId {
  return Object.hasOwn(RECORD_FORMS, value);
}

export type NavIcon = 'chart' | 'home' | 'pencil' | 'file' | 'message' | 'share' | 'globe' | 'book';
export type NavLink = { href: string; label: string; icon: NavIcon };
export type NavGroup =
  | { title: string; kind: 'links'; links: NavLink[] }
  | { title: string; kind: 'coaching' };

export const NAV_GROUPS: NavGroup[] = [
  { title: '대시보드', kind: 'links', links: [{ href: '/dashboard', label: '프로그램 현황', icon: 'chart' }] },
  { title: '프로그램', kind: 'links', links: [{ href: '/program/overview', label: '프로그램 개요', icon: 'home' }] },
  { title: '코칭 모델', kind: 'coaching' },
  {
    title: '일지·소감',
    kind: 'links',
    links: [
      { href: '/records/journal', label: '코칭일지', icon: 'pencil' },
      { href: '/records/final-report', label: '종료 리포트', icon: 'file' },
      { href: '/records/coach-reflection', label: '코치 종료소감', icon: 'message' },
      { href: '/records/client-reflection', label: '피코치 종료소감', icon: 'share' },
    ],
  },
  { title: '코치 도구', kind: 'links', links: [{ href: '/tools', label: '코칭 툴 나눔터', icon: 'globe' }] },
  { title: '자료', kind: 'links', links: [{ href: '/references', label: '참조 자료실', icon: 'book' }] },
];

// 대시보드는 하위 주소(/dashboard/[programId])에서도 같은 메뉴를 강조한다
export function isActiveLink(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
  return pathname === href;
}

// 현재 주소의 코칭 유형. 코칭 화면이 아니면 null
export function coachingTypeFromPath(pathname: string): CoachingType | null {
  const match = /^\/coaching\/([^/]+)\//.exec(pathname);
  return match && isCoachingType(match[1]) ? match[1] : null;
}

// /coaching/[type]/[stage], /records/[form] 주소의 값이 정해진 목록 안에 있는지. 그 외 주소는 true
export function isKnownDynamicPath(pathname: string): boolean {
  const coaching = /^\/coaching\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  if (coaching) return isCoachingType(coaching[1]) && isStage(coaching[2]);
  const record = /^\/records\/([^/]+)\/?$/.exec(pathname);
  if (record) return isRecordFormId(record[1]);
  return true;
}
