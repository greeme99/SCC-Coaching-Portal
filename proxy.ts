import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, checkAccess } from '@/lib/basic-auth';
import { isKnownDynamicPath } from '@/lib/navigation';

// 로그인 없이 열리는 주소: 로그인 화면과 비밀번호 확인 API
const PUBLIC_PATHS = new Set(['/login', '/api/login']);

// 모든 화면·API 앞에서 공용 비밀번호(세션 쿠키)를 확인한다 (FN-002, DEC-029). 로고·폰트 등 정적 파일은 통과
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const result = await checkAccess(
    request.headers.get('authorization'),
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.SITE_PASSWORD,
  );

  if (result === 'misconfigured') {
    return new NextResponse(blockedPage('관리자 설정이 필요합니다.'), {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  if (PUBLIC_PATHS.has(pathname)) {
    // 이미 들어온 코치가 로그인 화면을 열면 메인 화면으로 보낸다
    if (result === 'ok' && pathname === '/login') return NextResponse.redirect(sameHost(request, '/'));
    return NextResponse.next();
  }

  if (result === 'ok') {
    // 동적 주소의 잘못된 값은 화면을 그리기 전에 404로 돌린다.
    // 부분 프리렌더(PPR)에서는 페이지 안의 notFound()가 상태 코드 200으로 나가기 때문 (TC-016)
    if (!isKnownDynamicPath(pathname)) {
      return NextResponse.rewrite(new URL('/__not-found', request.url));
    }
    return NextResponse.next();
  }

  // API는 화면 이동 대신 401만 돌려준다
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 });
  }
  const next = pathname === '/' ? '' : `?${new URLSearchParams({ next: `${pathname}${search}` })}`;
  return NextResponse.redirect(sameHost(request, `/login${next}`));
}

// 브라우저가 쓴 호스트(Host 헤더) 그대로 이동한다. 호스트가 바뀌면 로그인 쿠키가 다른 사이트 것으로 취급된다
function sameHost(request: NextRequest, path: string): URL {
  const url = request.nextUrl.clone();
  const target = new URL(path, url);
  url.pathname = target.pathname;
  url.search = target.search;
  return url;
}

// 비밀번호 설정이 없을 때 보이는 단독 화면. 앱 스타일을 쓰지 못하므로 최소 HTML만
function blockedPage(message: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>삼코동 코칭 포털</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:sans-serif">
<main style="text-align:center;padding:24px"><img src="/brand/samkodong-logo-original.svg" alt="삼코동 Samsung Coaching Club" height="56"><p>${message}</p></main></body></html>`;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|brand/|favicon.ico|robots.txt).*)'],
};
