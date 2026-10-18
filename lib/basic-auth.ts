// 공용 비밀번호 확인 (FN-002, DEC-007, DEC-029). 사용자 계정·역할 개념 없음 — 비밀번호만 비교한다.
// 코치는 로그인 화면(/login)에서 비밀번호를 넣고 세션 쿠키를 받는다. Basic 헤더는 자동 테스트용으로만 받는다
// (카카오톡 등 인앱 브라우저는 Basic 인증 창을 띄우지 못해 로그인 화면으로 바꿨다 — DEC-029)

import { NextResponse } from 'next/server';

export type AccessResult = 'ok' | 'unauthorized' | 'misconfigured';

// Authorization: Basic base64(user:password) 에서 비밀번호만 꺼낸다. 형식이 틀리면 null
export function passwordFromHeader(header: string | null): string | null {
  if (!header) return null;
  const [scheme, encoded] = header.split(' ');
  if (scheme?.toLowerCase() !== 'basic' || !encoded) return null;
  let decoded: string;
  try {
    decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const sep = decoded.indexOf(':');
  return sep === -1 ? null : decoded.slice(sep + 1);
}

// 길이·내용과 관계없이 같은 시간 동안 비교해 응답 시간으로 비밀번호를 추측하지 못하게 한다
export function constantTimeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const len = Math.max(ea.length, eb.length);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < len; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

export const SESSION_COOKIE = 'scd_session';
// 태블릿에서 매번 입력하지 않도록 30일 유지. 비밀번호를 바꾸면 기존 쿠키는 모두 무효가 된다
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

// 쿠키에는 비밀번호 자체가 아니라 비밀번호로 서명한 고정 값(HMAC-SHA256)을 넣는다
export async function sessionToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('scd-coach-session-v1'));
  return Buffer.from(signature).toString('base64url');
}

// 로그인 뒤 돌아갈 주소. 같은 사이트 안의 경로만 허용한다 (다른 사이트로 보내는 공격 방지)
export function safeNext(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.startsWith('/login')) {
    return '/dashboard';
  }
  return value;
}

export async function checkAccess(header: string | null, cookie: string | undefined, expected: string | undefined): Promise<AccessResult> {
  // 비밀번호 미설정 상태로 열린 채 배포되는 것을 막는다
  if (!expected) return 'misconfigured';
  if (cookie && constantTimeEqual(cookie, await sessionToken(expected))) return 'ok';
  const given = passwordFromHeader(header);
  return given !== null && constantTimeEqual(given, expected) ? 'ok' : 'unauthorized';
}

// 로그인 API의 이동 주소는 경로만 쓴다 (브라우저가 지금 주소 기준으로 해석 — 호스트가 바뀌지 않아 쿠키가 유지된다)
export function redirectTo(path: string, status: 303 | 307) {
  return new NextResponse(null, { status, headers: { location: path } });
}
