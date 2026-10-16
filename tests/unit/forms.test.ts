import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildProgramList, toRecords } from '@/lib/data/programs';
import { FORMS, formById } from '@/lib/forms';
import { RECORD_FORMS } from '@/lib/navigation';
import { buildPrefillUrl, configuredKeys, parseExtraSession } from '@/lib/prefill';

// 양식 원문과 대조할 때 공백 차이와 각주 번호(¹²³⁴)는 무시한다
const normalize = (s: string) => s.replace(/[¹²³⁴]/g, '').replace(/\s+/g, ' ').trim();

describe('forms.json 구조', () => {
  it('일지·소감 4종이 모두 정의되어 있다', () => {
    expect(FORMS.map((f) => f.id).sort()).toEqual(Object.keys(RECORD_FORMS).sort());
  });
  it('코칭일지만 회차(sessionNo) prefill 항목을 가진다 (RULE-004)', () => {
    for (const form of FORMS) expect('sessionNo' in form.prefill, form.id).toBe(form.id === 'journal');
  });
  it('폼 주소는 비어 있거나 구글폼 https 주소다', () => {
    for (const form of FORMS) if (form.formUrl) expect(form.formUrl).toMatch(/^https:\/\/docs\.google\.com\/forms\//);
  });
});

describe('forms_config 연결 값 (응답 시트 forms_config 탭)', () => {
  it('폼마다 응답 주소·편집 주소·응답 탭 이름이 있다', () => {
    for (const form of FORMS) {
      expect(form.formUrl, form.id).toMatch(/^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/viewform$/);
      expect(form.editUrl, form.id).toMatch(/^https:\/\/docs\.google\.com\/forms\/d\/[\w-]+\/edit$/);
      expect(form.responseSheet, form.id).toMatch(/^응답_/);
      for (const entry of Object.values(form.prefill)) expect(entry, form.id).toMatch(/^entry\.\d+$/);
    }
  });
  it('응답 탭 이름이 서로 겹치지 않는다', () => {
    expect(new Set(FORMS.map((f) => f.responseSheet)).size).toBe(FORMS.length);
  });
});

describe('질의 항목 원문 일치 (docs/forms/)', () => {
  const withSource = FORMS.filter((f) => f.source);
  it.each(withSource.map((f) => [f.id, f] as const))('%s: 제목·설명·문항·선택지가 원문에 있다', (_, form) => {
    const original = normalize(readFileSync(new URL(`../../${form.source}`, import.meta.url), 'utf8'));
    const texts = [form.formTitle, ...form.description, ...form.questions.flatMap((q) => [q.section, q.title, q.help ?? '', ...(q.options ?? [])])];
    for (const text of texts.filter(Boolean)) expect(original, text).toContain(normalize(text));
  });
  it('원문 문항 수와 미리보기 문항 수가 같다', () => {
    // 코칭일지·완료 보고서는 원문의 고객 성함 문항을 빼고 고객 코드(prefill)로 대체 (CLAUDE.md §7)
    expect(formById('journal').questions).toHaveLength(9);
    expect(formById('final-report').questions).toHaveLength(11);
    expect(formById('coach-reflection').questions).toHaveLength(12);
    expect(formById('client-reflection').questions).toHaveLength(12);
  });
});

describe('개인정보 (CLAUDE.md §7)', () => {
  it('어느 폼에도 고객 이름을 묻는 문항이 없다', () => {
    for (const form of FORMS) for (const q of form.questions) expect(q.title, form.id).not.toMatch(/고객.*성함/);
  });
});

describe('구글폼 생성 스크립트 (scripts/google/create-forms.gs)', () => {
  it('forms.json으로 만든 최신 상태다 — 다르면 node scripts/google/build-forms-script.mjs 실행', async () => {
    const { buildScript } = await import('../../scripts/google/build-forms-script.mjs');
    const json = JSON.parse(readFileSync(new URL('../../content/forms.json', import.meta.url), 'utf8'));
    expect(readFileSync(new URL('../../scripts/google/create-forms.gs', import.meta.url), 'utf8')).toBe(buildScript(json));
  });
});

describe('prefill 링크 (FN-006 ⑤, TC-022·023)', () => {
  const formUrl = 'https://docs.google.com/forms/d/e/FORM/viewform';
  const entries = { programId: 'entry.111', clientCode: '222', sessionNo: 'entry.333' };

  it('세 값이 entry 파라미터로 들어가고 URL 인코딩된다', () => {
    const url = new URL(buildPrefillUrl(formUrl, entries, { programId: '2026-2-DEMO-CAREER', clientCode: 'C 01', sessionNo: '3' }));
    expect(url.searchParams.get('usp')).toBe('pp_url');
    expect(url.searchParams.get('entry.111')).toBe('2026-2-DEMO-CAREER');
    expect(url.searchParams.get('entry.222')).toBe('C 01');
    expect(url.searchParams.get('entry.333')).toBe('3');
    expect(url.toString()).toContain('entry.222=C+01');
  });
  it('항목 ID가 비어 있는 값은 링크에 넣지 않는다', () => {
    const url = buildPrefillUrl(formUrl, { programId: 'entry.111', clientCode: '' }, { programId: 'P', clientCode: 'C01' });
    expect(url).toBe(`${formUrl}?usp=pp_url&entry.111=P`);
  });
  it('등록된 항목이 없으면 폼 주소를 그대로 돌려준다', () => {
    expect(buildPrefillUrl(formUrl, { programId: '', clientCode: '' }, { programId: 'P', clientCode: 'C01' })).toBe(formUrl);
    expect(configuredKeys({ programId: ' ', clientCode: '' })).toEqual([]);
  });
});

describe('코칭일지 추가 회차 입력 (TC-057)', () => {
  it('회기 수를 넘는 정수만 받고 앞뒤 공백·앞자리 0은 정리한다', () => {
    expect(parseExtraSession('6', 5)).toBe('6');
    expect(parseExtraSession(' 07 ', 5)).toBe('7');
    expect(parseExtraSession('99', 5)).toBe('99');
  });
  it('회기 수 이하·상한 초과·숫자가 아닌 값은 거절한다', () => {
    for (const input of ['', '5', '0', '100', '6.5', '-6', '6회', 'abc']) expect(parseExtraSession(input, 5), input).toBeNull();
  });
});

describe('프로그램 목록 변환 (API-001, RULE-004·005·008)', () => {
  const programs = [
    ['programId', 'name', 'org', 'type', 'sessionCount', 'startDate', 'endDate', 'status', 'formUrl_journal'],
    ['2026-2-demo-career', '예시 커리어 코칭', 'DEMO', 'career', '5', '2026-09-01', '2026-11-30', '운영중', ''],
    ['2026-1-DEMO-MENTORING', '예시 멘토링', 'DEMO', 'Mentoring', '3', '', '', '준비', 'https://docs.google.com/forms/d/e/CUSTOM/viewform'],
    ['2026-3-DEMO-LIFE', '차수 오류', 'DEMO', 'life', '5', '', '', '운영중', ''],
    ['2026-1-DEMO-LIFE', '유형 불일치', 'DEMO', 'career', '5', '', '', '운영중', ''],
    ['2026-1-DEMO2-LIFE', '회기 수 오류', 'DEMO', 'life', '0', '', '', '운영중', ''],
    [],
  ];
  const roster = [
    ['programId', 'clientCode', 'clientName', 'email', 'coachName'],
    [' 2026-2-DEMO-CAREER ', 'c02', '홍길동', 'a@example.com', '코치A'],
    ['2026-2-DEMO-CAREER', 'C01', '김철수', 'b@example.com', '코치A'],
    ['2026-1-DEMO-MENTORING', 'M01', '이영희', 'c@example.com', '코치B'],
  ];
  const result = buildProgramList(programs, roster);

  it('형식에 맞는 프로그램만 남기고 나머지는 개수로 센다', () => {
    expect(result.programs.map((p) => p.programId)).toEqual(['2026-2-DEMO-CAREER', '2026-1-DEMO-MENTORING']);
    expect(result.invalidCount).toBe(3);
  });
  it('키 값은 공백 제거·대문자로 맞춰 고객 코드를 묶는다', () => {
    expect(result.programs[0].clientCodes).toEqual(['C01', 'C02']);
    expect(result.programs[1]).toMatchObject({ type: 'mentoring', sessionCount: 3, clientCodes: ['M01'] });
  });
  it('프로그램 전용 폼 주소를 읽는다', () => {
    expect(result.programs[0].formUrls).toEqual({});
    expect(result.programs[1].formUrls.journal).toBe('https://docs.google.com/forms/d/e/CUSTOM/viewform');
  });
  it('결과에 이름·이메일이 들어가지 않는다', () => {
    const json = JSON.stringify(result);
    for (const secret of ['홍길동', '김철수', 'a@example.com', 'clientName', 'email']) expect(json).not.toContain(secret);
  });
  it('빈 행은 건너뛴다', () => {
    expect(toRecords([['a'], [], ['  '], ['x']])).toEqual([{ a: 'x' }]);
  });
});
