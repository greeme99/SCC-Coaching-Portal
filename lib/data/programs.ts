// programs·roster 시트 행 → 프로그램 목록 (API-001). 순수 함수라 단위 테스트로 검증한다
// roster의 이름·이메일 열은 읽지 않는다 — 응답에는 고객 코드만 담는다 (RULE-008)
import { isCoachingType, type CoachingType, type RecordFormId } from '@/lib/navigation';

export type ProgramStatus = '준비' | '운영중' | '종료';

export type ProgramSummary = {
  programId: string;
  name: string;
  type: CoachingType;
  sessionCount: number;
  status: ProgramStatus;
  clientCodes: string[];
  // 프로그램 전용 폼 주소. 비어 있으면 forms.json 공용 폼을 쓴다 (CLAUDE.md §5.2 A안)
  formUrls: Partial<Record<RecordFormId, string>>;
};

export type ProgramList = { programs: ProgramSummary[]; invalidCount: number };

// RULE-005: {연도}-{차수 1|2}-{기관}-{유형}
const PROGRAM_ID = /^\d{4}-[12]-[A-Z0-9]+-(CAREER|MENTORING|LIFE)$/;
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
    const status = (r.status ?? '').trim() as ProgramStatus;
    // 유형 열과 ID 끝 유형이 다르면 어느 쪽이 맞는지 알 수 없으므로 형식 오류로 센다
    const valid =
      PROGRAM_ID.test(programId) &&
      isCoachingType(type) &&
      programId.endsWith(`-${type.toUpperCase()}`) &&
      Number.isInteger(sessionCount) &&
      sessionCount > 0 &&
      STATUSES.includes(status);
    if (!valid) {
      invalidCount += 1;
      continue;
    }
    const formUrls: ProgramSummary['formUrls'] = {};
    for (const [column, formId] of Object.entries(FORM_URL_COLUMNS)) {
      if (r[column]?.startsWith('https://')) formUrls[formId] = r[column];
    }
    programs.push({
      programId,
      name: r.name ?? '',
      type,
      sessionCount,
      status,
      clientCodes: [...(codesByProgram.get(programId) ?? [])].sort(),
      formUrls,
    });
  }
  return { programs, invalidCount };
}
