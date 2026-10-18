import { describe, expect, it } from 'vitest';
import { checkAccess, constantTimeEqual, passwordFromHeader, safeNext, sessionToken } from '@/lib/basic-auth';

const basic = (user: string, pass: string) => `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;

describe('passwordFromHeader', () => {
  it('Basic 헤더에서 비밀번호를 꺼낸다', () => {
    expect(passwordFromHeader(basic('coach', 's3cret'))).toBe('s3cret');
  });
  it('비밀번호에 콜론이 있어도 첫 콜론 뒤 전체를 쓴다', () => {
    expect(passwordFromHeader(basic('a', 'x:y:z'))).toBe('x:y:z');
  });
  it('한글 비밀번호를 UTF-8로 해석한다', () => {
    expect(passwordFromHeader(basic('코치', '비밀번호'))).toBe('비밀번호');
  });
  it.each([null, '', 'Bearer abc', 'Basic', 'Basic !!!', `Basic ${Buffer.from('nocolon').toString('base64')}`])(
    '형식이 틀리면 null: %s',
    (header) => {
      expect(passwordFromHeader(header)).toBeNull();
    },
  );
});

describe('constantTimeEqual', () => {
  it('같으면 true, 다르면 false', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'abcd')).toBe(false);
    expect(constantTimeEqual('', '')).toBe(true);
  });
});

describe('checkAccess (TC-007 ~ TC-010, DEC-029)', () => {
  it('세션 쿠키가 맞으면 ok (TC-009)', async () => {
    expect(await checkAccess(null, await sessionToken('pw'), 'pw')).toBe('ok');
  });
  it('Basic 헤더 비밀번호가 맞아도 ok (자동 테스트용)', async () => {
    expect(await checkAccess(basic('any', 'pw'), undefined, 'pw')).toBe('ok');
  });
  it('쿠키·헤더가 없으면 unauthorized (TC-007)', async () => {
    expect(await checkAccess(null, undefined, 'pw')).toBe('unauthorized');
  });
  it('비밀번호가 틀리거나, 비밀번호를 바꾸기 전 쿠키면 unauthorized (TC-008)', async () => {
    expect(await checkAccess(basic('any', 'wrong'), undefined, 'pw')).toBe('unauthorized');
    expect(await checkAccess(null, await sessionToken('old-pw'), 'pw')).toBe('unauthorized');
    expect(await checkAccess(null, 'pw', 'pw')).toBe('unauthorized');
  });
  it('SITE_PASSWORD가 없으면 misconfigured (TC-010)', async () => {
    expect(await checkAccess(basic('any', 'pw'), undefined, undefined)).toBe('misconfigured');
    expect(await checkAccess(basic('any', ''), undefined, '')).toBe('misconfigured');
  });
});

describe('세션 쿠키와 돌아갈 주소', () => {
  it('쿠키 값에는 비밀번호가 그대로 들어가지 않는다', async () => {
    const token = await sessionToken('my-secret');
    expect(token).not.toContain('my-secret');
    expect(token).toBe(await sessionToken('my-secret'));
  });
  it('같은 사이트 경로만 허용하고 나머지는 메인 화면으로', () => {
    expect(safeNext('/records/journal?x=1')).toBe('/records/journal?x=1');
    for (const value of [null, '', 'https://evil.example', '//evil.example', '/\\evil', '/login', '/login?next=/x']) {
      expect(safeNext(value), String(value)).toBe('/');
    }
  });
});
