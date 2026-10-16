import { expect, test } from '@playwright/test';

// TC-019 ~ TC-021 나눔터, TC-042 ~ TC-045 참조 자료실 (docs/development/07.test-plan.md)
const HUB = 'https://mkgreeme-web.github.io/CT-Sharing_Hub/';

test.describe('코칭 툴 나눔터', () => {
  test('TC-019 나눔터를 화면 안에 표시하고 새 창 버튼을 먼저 둔다', async ({ page }) => {
    await page.route(`${HUB}**`, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>나눔터</h1>' }));
    await page.goto('/tools');
    const open = page.getByRole('link', { name: '새 창에서 열기' });
    await expect(open).toHaveAttribute('href', HUB);
    await expect(open).toHaveAttribute('target', '_blank');
    const frame = page.locator('iframe[title="코칭 툴 나눔터"]');
    await expect(frame).toHaveAttribute('src', HUB);
    await expect(page.frameLocator('iframe[title="코칭 툴 나눔터"]').getByRole('heading', { name: '나눔터' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('TC-020 8초 안에 불러오지 못하면 대체 안내 + 새 창 버튼', async ({ page }) => {
    await page.clock.install();
    // 응답하지 않는 상황을 흉내 낸다
    await page.route(`${HUB}**`, () => {});
    await page.goto('/tools', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('status')).toHaveText('불러오는 중');
    // 주소가 들어갔다 = 화면이 준비되어 8초 타이머가 걸렸다
    await expect(page.locator('iframe')).toHaveAttribute('src', HUB);
    await page.clock.runFor(8100);
    await expect(page.getByText('이 화면에서 나눔터를 표시할 수 없습니다. 새 창에서 열어 주세요.')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '새 창에서 열기' })).toHaveCount(2);
  });

  test('TC-021 CSP frame-src는 나눔터 주소만', async ({ request }) => {
    const csp = (await request.get('/tools')).headers()['content-security-policy'];
    expect(csp).toContain('frame-src https://mkgreeme-web.github.io;');
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

test.describe('참조 자료실', () => {
  const FILES = {
    files: [
      { id: 'a', name: '운영 안내서.pdf', kind: 'PDF', modifiedDate: '2026-10-01', url: 'https://drive.google.com/file/d/a/view' },
      { id: 'b', name: '코치 교육 자료', kind: '구글 슬라이드', modifiedDate: '2026-09-20', url: 'https://drive.google.com/file/d/b/view' },
    ],
    fetchedAt: '2026-10-15T00:00:00Z',
  };

  test('TC-042 고정 가이드북 + 폴더 파일 2개, 검색·정렬', async ({ page }) => {
    await page.route('**/api/references', (route) => route.fulfill({ json: FILES }));
    await page.goto('/references');
    await expect(page.getByRole('link', { name: /코칭 프로그램 가이드북/ })).toHaveAttribute('href', '/references/guidebook');
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.getByRole('link', { name: '열기 운영 안내서.pdf (새 창)' })).toHaveAttribute('href', FILES.files[0].url);
    await page.getByRole('searchbox', { name: '자료 이름 검색' }).fill('교육');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('코치 교육 자료');
    await page.getByRole('searchbox', { name: '자료 이름 검색' }).fill('');
    await page.getByRole('button', { name: /^이름/ }).click();
    await expect(page.locator('tbody tr').first()).toContainText('코치 교육 자료');
  });

  test('TC-044 빈 폴더 → 고정 자료 + 빈 상태 안내', async ({ page }) => {
    await page.route('**/api/references', (route) => route.fulfill({ json: { files: [], fetchedAt: FILES.fetchedAt } }));
    await page.goto('/references');
    await expect(page.getByRole('link', { name: /코칭 프로그램 가이드북/ })).toBeVisible();
    await expect(page.getByText('추가된 자료가 없습니다.', { exact: false })).toBeVisible();
  });

  test('TC-045 드라이브 조회 실패 → 고정 자료 + 오류 안내', async ({ page }) => {
    await page.route('**/api/references', (route) => route.fulfill({ status: 502, json: { error: { code: 'UPSTREAM_ERROR' } } }));
    await page.goto('/references');
    await expect(page.getByRole('link', { name: /코칭 프로그램 가이드북/ })).toBeVisible();
    await expect(page.getByText('구글 드라이브를 불러오지 못했습니다.', { exact: false })).toBeVisible();
  });

  test('가이드북 화면: 원문 제목·표, 외부 출처 링크 없음, 메뉴 강조', async ({ page }) => {
    await page.goto('/references/guidebook');
    await expect(page.getByRole('heading', { level: 1, name: '코칭 프로그램 가이드북' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '전체 목차' })).toBeVisible();
    expect(await page.locator('article table').count()).toBeGreaterThan(50);
    await expect(page.locator('article a')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '참조 자료실' })).toHaveAttribute('aria-current', 'page');
  });

  test('API-003: 드라이브 설정이 없으면 503', async ({ request }) => {
    expect((await request.get('/api/references')).status()).toBe(503);
  });
});
