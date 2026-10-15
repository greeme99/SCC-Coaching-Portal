import { expect, test, type Page } from '@playwright/test';

// TC-022 ~ TC-028 (docs/development/07.test-plan.md)
// 구글 시트 연결 없이 검사하도록 API-001 응답을 가짜 데이터로 바꿔 끼운다
// 공용 폼 주소(forms.json formUrl)가 아직 비어 있어, 링크는 프로그램 전용 폼 주소로 확인한다
const CUSTOM = 'https://docs.google.com/forms/d/e/CUSTOM/viewform';
const PROGRAMS = {
  programs: [
    {
      programId: '2026-2-DEMO-CAREER',
      name: '예시 커리어 코칭',
      type: 'career',
      sessionCount: 5,
      status: '운영중',
      clientCodes: ['C01', 'C02'],
      formUrls: { journal: CUSTOM, 'coach-reflection': CUSTOM, 'client-reflection': CUSTOM },
    },
    { programId: '2026-1-DEMO-MENTORING', name: '예시 멘토링', type: 'mentoring', sessionCount: 3, status: '운영중', clientCodes: ['M01'], formUrls: {} },
  ],
  invalidCount: 0,
  fetchedAt: '2026-10-15T09:00:00+09:00',
};

async function mockPrograms(page: Page, status = 200) {
  await page.route('**/api/programs', (route) =>
    route.fulfill({ status, json: status === 200 ? PROGRAMS : { error: { code: 'UPSTREAM_ERROR', message: '실패' } } }),
  );
}

test('질의 항목 미리보기: 원문 문항과 더 보기', async ({ page }) => {
  await mockPrograms(page);
  await page.goto('/records/journal');
  await expect(page.getByText('삼코동 [OO 코칭 프로그램] 회차별 코칭 일지')).toBeVisible();
  await expect(page.getByText('코치(멘토) 성함')).toBeVisible();
  const more = page.getByText('더 보기 (5개 문항)');
  await more.click();
  await expect(page.getByText('삼코동 운영팀에게 전달 및 요청 사항')).toBeVisible();
});

test('TC-022 코칭일지: 프로그램·고객 코드·회차를 고르면 폼 열기 링크가 생긴다', async ({ page }) => {
  await mockPrograms(page);
  await page.goto('/records/journal');
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-2-DEMO-CAREER');
  await page.getByLabel('고객 코드').selectOption('C01');
  await page.getByLabel('회차', { exact: true }).selectOption('3');
  const link = page.getByRole('link', { name: '구글폼 열기' });
  await expect(link).toHaveAttribute('href', CUSTOM);
  await expect(link).toHaveAttribute('target', '_blank');
});

test('TC-023 코치 종료소감: 회차 선택이 없다', async ({ page }) => {
  await mockPrograms(page);
  await page.goto('/records/coach-reflection');
  await expect(page.getByLabel('회차', { exact: true })).toHaveCount(0);
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-2-DEMO-CAREER');
  await page.getByLabel('고객 코드').selectOption('C02');
  await expect(page.getByRole('link', { name: '구글폼 열기' })).toBeVisible();
});

test('TC-024 필수 값 일부만 고르면 버튼이 비활성이고 이유를 보여준다', async ({ page }) => {
  await mockPrograms(page);
  await page.goto('/records/journal');
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-2-DEMO-CAREER');
  const button = page.getByRole('button', { name: '구글폼 열기' });
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button).toHaveAccessibleDescription('프로그램, 고객 코드, 회차를 선택하세요');
});

test('TC-025 회차 목록은 프로그램 회기 수만큼만 표시한다', async ({ page }) => {
  await mockPrograms(page);
  await page.goto('/records/journal');
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-1-DEMO-MENTORING');
  await expect(page.getByLabel('회차', { exact: true }).locator('option')).toHaveText(['선택', '1회차', '2회차', '3회차', '추가 회차 (직접 입력)']);
});

