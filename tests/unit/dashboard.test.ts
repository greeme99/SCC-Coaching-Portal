import { describe, expect, it } from 'vitest';
import { buildProgramList, filterPrograms, parseDate, readFilter } from '@/lib/data/programs';
import { buildProgress, programStats, todayInSeoul, type ResponseRows } from '@/lib/data/progress';

// TC-029 ~ TC-039 테스트 시트 (가짜 데이터). 기준일 2026-10-15
const TODAY = '2026-10-15';
const PROGRAMS = [
  ['programId', 'name', 'org', 'type', 'sessionCount', 'startDate', 'endDate', 'status'],
  ['2026-2-DEMO-CAREER', '예시 커리어 코칭', 'DEMO', 'career', '5', '2026. 9. 1', '2026. 12. 15', '운영중'],
  ['2026-2-DEMO-MENTORING', '예시 멘토링 코칭', 'DEMO', 'mentoring', '3', '2026-09-15', '2026-12-20', '준비'],
  ['2026-1-DEMO-LIFE', '예시 라이프 코칭', 'DEMO', 'life', '5', '2026-03-02', '2026-06-30', '종료'],
  ['2026-1-DEMO2-CAREER', '상태 빈 행', 'DEMO2', 'career', '5', '', '', ''],
  ['2026-X-BAD-CAREER', '형식 오류', 'BAD', 'career', '5', '', '', '운영중'],
];
const ROSTER = [
  ['programId', 'clientCode', 'clientName', 'email', 'coachName', 'session1Date', 'session2Date', 'session3Date', 'session4Date', 'session5Date'],
  ['2026-2-DEMO-CAREER', 'C01', '홍길동', 'hong@example.com', '코치A', '2026-09-10', '2026-09-24', '2026-10-08', '2026-10-22', '2026-11-05'],
  ['2026-2-DEMO-CAREER', 'C02', '김철수', 'kim@example.com', '코치A', '2026-09-11', '2026-09-25'],
  ['2026-2-DEMO-CAREER', 'C03', '이영희', 'lee@example.com', '코치B'],
];
const SECRET_ANSWER = '고객이 다룬 주요 이슈 - 비공개 응답 내용';
const RESPONSES: ResponseRows = {
  journal: [
    ['타임스탬프', '이메일 주소', 'programId', 'clientCode', 'sessionNo', '오늘 세션의 핵심 코칭 주제(Goal) 및 주요 대화 내용'],
    ['2026. 9. 10 오후 3:00:00', 'coach@example.com', '2026-2-DEMO-CAREER', 'C01', '1', SECRET_ANSWER],
    ['2026. 9. 24 오후 3:00:00', 'coach@example.com', '2026-2-DEMO-CAREER', 'c01 ', '2', SECRET_ANSWER],
    ['2026. 9. 26 오전 9:00:00', 'coach@example.com', '2026-2-DEMO-CAREER', 'C01', '2', SECRET_ANSWER],
    ['2026. 9. 11 오후 3:00:00', 'coach@example.com', '2026-2-DEMO-CAREER', 'C02', '1', SECRET_ANSWER],
    ['2026. 10. 1 오후 3:00:00', 'coach@example.com', '2026-2-DEMO-CAREER', 'C99', '1', SECRET_ANSWER],
    ['2026. 10. 2 오후 3:00:00', 'coach@example.com', '2026-2-DEMO-CAREER', 'C03', '7', SECRET_ANSWER],
    ['2026. 10. 3 오후 3:00:00', 'coach@example.com', '2026-2-DEMO-CAREER', 'C03', '삼', SECRET_ANSWER],
    ['2026. 10. 4 오후 3:00:00', 'coach@example.com', '2026-2-DEMO-MENTORING', 'M01', '1', SECRET_ANSWER],
  ],
  'final-report': [['타임스탬프', 'programId', 'clientCode']],
  'coach-reflection': [
    ['타임스탬프', 'programId', 'clientCode'],
    ['2026. 10. 10 오전 10:00:00', '2026-2-DEMO-CAREER', 'C02'],
  ],
  'client-reflection': [['타임스탬프', 'programId', 'clientCode']],
};

const list = buildProgramList(PROGRAMS, ROSTER);
const career = list.programs.find((p) => p.programId === '2026-2-DEMO-CAREER')!;
const progress = buildProgress(career, ROSTER, RESPONSES, TODAY);
const cell = (client: string, column: string) => progress.rows.find((r) => r.clientCode === client)!.cells[column];
const ids = (programs: { programId: string }[]) => programs.map((p) => p.programId);

describe('날짜 읽기', () => {
  it('시트 표시 형식이 달라도 YYYY-MM-DD로 바꾼다', () => {
    expect(parseDate('2026. 9. 1')).toBe('2026-09-01');
    expect(parseDate('2026. 10. 16 오전 9:20:03')).toBe('2026-10-16');
    expect(parseDate('2026-10-20')).toBe('2026-10-20');
    expect(parseDate('')).toBe('');
  });
  it('오늘은 한국 시간 기준이다', () => {
    expect(todayInSeoul(new Date('2026-10-15T16:00:00Z'))).toBe('2026-10-16');
  });
});

