import { expect, test } from '@playwright/test';

// TC-001 ~ TC-005, TC-016 (docs/development/07.test-plan.md)
test.describe('앱 셸·사이드바', () => {
  test('TC-001 1440px: 사이드바 펼침, 6묶음 순서', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    const nav = page.getByRole('navigation', { name: '주 메뉴' });
    await expect(nav).toBeInViewport();
    await expect(nav.getByRole('heading', { level: 2 })).toHaveText([
      '프로그램',
      '코칭 모델',
      '일지·소감',
      '대시보드',
      '코치 도구',
      '자료',
    ]);
    await expect(nav.getByRole('link', { name: '프로그램 현황' })).toHaveAttribute('aria-current', 'page');
  });

  test('TC-002 768px: 기본 접힘, ☰로 열고 Esc로 닫으면 초점 복귀', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/program/overview');
    const menu = page.getByRole('button', { name: '메뉴 열기/닫기' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });

  test('TC-003 /coaching/mentoring/3: 멘토링만 펼치고 3회기 강조', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/coaching/mentoring/3');
    const nav = page.getByRole('navigation', { name: '주 메뉴' });
    await expect(nav.getByRole('button', { name: '멘토링 코칭' })).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('button', { name: '커리어 코칭' })).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('link', { name: /3회기 · 미래 방향과 자원/ })).toHaveAttribute('aria-current', 'page');
  });

  test('TC-004 메뉴 링크로 이동', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    const nav = page.getByRole('navigation', { name: '주 메뉴' });
    for (const [name, path, heading] of [
      ['프로그램 개요', '/program/overview', '프로그램 개요'],
      ['코칭일지', '/records/journal', '코칭일지'],
      ['피코치 종료소감', '/records/client-reflection', '피코치 종료소감'],
      ['코칭 툴 나눔터', '/tools', '코칭 툴 나눔터'],
      ['참조 자료실', '/references', '참조 자료실'],
    ] as const) {
      await nav.getByRole('link', { name }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    }
  });

  test('TC-005 브라우저 저장소 차단 시에도 동작', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('blocked');
        },
      });
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    const menu = page.getByRole('button', { name: '메뉴 열기/닫기' });
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  test('TC-016 없는 유형·단계는 404', async ({ page }) => {
    for (const path of ['/coaching/finance/2', '/coaching/career/9', '/records/unknown']) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('요청한 화면을 찾을 수 없습니다');
    }
  });

  test('첫 화면은 대시보드로 이동', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/dashboard');
  });
});
