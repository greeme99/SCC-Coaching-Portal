// programs·roster 시트 행 → 프로그램 목록 (API-001). 순수 함수라 단위 테스트로 검증한다
// roster의 이름·이메일 열은 읽지 않는다 — 응답에는 고객 코드만 담는다 (RULE-008)
import { isCoachingType, type CoachingType, type RecordFormId } from '@/lib/navigation';

export type ProgramStatus = '준비' | '운영중' | '종료' | '상태 미지정';

export type ProgramSummary = {
  programId: string;
  name: string;
  org: string;
  type: CoachingType;
  sessionCount: number;
  // ISO 날짜(YYYY-MM-DD). 시트에 없거나 읽을 수 없으면 빈 문자열
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  clientCodes: string[];
  // 프로그램 전용 폼 주소. 비어 있으면 forms.json 공용 폼을 쓴다 (CLAUDE.md §5.2 A안)
  formUrls: Partial<Record<RecordFormId, string>>;
};

export type ProgramList = { programs: ProgramSummary[]; invalidCount: number };

// RULE-005: {연도}-{차수 1|2}-{기관}-{유형}
const PROGRAM_ID = /^(\d{4})-([12])-[A-Z0-9]+-(CAREER|MENTORING|LIFE)$/;
const STATUSES: ProgramStatus[] = ['준비', '운영중', '종료'];
const FORM_URL_COLUMNS: Record<string, RecordFormId> = {
  formUrl_journal: 'journal',
  formUrl_finalReport: 'final-report',
  formUrl_coachReflection: 'coach-reflection',
  formUrl_clientReflection: 'client-reflection',
};

// RULE-004 정규화: 앞뒤 공백 제거 + 대문자
export const normalizeKey = (value: string | undefined) => (value ?? '').trim().toUpperCase();

// 첫 행을 열 이름으로 써서 객체 배열로 바꾼다. 완전히 빈 행은 건너뛴다
export function toRecords(rows: string[][]): Record<string, string>[] {
  const [header = [], ...body] = rows;
  return body
    .filter((row) => row.some((cell) => cell?.trim()))
    .map((row) => Object.fromEntries(header.map((name, i) => [name.trim(), (row[i] ?? '').trim()])));
}

// 시트 표시 형식이 달라도 날짜만 뽑는다: "2026-10-20", "2026. 10. 20", "2026. 10. 16 오전 9:20:03" → "2026-10-20"
export function parseDate(value: string | undefined): string {
  const m = /(\d{4})\D{1,3}(\d{1,2})\D{1,3}(\d{1,2})/.exec(value ?? '');
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '';
}

export function buildProgramList(programRows: string[][], rosterRows: string[][]): ProgramList {
  const codesByProgram = new Map<string, Set<string>>();
  for (const r of toRecords(rosterRows)) {
    const programId = normalizeKey(r.programId);
    const clientCode = normalizeKey(r.clientCode);
    if (!programId || !clientCode) continue;
    if (!codesByProgram.has(programId)) codesByProgram.set(programId, new Set());
    codesByProgram.get(programId)!.add(clientCode);
  }

  let invalidCount = 0;
  const programs: ProgramSummary[] = [];
  for (const r of toRecords(programRows)) {
    const programId = normalizeKey(r.programId);
    const type = (r.type ?? '').trim().toLowerCase();
    const sessionCount = Number(r.sessionCount);
    // 유형 열과 ID 끝 유형이 다르면 어느 쪽이 맞는지 알 수 없으므로 형식 오류로 센다
    const valid =
      PROGRAM_ID.test(programId) &&
      isCoachingType(type) &&
      programId.endsWith(`-${type.toUpperCase()}`) &&
      Number.isInteger(sessionCount) &&
      sessionCount > 0;
    if (!valid) {
      invalidCount += 1;
      continue;
    }
    // RULE-010: 상태는 시트 값을 따르고, 비어 있거나 정해진 값이 아니면 "상태 미지정"
    const rawStatus = (r.status ?? '').trim() as ProgramStatus;
    const formUrls: ProgramSummary['formUrls'] = {};
    for (const [column, formId] of Object.entries(FORM_URL_COLUMNS)) {
      if (r[column]?.startsWith('https://')) formUrls[formId] = r[column];
    }
    programs.push({
      programId,
      name: r.name ?? '',
      org: r.org ?? '',
      type,
      sessionCount,
      startDate: parseDate(r.startDate),
      endDate: parseDate(r.endDate),
      status: STATUSES.includes(rawStatus) ? rawStatus : '상태 미지정',
      clientCodes: [...(codesByProgram.get(programId) ?? [])].sort(),
      formUrls,
    });
  }
  return { programs, invalidCount };
}

// ── 프로그램 현황 필터 (FN-007). 주소 쿼리 값 그대로 받는다 ──

export const STATUS_QUERY = { active: '운영중', ready: '준비', closed: '종료', unset: '상태 미지정' } as const;
export type ProgramFilter = { status: string; year: string; round: string; type: string };

// 기본 필터: 상태 = 운영중, 나머지 전체
export function readFilter(params: URLSearchParams): ProgramFilter {
  return {
    status: params.get('status') ?? 'active',
    year: params.get('year') ?? 'all',
    round: params.get('round') ?? 'all',
    type: params.get('type') ?? 'all',
  };
}

export const programYear = (programId: string) => programId.slice(0, 4);
export const programRound = (programId: string) => programId.slice(5, 6);

// 필터 적용 후 시작일 최신순 (시작일이 없으면 뒤로)
export function filterPrograms<T extends ProgramSummary>(programs: T[], filter: ProgramFilter): T[] {
  const status = STATUS_QUERY[filter.status as keyof typeof STATUS_QUERY];
  return programs
    .filter(
      (p) =>
        (filter.status === 'all' || p.status === status) &&
        (filter.year === 'all' || programYear(p.programId) === filter.year) &&
        (filter.round === 'all' || programRound(p.programId) === filter.round) &&
        (filter.type === 'all' || p.type === filter.type),
    )
    .sort((a, b) => (b.startDate || '0').localeCompare(a.startDate || '0') || a.programId.localeCompare(b.programId));
}
