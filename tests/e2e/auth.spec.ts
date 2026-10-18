import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { TEST_PASSWORD } from '../../playwright.config';

// TC-007 ~ TC-009 (TC-010 설정 누락은 단위 테스트에서 검사). DEC-029: 브라우저 비밀번호 창 대신 로그인 화면 + 세션 쿠키
const KAKAO_UA = 'Mozilla/5.0 (Linux; Android 14; SM-F956N) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 KAKAOTALK 10.8.0';

test.describe('접근 비밀번호 — 요청 단위', () => {
  test('TC-007 비밀번호 없이 화면을 열면 로그인 화면으로 보낸다 (돌아올 주소 포함)', async ({ baseURL }) => {
    // Playwright 요청 객체는 설정된 비밀번호를 늘 붙이므로 기본 fetch로 확인한다
    const res = await fetch(`${baseURL}/records/journal?x=1`, { redirect: 'manual' });
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location')!, baseURL);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('next')).toBe('/records/journal?x=1');
    // 브라우저 기본 비밀번호 창을 띄우지 않는다
    expect(res.headers.get('www-authenticate')).toBeNull();
  });

  test('API는 로그인 없이 401만 돌려준다', async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/api/programs`, { redirect: 'manual' });
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('UNAUTHORIZED');
  });

  test('TC-008 틀린 비밀번호 헤더도 로그인 화면으로', async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/dashboard`, {
      redirect: 'manual',
      headers: { authorization: `Basic ${Buffer.from('coach:wrong').toString('base64')}` },
    });
    expect(res.status).toBe(307);
  });

  test('로그인 뒤 돌아갈 주소는 같은 사이트 안으로만', async ({ baseURL }) => {
    const body = new URLSearchParams({ password: TEST_PASSWORD, next: '//evil.example/x' });
    const res = await fetch(`${baseURL}/api/login`, { method: 'POST', body, redirect: 'manual' });
    expect(res.status).toBe(303);
    expect(new URL(res.headers.get('location')!, baseURL).pathname).toBe('/dashboard');
    // 쿠키는 자바스크립트로 읽을 수 없게 만든다
    expect(res.headers.get('set-cookie')).toMatch(/scd_session=.+HttpOnly/i);
  });

  test('카카오톡 인앱 브라우저에서도 로그인 화면이 열린다', async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/login`, { headers: { 'user-agent': KAKAO_UA } });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('공용 비밀번호를 입력해 주세요');
  });

  test('로고 등 정적 파일은 비밀번호 없이 열린다', async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/brand/samkodong-logo-original.svg`);
    expect(res.status).toBe(200);
  });
});

test.describe('로그인 화면', () => {
  // 이 묶음은 자동 비밀번호 헤더 없이 실제 코치처럼 화면에서 입력한다
  test.use({ extraHTTPHeaders: {} });

  test('첫 접속: 로고·환영 문구·비밀번호 칸만 보이고 메뉴는 없다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('img', { name: '삼코동 Samsung Coaching Club' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: '삼코동 코칭 포털에 오신 것을 환영합니다' })).toBeVisible();
    await expect(page.getByText('코치 전용 공간 접속하기')).toBeVisible();
    await expect(page.getByLabel('공용 비밀번호를 입력해 주세요')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '주 메뉴' })).toHaveCount(0);
  });

  test('TC-047 접근성 위반 0건, 375px에서 가로 넘침 없음', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login?error=1');
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });

  test('TC-008 틀린 비밀번호 → 안내 후 다시 입력', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByLabel('공용 비밀번호를 입력해 주세요').fill('wrong');
    await page.getByRole('button', { name: '입장하기' }).click();
    // 대시보드는 기본 이동 주소라 next를 붙이지 않는다
    await expect(page).toHaveURL(/\/login\?error=1$/);
    // Next.js의 화면 이동 안내(route announcer)도 alert라 문구로 찾는다
    await expect(page.getByText('비밀번호가 맞지 않습니다. 다시 입력해 주세요.')).toHaveAttribute('role', 'alert');
    await expect(page.getByLabel('공용 비밀번호를 입력해 주세요')).toHaveAttribute('aria-invalid', 'true');
  });

  test('TC-009 맞는 비밀번호 → 원래 열려던 화면으로, 다시 열어도 유지', async ({ page }) => {
    await page.goto('/records/journal');
    await page.getByLabel('공용 비밀번호를 입력해 주세요').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: '입장하기' }).click();
    await expect(page).toHaveURL(/\/records\/journal$/);
    await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
    // 세션 쿠키로 다시 입력하지 않는다. 로그인 화면을 열면 대시보드로 보낸다
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
