import { expect, test } from '@playwright/test';

const TYPES = ['career', 'mentoring', 'life'];
const STAGES = ['start', '1', '2', '3', '4', '5', 'follow-up'];

// TC-011 ~ TC-014 (docs/development/07.test-plan.md)
test.describe('프로그램 개요', () => {
  test('TC-011 그림의 단계를 누르면 상세 칸이 그 단계로 바뀐다 (DEC-035)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/program/overview');
    for (const [id, step] of [
      ['그림 1. 코칭 여정', 'Between 2'],
      ['그림 2. 코치 업무 절차', '세션 진행'],
    ]) {
      const card = page.locator('section').filter({ has: page.getByRole('heading', { name: id }) });
      const svg = card.locator('.md\\:block svg[role="group"]');
      const buttons = svg.getByRole('button');
      expect(await buttons.count()).toBeGreaterThan(5);
      const node = svg.getByRole('button', { name: new RegExp(step) });
      // 화면이 다 준비(hydration)되기 전의 클릭은 무시되므로 선택될 때까지 다시 누른다
      await expect(async () => {
        await node.click();
        await expect(node).toHaveAttribute('aria-pressed', 'true', { timeout: 500 });
      }).toPass();
      await expect(card.getByRole('heading', { level: 3, name: new RegExp(step) })).toBeVisible();
    }
  });

  test('TC-012 375px: 세로 그림으로 바뀌고 가로 넘침이 없다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/program/overview');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await expect(page.locator('.md\\:hidden svg').first()).toBeVisible();
  });

  test('TC-013 그림의 2회기를 고르고 가이드 열기 → 커리어 2회기로 이동', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/program/overview');
    const node = page.locator('.md\\:block svg [role="button"][aria-label^="2회기"]').first();
    await expect(async () => {
      await node.click();
      await expect(node).toHaveAttribute('aria-pressed', 'true', { timeout: 500 });
    }).toPass();
    await page.getByRole('link', { name: '2회기 가이드 열기' }).click();
    await expect(page).toHaveURL('/coaching/career/2');
  });

  test('원문은 접혀 있고, 업무 절차의 Between 안내로 가면 운영 원칙이 펼쳐진다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/program/overview');
    await expect(page.locator('details#between')).not.toHaveAttribute('open');
    const node = page.locator('.md\\:block svg [role="button"][aria-label^="4. Between 안내"]');
    await expect(async () => {
      await node.click();
      await expect(node).toHaveAttribute('aria-pressed', 'true', { timeout: 500 });
    }).toPass();
    await page.getByRole('link', { name: 'Between 안내 바로 가기' }).click();
    await expect(page.locator('details#between')).toHaveAttribute('open', '');
  });

  test('다른 화면에서 #between 주소로 들어와도 펼쳐진다', async ({ page }) => {
    await page.goto('/program/overview#between');
    await expect(page.locator('details#between')).toHaveAttribute('open', '');
  });
});

test.describe('회차 가이드', () => {
  test('TC-014 21개 화면이 모두 열리고 핵심 내용이 보인다', async ({ page }) => {
    test.setTimeout(60_000);
    for (const type of TYPES) {
      for (const stage of STAGES) {
        const res = await page.goto(`/coaching/${type}/${stage}`);
        expect(res?.status(), `${type}/${stage}`).toBe(200);
        await expect(page.getByRole('heading', { level: 2, name: '핵심 질문' })).toBeVisible();
        await expect(page.getByRole('heading', { level: 2, name: '주요 산출물' })).toBeVisible();
      }
    }
  });

  test('멘토링 화면에는 SHARE 프로토콜, 1회기에는 다음 Between Session 안내', async ({ page }) => {
    await page.goto('/coaching/mentoring/1');
    await expect(page.getByRole('heading', { name: /SHARE/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: '다음 Between Session: 일상 관찰' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '이 회기 추천 도구' })).toBeVisible();
  });
});