describe('프로그램 현황 필터 (FN-007)', () => {
  it('TC-029 기본 필터는 운영중', () => {
    expect(ids(filterPrograms(list.programs, readFilter(new URLSearchParams())))).toEqual(['2026-2-DEMO-CAREER']);
  });
  it('TC-030 상태=전체, 유형=라이프', () => {
    expect(ids(filterPrograms(list.programs, readFilter(new URLSearchParams('status=all&type=life'))))).toEqual(['2026-1-DEMO-LIFE']);
  });
  it('TC-031 결과 없는 조합은 빈 목록', () => {
    expect(filterPrograms(list.programs, readFilter(new URLSearchParams('status=closed&round=2')))).toEqual([]);
  });
  it('TC-032 형식 오류는 개수로, 빈 상태는 "상태 미지정"으로 (RULE-005·010)', () => {
    expect(list.invalidCount).toBe(1);
    expect(list.programs.find((p) => p.programId === '2026-1-DEMO2-CAREER')!.status).toBe('상태 미지정');
    expect(ids(filterPrograms(list.programs, readFilter(new URLSearchParams('status=unset'))))).toEqual(['2026-1-DEMO2-CAREER']);
  });
  it('전체 보기는 시작일 최신순, 시작일 없는 프로그램은 뒤로', () => {
    expect(ids(filterPrograms(list.programs, readFilter(new URLSearchParams('status=all'))))).toEqual([
      '2026-2-DEMO-MENTORING',
      '2026-2-DEMO-CAREER',
      '2026-1-DEMO-LIFE',
      '2026-1-DEMO2-CAREER',
    ]);
  });
  it('연도·차수는 프로그램 ID에서 읽는다', () => {
    expect(ids(filterPrograms(list.programs, readFilter(new URLSearchParams('status=all&year=2026&round=1'))))).toEqual(['2026-1-DEMO-LIFE', '2026-1-DEMO2-CAREER']);
  });
});

describe('프로그램 카드 합계', () => {
  it('고객 수, 코칭일지 제출 / 예정, 다음 일정', () => {
    // 제출: C01 1·2회, C02 1회 (중복·명단 외·추가 회차·형식 오류는 세지 않음)
    expect(programStats(career, ROSTER, RESPONSES.journal, TODAY)).toEqual({ clientCount: 3, journalSubmitted: 3, journalPlanned: 15, nextDate: '2026-10-22' });
  });
});

describe('진행 현황표 (FN-008)', () => {
  it('TC-034 명단 순서대로 고객 행, 회차·종료 기록 열', () => {
    expect(progress.rows.map((r) => r.clientCode)).toEqual(['C01', 'C02', 'C03']);
    expect(progress.columns.map((c) => c.label)).toEqual(['1회', '2회', '3회', '4회', '5회', '추가 7회', '리포트', '코치소감', '피코치']);
    expect(cell('C01', 'journal-1')).toEqual({ state: 'submitted', submittedAt: '2026-09-10' });
    expect(cell('C02', 'journal-1').state).toBe('submitted');
  });
  it('TC-035 같은 키 중복 응답은 한 칸, 가장 최근 제출일 (RULE-011)', () => {
    expect(cell('C01', 'journal-2')).toEqual({ state: 'submitted', submittedAt: '2026-09-26' });
  });
  it('TC-036 명단 외 고객·형식이 맞지 않는 회차는 표에 넣지 않고 개수만 안내 (RULE-012·013)', () => {
    expect(progress.rows.some((r) => r.clientCode === 'C99')).toBe(false);
    expect(progress.notices.unknownResponses).toBe(2);
  });
  it('TC-057 회기 수를 넘는 추가 회차는 별도 열로 표시', () => {
    expect(cell('C03', 'journal-7')).toEqual({ state: 'submitted', submittedAt: '2026-10-02' });
    expect(cell('C01', 'journal-7').state).toBe('planned');
  });
  it('TC-037 종료 리포트 없이 종료소감 → 제출 표시 + 작성 순서 안내 (RULE-009)', () => {
    expect(cell('C02', 'coach-reflection').state).toBe('submitted');
    expect(progress.notices.orderCheck).toBe(1);
  });
  it('TC-038 예정일 < 오늘인 미제출 칸만 예정일 지남', () => {
    expect(cell('C01', 'journal-3')).toEqual({ state: 'overdue', plannedAt: '2026-10-08' });
    expect(cell('C01', 'journal-4')).toEqual({ state: 'planned', plannedAt: '2026-10-22' });
    expect(cell('C02', 'journal-2')).toEqual({ state: 'overdue', plannedAt: '2026-09-25' });
    expect(cell('C03', 'journal-1')).toEqual({ state: 'planned' });
  });
  it('TC-039 이름·이메일·응답 내용이 결과에 없다 (RULE-003·008)', () => {
    const json = JSON.stringify({ list, progress, stats: programStats(career, ROSTER, RESPONSES.journal, TODAY) });
    for (const secret of ['홍길동', '김철수', '이영희', 'example.com', SECRET_ANSWER, '코치A']) expect(json).not.toContain(secret);
  });
  it('TC-041 명단이 비면 행이 없다', () => {
    const mentoring = list.programs.find((p) => p.programId === '2026-2-DEMO-MENTORING')!;
    const empty = buildProgress(mentoring, ROSTER, RESPONSES, TODAY);
    expect(empty.rows).toEqual([]);
    expect(empty.notices.unknownResponses).toBe(1);
  });
});
