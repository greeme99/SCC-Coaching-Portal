// POST /api/login — 로그인 화면의 공용 비밀번호를 확인하고 세션 쿠키를 준다 (FN-002, DEC-029)
// 화면 폼이 그대로 보내는 방식(자바스크립트 없이도 동작)이라 결과는 화면 이동(303)으로 돌려준다
import { SESSION_COOKIE, SESSION_MAX_AGE, constantTimeEqual, redirectTo, safeNext, sessionToken } from '@/lib/basic-auth';

export async function POST(request: Request) {
  const form = await request.formData();
  const password = form.get('password');
  // 돌아갈 주소: 폼 값이 있으면 그것, 없으면 입장 화면 주소(/login?next=…)에서 읽는다
  const next = safeNext(form.get('next') ?? nextFromReferer(request.headers.get('referer')));
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return redirectTo('/login', 303);

  if (typeof password !== 'string' || !constantTimeEqual(password, expected)) {
    // 틀린 비밀번호를 빠르게 반복 입력하지 못하게 잠깐 늦춘다
    // ponytail: 요청 횟수 제한 없음, 무차별 대입이 보이면 Vercel 방화벽 규칙(무료) 추가
    await new Promise((resolve) => setTimeout(resolve, 500));
    const back = new URLSearchParams({ error: '1' });
    if (next !== '/') back.set('next', next);
    return redirectTo(`/login?${back}`, 303);
  }

  const response = redirectTo(next, 303);
  response.cookies.set(SESSION_COOKIE, await sessionToken(expected), {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

function nextFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).searchParams.get('next');
  } catch {
    return null;
  }
}
