import { expect, test, type Page } from '@playwright/test';

// TC-029 ~ TC-041 화면 동작 (docs/development/07.test-plan.md)
// 시트 판정 규칙은 단위 테스트(tests/unit/dashboard.test.ts)에서, 여기서는 API 응답을 가짜로 바꿔 화면만 검사한다
const stats = (clientCount: number, journalSubmitted: number, journalPlanned: number, nextDate = '') => ({ clientCount, journalSubmitted, journalPlanned, nextDate });
const base = { org: 'DEMO', clientCodes: [], formUrls: {} };
const PROGRAMS = {
  programs: [
    { ...base, programId: '2026-2-DEMO-CAREER', name: '예시 커리어 코칭', type: 'career', sessionCount: 5, startDate: '2026-09-01', endDate: '2026-12-15', status: '운영중', stats: stats(3, 3, 15, '2026-10-22') },
    { ...base, programId: '2026-2-DEMO-MENTORING', name: '예시 멘토링 코칭', type: 'mentoring', sessionCount: 3, startDate: '2026-09-15', endDate: '2026-12-20', status: '준비', stats: stats(0, 0, 0) },
    { ...base, programId: '2026-1-DEMO-LIFE', name: '예시 라이프 코칭', type: 'life', sessionCount: 5, startDate: '2026-03-02', endDate: '2026-06-30', status: '종료', stats: stats(4, 20, 20) },
  ],
  invalidCount: 1,
  fetchedAt: '2026-10-15T00:00:00Z',
};
const cells = (entries: Record<string, object>) => entries;
const PROGRESS = {
  program: { programId: '2026-2-DEMO-CAREER', name: '예시 커리어 코칭', org: 'DEMO', type: 'career', sessionCount: 2, startDate: '2026-09-01', endDate: '2026-12-15', status: '운영중' },
  columns: [
    { id: 'journal-1', label: '1회', form: 'journal', sessionNo: 1 },
    { id: 'journal-2', label: '2회', form: 'journal', sessionNo: 2 },
    { id: 'final-report', label: '리포트', form: 'final-report' },
    { id: 'coach-reflection', label: '코치소감', form: 'coach-reflection' },
    { id: 'client-reflection', label: '피코치', form: 'client-reflection' },
  ],
  rows: [
    {
      clientCode: 'C01',
      cells: cells({
        'journal-1': { state: 'submitted', submittedAt: '2026-09-10' },
        'journal-2': { state: 'submitted', submittedAt: '2026-09-26' },
        'final-report': { state: 'planned' },
        'coach-reflection': { state: 'planned' },
        'client-reflection': { state: 'planned' },
      }),
    },
    {
      clientCode: 'C02',
      cells: cells({
        'journal-1': { state: 'submitted', submittedAt: '2026-09-11' },
        'journal-2': { state: 'overdue', plannedAt: '2026-09-25' },
        'final-report': { state: 'planned' },
        'coach-reflection': { state: 'submitted', submittedAt: '2026-10-10' },
        'client-reflection': { state: 'planned' },
      }),
    },
  ],
  notices: { unknownResponses: 2, orderCheck: 1 },
  fetchedAt: '2026-10-15T00:00:00Z',
};

async function mockApi(page: Page, { programs = 200, progress = 200 as number, progressBody = PROGRESS as object } = {}) {
  await page.route('**/api/programs', (route) =>
    route.fulfill({ status: programs, json: programs === 200 ? PROGRAMS : { error: { code: 'UPSTREAM_ERROR', message: '실패' } } }),
  );
  await page.route('**/api/programs/*/progress', (route) =>
    route.fulfill({ status: progress, json: progress === 200 ? progressBody : { error: { code: progress === 404 ? 'NOT_FOUND' : 'UPSTREAM_ERROR', message: '' } } }),
  );
}

const cards = (page: Page) => page.locator('main ul > li');

test('TC-029 기본 접속: 운영중 프로그램만, 카드 내용', async ({ page }) => {
  await mockApi(page);
  await page.goto('/dashboard');
  await expect(cards(page)).toHaveCount(1);
  const card = page.getByRole('link', { name: /^예시 커리어 코칭 .*운영중.*09\.01 ~ 12\.15.*진행 현황 보기$/ });
  await expect(card).toContainText('코칭일지 3 / 15');
  await expect(card).toContainText('다음 일정 10.22');
  await expect(page.getByText('마지막 갱신 09:00')).toBeVisible();
});

test('TC-030 필터 조합이 주소에 남는다', async ({ page }) => {
  await mockApi(page);
  await page.goto('/dashboard');
  await page.getByLabel('상태').selectOption('all');
  await page.getByLabel('유형').selectOption('life');
  await expect(page).toHaveURL(/status=all&type=life/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page)).toContainText('예시 라이프 코칭');
  // 주소로 다시 들어와도 같은 결과
  await page.reload();
  await expect(page.getByLabel('유형')).toHaveValue('life');
});

