import { describe, expect, it } from 'vitest';
import { checkAccess, constantTimeEqual, passwordFromHeader } from '@/lib/basic-auth';

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

describe('checkAccess (TC-007 ~ TC-010)', () => {
  it('비밀번호가 맞으면 ok (TC-009)', () => {
    expect(checkAccess(basic('any', 'pw'), 'pw')).toBe('ok');
  });
  it('헤더가 없으면 unauthorized (TC-007)', () => {
    expect(checkAccess(null, 'pw')).toBe('unauthorized');
  });
  it('비밀번호가 틀리면 unauthorized (TC-008)', () => {
    expect(checkAccess(basic('any', 'wrong'), 'pw')).toBe('unauthorized');
  });
  it('SITE_PASSWORD가 없으면 misconfigured (TC-010)', () => {
    expect(checkAccess(basic('any', 'pw'), undefined)).toBe('misconfigured');
    expect(checkAccess(basic('any', ''), '')).toBe('misconfigured');
  });
});
