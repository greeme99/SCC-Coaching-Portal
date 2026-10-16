import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// 출시 전 점검 (docs/development/07.test-plan.md §4 비기능): TC-047 접근성, TC-048 200% 확대, TC-049 화면 폭 4종, TC-055 구글 API 차단
// 외부 데이터 화면은 API 응답을 가짜로 바꿔 내용이 채워진 상태로 검사한다

const PAGES = [
  '/dashboard',
  '/dashboard?program=2026-2-DEMO-CAREER',
  '/program/overview',
  '/coaching/career/2',
  '/coaching/mentoring/start',
  '/records/journal',
  '/records/client-reflection',
  '/tools',
  '/references',
  '/references/guidebook',
];

const PROGRAM = {
  programId: '2026-2-DEMO-CAREER',
  name: '예시 커리어 코칭',
  org: 'DEMO',
  type: 'career',
  sessionCount: 2,
  startDate: '2026-09-01',
  endDate: '2026-12-15',
  status: '운영중',
};

async function mockExternal(page: Page) {
  await page.route('**/api/programs', (route) =>
    route.fulfill({
      json: {
        programs: [{ ...PROGRAM, clientCodes: ['C01'], formUrls: {}, stats: { clientCount: 1, journalSubmitted: 1, journalPlanned: 2, nextDate: '2026-10-22' } }],
        invalidCount: 0,
        fetchedAt: '2026-10-15T00:00:00Z',
      },
    }),
  );
  await page.route('**/api/programs/*/progress', (route) =>
    route.fulfill({
      json: {
        program: PROGRAM,
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
            cells: {
              'journal-1': { state: 'submitted', submittedAt: '2026-09-10' },
              'journal-2': { state: 'overdue', plannedAt: '2026-10-01' },
              'final-report': { state: 'planned' },
              'coach-reflection': { state: 'planned' },
              'client-reflection': { state: 'planned' },
            },
          },
        ],
        notices: { unknownResponses: 0, orderCheck: 0 },
        fetchedAt: '2026-10-15T00:00:00Z',
      },
    }),
  );
  await page.route('**/api/references', (route) =>
    route.fulfill({ json: { files: [{ id: 'a', name: '운영 안내서.pdf', kind: 'PDF', modifiedDate: '2026-10-01', url: 'https://drive.google.com/a' }], fetchedAt: '2026-10-15T00:00:00Z' } }),
  );
  await page.route('https://mkgreeme-web.github.io/**', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<title>나눔터</title><h1>나눔터</h1>' }));
}

// 외부 데이터가 화면에 그려질 때까지 기다린다 (스켈레톤 상태 검사 방지)
async function settle(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

test.describe('TC-047 자동 접근성 검사 (WCAG 2.1 AA)', () => {
  for (const path of PAGES) {
    test(path, async ({ page }) => {
      await mockExternal(page);
      await page.goto(path);
      await settle(page);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // 다른 사이트(나눔터) 내부는 이 앱의 책임 범위 밖
        .exclude('iframe')
        .analyze();
      // 실패 시 어느 요소인지 바로 보이도록 선택자를 함께 남긴다
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' / ')} — ${v.help}`)).toEqual([]);
    });
  }
});

test.describe('TC-048·049 화면 폭별 가로 넘침 없음', () => {
  // 640px = 1280px 화면을 200% 확대한 것과 같은 CSS 폭 (TC-048)
  for (const width of [375, 640, 768, 1024, 1440]) {
    test(`${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await mockExternal(page);
      const overflowing: string[] = [];
      for (const path of PAGES) {
        await page.goto(path);
        await settle(page);
        if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) overflowing.push(path);
        if (path === '/coaching/career/2' || path === '/dashboard?program=2026-2-DEMO-CAREER') {
          await testInfo.attach(`${width}px ${path}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
        }
      }
      expect(overflowing).toEqual([]);
    });
  }
});

test('TC-055 구글 API를 쓸 수 없어도 가이드·일지 화면은 정상', async ({ page }) => {
  // 테스트 서버에는 구글 연결 설정이 없어 API가 503을 돌려준다 — 가짜 응답 없이 그대로 확인
  await page.goto('/coaching/career/2');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/records/journal');
  await expect(page.getByText('질의 항목 미리보기')).toBeVisible();
  await expect(page.getByText('목록을 불러오지 못했습니다', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: '값 없이 구글폼 열기' })).toBeVisible();
  await page.goto('/references');
  await expect(page.getByRole('link', { name: /코칭 프로그램 가이드북/ })).toBeVisible();
});