test('TC-057 코칭일지: 추가 회차를 고르고 번호를 입력하면 폼 열기 링크가 생긴다', async ({ page }) => {
  await mockPrograms(page);
  await page.goto('/records/journal');
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-1-DEMO-MENTORING');
  await page.getByLabel('고객 코드').selectOption('M01');
  await page.getByLabel('회차', { exact: true }).selectOption({ label: '추가 회차 (직접 입력)' });
  const input = page.getByLabel('추가 회차 번호');
  await expect(input).toHaveAccessibleDescription('이 프로그램은 3회기입니다. 4회차부터 입력합니다.');
  // 회기 수 이하 번호는 목록에서 고르므로 받지 않는다
  await input.fill('3');
  await expect(page.getByRole('button', { name: '구글폼 열기' })).toHaveAccessibleDescription('추가 회차 번호를 4 ~ 99 사이 숫자로 입력하세요');
  await input.fill('4');
  // DEMO-MENTORING은 전용 폼이 없고 공용 폼 주소도 아직 비어 있어, 값이 다 갖춰지면 주소 미등록 안내로 바뀐다
  await expect(page.getByRole('button', { name: '구글폼 열기' })).toHaveAccessibleDescription('구글폼 주소가 아직 등록되지 않았습니다');
});

test('TC-057 코칭일지: 전용 폼이 있으면 추가 회차로 링크가 생긴다', async ({ page }) => {
  await mockPrograms(page);
  await page.goto('/records/journal');
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-2-DEMO-CAREER');
  await page.getByLabel('고객 코드').selectOption('C01');
  await page.getByLabel('회차', { exact: true }).selectOption('extra');
  await page.getByLabel('추가 회차 번호').fill('6');
  await expect(page.getByRole('link', { name: '구글폼 열기' })).toHaveAttribute('href', CUSTOM);
});

test('TC-026 피코치 종료소감: 링크 복사 후 토스트, 이름·이메일 없음', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await mockPrograms(page);
  await page.goto('/records/client-reflection');
  await expect(page.getByRole('link', { name: '구글폼 열기' })).toHaveCount(0);
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-2-DEMO-CAREER');
  await page.getByLabel('고객 코드').selectOption('C01');
  await page.getByRole('button', { name: '링크 복사' }).click();
  await expect(page.getByRole('status')).toHaveText('링크를 복사했습니다');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(CUSTOM);
  expect(copied).not.toMatch(/@|name|email/i);
});

test('TC-027 클립보드를 쓸 수 없으면 링크 상자를 선택 상태로 보여준다', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } });
  });
  await mockPrograms(page);
  await page.goto('/records/client-reflection');
  await page.getByLabel('프로그램', { exact: true }).selectOption('2026-2-DEMO-CAREER');
  await page.getByLabel('고객 코드').selectOption('C01');
  await page.getByRole('button', { name: '링크 복사' }).click();
  const box = page.getByLabel('아래 링크를 복사해 전달하세요');
  await expect(box).toHaveValue(CUSTOM);
  await expect(box).toBeFocused();
});

test('TC-028 목록 조회 실패: 안내 문구를 보여준다', async ({ page }) => {
  await mockPrograms(page, 502);
  await page.goto('/records/journal');
  await expect(page.getByText('목록을 불러오지 못했습니다')).toBeVisible();
  // 공용 폼 주소가 등록되기 전이라 [값 없이 구글폼 열기] 대신 비활성 버튼과 이유가 나온다
  await expect(page.getByRole('button', { name: '구글폼 열기' })).toHaveAccessibleDescription('구글폼 주소가 아직 등록되지 않았습니다');
});

test('API-001: 시트 설정이 없으면 503 MISCONFIGURED', async ({ request }) => {
  const res = await request.get('/api/programs');
  expect(res.status()).toBe(503);
  expect((await res.json()).error.code).toBe('MISCONFIGURED');
});
