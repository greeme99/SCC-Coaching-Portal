// 구글폼 응답 시트 → 제출 현황 (API-001 카드 합계, API-002 진행 현황표). 순수 함수
// 응답 행에서는 키 열(programId·clientCode·sessionNo)과 타임스탬프만 읽는다 — 응답 내용은 다루지 않는다 (RULE-003)
import { MAX_SESSION_NO } from '@/lib/prefill';
import { normalizeKey, parseDate, toRecords, type ProgramSummary } from '@/lib/data/programs';

export type ResponseFormId = 'journal' | 'final-report' | 'coach-reflection' | 'client-reflection';
export type ResponseRows = Record<ResponseFormId, string[][]>;

type ResponseKey = { programId: string; clientCode: string; sessionNo: string; date: string };

export type CellState = 'submitted' | 'overdue' | 'planned';
export type Cell = { state: CellState; submittedAt?: string; plannedAt?: string };
export type ProgressColumn = { id: string; label: string; form: ResponseFormId; sessionNo?: number; extra?: boolean };
export type ProgressRow = { clientCode: string; cells: Record<string, Cell> };
export type Progress = {
  columns: ProgressColumn[];
  rows: ProgressRow[];
  // 명단에 없는 응답·형식이 맞지 않는 회차(RULE-012·013), 종료 리포트보다 먼저 들어온 종료소감(RULE-009)
  notices: { unknownResponses: number; orderCheck: number };
};

// 구글폼이 만드는 타임스탬프 열 이름 (한국어·영어 계정 모두)
const TIMESTAMP_COLUMNS = ['타임스탬프', 'Timestamp'];

function toKeys(rows: string[][]): ResponseKey[] {
  return toRecords(rows).map((r) => ({
    programId: normalizeKey(r.programId),
    clientCode: normalizeKey(r.clientCode),
    sessionNo: (r.sessionNo ?? '').trim(),
    date: parseDate(TIMESTAMP_COLUMNS.map((c) => r[c]).find(Boolean)),
  }));
}

// 오늘 날짜 (한국 시간). 예정일 지남 판정 기준
export function todayInSeoul(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);
}

// 회차 번호: 1 ~ 99 정수만 (추가 회차 포함). 그 밖은 형식 오류
function sessionNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const no = Number(value);
  return no >= 1 && no <= MAX_SESSION_NO ? no : null;
}

// roster 행에서 이 프로그램 고객의 회차별 예정일 (session1Date …)
function scheduleByClient(programId: string, rosterRows: string[][]): Map<string, Record<number, string>> {
  const schedule = new Map<string, Record<number, string>>();
  for (const r of toRecords(rosterRows)) {
    if (normalizeKey(r.programId) !== programId || !normalizeKey(r.clientCode)) continue;
    const dates: Record<number, string> = {};
    for (const [column, value] of Object.entries(r)) {
      const m = /^session(\d+)Date$/.exec(column);
      if (m && parseDate(value)) dates[Number(m[1])] = parseDate(value);
    }
    schedule.set(normalizeKey(r.clientCode), dates);
  }
  return schedule;
}

const latest = (a: string | undefined, b: string) => (!a || b > a ? b : a);

export function buildProgress(program: ProgramSummary, rosterRows: string[][], responses: ResponseRows, today: string): Progress {
  const schedule = scheduleByClient(program.programId, rosterRows);
  const clients = [...schedule.keys()].sort();
  let unknownResponses = 0;

  // 제출 기록: "고객|열 id" → 가장 최근 제출일 (RULE-011)
  const submitted = new Map<string, string>();
  const extraSessions = new Set<number>();
  for (const form of Object.keys(responses) as ResponseFormId[]) {
    for (const key of toKeys(responses[form])) {
      if (key.programId !== program.programId) continue;
      if (!schedule.has(key.clientCode)) {
        unknownResponses += 1;
        continue;
      }
      let column: string = form;
      if (form === 'journal') {
        const no = sessionNumber(key.sessionNo);
        if (no === null) {
          unknownResponses += 1;
          continue;
        }
        if (no > program.sessionCount) extraSessions.add(no);
        column = `journal-${no}`;
      }
      const id = `${key.clientCode}|${column}`;
      submitted.set(id, latest(submitted.get(id), key.date));
    }
  }

  // 열: 1 ~ 회기 수, 실제로 제출된 추가 회차, 종료 리포트, 코치·피코치 종료소감
  const columns: ProgressColumn[] = [
    ...Array.from({ length: program.sessionCount }, (_, i) => ({ id: `journal-${i + 1}`, label: `${i + 1}회`, form: 'journal' as const, sessionNo: i + 1 })),
    ...[...extraSessions]
      .sort((a, b) => a - b)
      .map((no) => ({ id: `journal-${no}`, label: `추가 ${no}회`, form: 'journal' as const, sessionNo: no, extra: true })),
    { id: 'final-report', label: '리포트', form: 'final-report' },
    { id: 'coach-reflection', label: '코치소감', form: 'coach-reflection' },
    { id: 'client-reflection', label: '피코치', form: 'client-reflection' },
  ];

  let orderCheck = 0;
  const rows = clients.map((clientCode) => {
    const cells: Record<string, Cell> = {};
    for (const col of columns) {
      const submittedAt = submitted.get(`${clientCode}|${col.id}`);
      const plannedAt = col.sessionNo ? schedule.get(clientCode)![col.sessionNo] : undefined;
      // 제출일을 읽지 못한 응답도 제출로 본다 (날짜만 비움)
      if (submittedAt !== undefined) cells[col.id] = { state: 'submitted', ...(submittedAt && { submittedAt }) };
      else if (plannedAt && plannedAt < today) cells[col.id] = { state: 'overdue', plannedAt };
      else cells[col.id] = { state: 'planned', ...(plannedAt && { plannedAt }) };
    }
    const reflected = cells['coach-reflection'].state === 'submitted' || cells['client-reflection'].state === 'submitted';
    if (reflected && cells['final-report'].state !== 'submitted') orderCheck += 1;
    return { clientCode, cells };
  });

  return { columns, rows, notices: { unknownResponses, orderCheck } };
}

// 프로그램 카드 합계 (FN-007): 고객 수, 코칭일지 제출 / 예정(고객 × 회기 수), 다음 일정
// 개인별 수치는 내보내지 않는다 (RULE-002)
export type ProgramStats = { clientCount: number; journalSubmitted: number; journalPlanned: number; nextDate: string };

export function programStats(program: ProgramSummary, rosterRows: string[][], journalRows: string[][], today: string): ProgramStats {
  const schedule = scheduleByClient(program.programId, rosterRows);
  const done = new Set<string>();
  for (const key of toKeys(journalRows)) {
    const no = sessionNumber(key.sessionNo);
    if (key.programId === program.programId && schedule.has(key.clientCode) && no !== null && no <= program.sessionCount) {
      done.add(`${key.clientCode}|${no}`);
    }
  }
  const upcoming = [...schedule.values()].flatMap((dates) => Object.values(dates)).filter((d) => d >= today);
  return {
    clientCount: schedule.size,
    journalSubmitted: done.size,
    journalPlanned: schedule.size * program.sessionCount,
    nextDate: upcoming.sort()[0] ?? '',
  };
}