test('TC-031 결과 없는 조합 → 빈 상태 + 필터 초기화', async ({ page }) => {
  await mockApi(page);
  await page.goto('/dashboard?status=closed&round=2');
  await expect(page.getByText('조건에 맞는 프로그램이 없습니다.')).toBeVisible();
  await page.getByRole('button', { name: '필터 초기화' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(cards(page)).toHaveCount(1);
});

test('TC-032 형식 오류 프로그램 수 안내', async ({ page }) => {
  await mockApi(page);
  await page.goto('/dashboard');
  await expect(page.getByText('형식이 맞지 않는 프로그램 1건은 표시하지 않았습니다.')).toBeVisible();
});

test('TC-033 조회 실패 → 오류 안내 + 다시 시도', async ({ page }) => {
  let fail = true;
  await page.route('**/api/programs', (route) => route.fulfill(fail ? { status: 502, json: { error: { code: 'UPSTREAM_ERROR' } } } : { json: PROGRAMS }));
  await page.goto('/dashboard');
  await expect(page.getByText('구글 시트를 불러오지 못했습니다.')).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: '다시 시도' }).click();
  await expect(cards(page)).toHaveCount(1);
});

test('구글 연결 설정이 없으면(503) 설정 안내를 보여준다', async ({ page }) => {
  // 테스트 서버에는 서비스 계정 설정이 없어 실제 API가 503을 돌려준다 — 가짜 응답 없이 확인
  await page.goto('/dashboard');
  await expect(page.getByText('구글 시트 연결 설정이 아직 완료되지 않았습니다.', { exact: false })).toBeVisible();
  await page.goto('/references');
  await expect(page.getByText('구글 드라이브 연결 설정이 아직 완료되지 않았습니다.', { exact: false })).toBeVisible();
});

test('TC-034·037 카드 → 진행 현황표, 제출·예정일 지남 표시와 안내', async ({ page }) => {
  await mockApi(page);
  await page.goto('/dashboard');
  await page.getByRole('link', { name: /예시 커리어 코칭/ }).click();
  await expect(page).toHaveURL(/program=2026-2-DEMO-CAREER/);
  await expect(page.getByRole('heading', { name: '예시 커리어 코칭' })).toBeVisible();
  await expect(page.getByText('C01, 1회기 코칭일지, 제출, 9월 10일')).toBeAttached();
  await expect(page.getByText('C02, 2회기 코칭일지, 예정일 지남')).toBeAttached();
  await expect(page.getByText('명단에 없는 응답 2건이 있습니다.', { exact: false })).toBeVisible();
  await expect(page.getByText('작성 순서를 확인해 주세요.', { exact: false })).toBeVisible();
  // 프로그램 현황으로 돌아가기
  await page.getByRole('link', { name: '프로그램 현황' }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('진행 현황표 정렬: 머리글 버튼과 aria-sort', async ({ page }) => {
  await mockApi(page);
  await page.goto('/dashboard?program=2026-2-DEMO-CAREER');
  const firstRow = page.locator('tbody tr').first().locator('th');
  await expect(firstRow).toHaveText('C01');
  const header = page.locator('th', { has: page.getByRole('button', { name: /^고객/ }) });
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await page.getByRole('button', { name: /^고객/ }).click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await expect(firstRow).toHaveText('C02');
  // 2회 제출일 정렬: 미제출(C02)은 뒤로
  await page.getByRole('button', { name: /^2회/ }).click();
  await expect(firstRow).toHaveText('C01');
});

test('TC-041 없는 프로그램, 명단 0명', async ({ page }) => {
  await mockApi(page, { progress: 404 });
  await page.goto('/dashboard?program=2026-9-NONE-CAREER');
  await expect(page.getByRole('heading', { name: '프로그램을 찾을 수 없습니다' })).toBeVisible();

  await page.unrouteAll();
  await mockApi(page, { progressBody: { ...PROGRESS, rows: [], notices: { unknownResponses: 0, orderCheck: 0 } } });
  await page.goto('/dashboard?program=2026-2-DEMO-CAREER');
  await expect(page.getByText('등록된 참여자가 없습니다.', { exact: false })).toBeVisible();
});

test('API-002: 시트 설정이 없으면 503', async ({ request }) => {
  const res = await request.get('/api/programs/2026-2-DEMO-CAREER/progress');
  expect(res.status()).toBe(503);
});

test('375px: 현황표는 표 영역 안에서만 가로 스크롤 (페이지 넘침 없음)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockApi(page);
  await page.goto('/dashboard?program=2026-2-DEMO-CAREER');
  await expect(page.locator('table')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
