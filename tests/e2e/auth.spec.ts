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
