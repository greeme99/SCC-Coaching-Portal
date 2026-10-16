import { expect, test } from '@playwright/test';
import { TEST_PASSWORD } from '../../playwright.config';

// TC-007 ~ TC-009 (TC-010 설정 누락은 단위 테스트에서 검사)
test.describe('접근 비밀번호', () => {
  test('TC-007 비밀번호 없이 요청하면 401 + Basic 인증 요구', async ({ baseURL }) => {
    // Playwright 요청 객체는 401을 받으면 설정된 비밀번호로 다시 보내므로 기본 fetch로 확인한다
    const res = await fetch(`${baseURL}/dashboard`, { redirect: 'manual' });
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toContain('Basic');
  });

  test('카카오톡 인앱 브라우저는 비밀번호 창이 없어 외부 브라우저로 넘긴다', async ({ baseURL }) => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; SM-F956N) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 KAKAOTALK 10.8.0';
    const res = await fetch(`${baseURL}/dashboard`, { headers: { 'user-agent': ua } });
    expect(res.status).toBe(401);
    const html = await res.text();
    // 서버가 보는 호스트 이름(localhost/127.0.0.1)은 환경마다 달라 경로만 확인한다
    expect(html).toMatch(/kakaotalk:\/\/web\/openExternal\?url=http[^"]*%2Fdashboard/);
    expect(html).toContain('외부 브라우저로 열기');
  });

  test('휴대폰 브라우저에는 다른 브라우저로 여는 방법을 안내한다', async ({ baseURL }) => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram';
    const html = await (await fetch(`${baseURL}/dashboard`, { headers: { 'user-agent': ua } })).text();
    expect(html).toContain('다른 브라우저로 열기');
    expect(html).not.toContain('kakaotalk://');
  });

  test('TC-008 틀린 비밀번호는 401', async ({ request }) => {
    const res = await request.get('/dashboard', {
      headers: { authorization: `Basic ${Buffer.from('coach:wrong').toString('base64')}` },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-009 맞는 비밀번호는 200', async ({ request }) => {
    const res = await request.get('/dashboard', {
      headers: { authorization: `Basic ${Buffer.from(`coach:${TEST_PASSWORD}`).toString('base64')}` },
    });
    expect(res.status()).toBe(200);
  });

  test('로고 등 정적 파일은 비밀번호 없이 열린다', async ({ baseURL }) => {
    const res = await fetch(`${baseURL}/brand/samkodong-logo-original.svg`);
    expect(res.status).toBe(200);
  });
});
