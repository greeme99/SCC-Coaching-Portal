// 공용 비밀번호 확인 (FN-002, DEC-007). 사용자 계정·역할 개념 없음 — 비밀번호만 비교한다.

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

export function checkAccess(header: string | null, expected: string | undefined): AccessResult {
  // 비밀번호 미설정 상태로 열린 채 배포되는 것을 막는다
  if (!expected) return 'misconfigured';
  const given = passwordFromHeader(header);
  return given !== null && constantTimeEqual(given, expected) ? 'ok' : 'unauthorized';
}
