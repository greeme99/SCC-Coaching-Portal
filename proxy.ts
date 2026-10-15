import { NextResponse, type NextRequest } from 'next/server';
import { checkAccess } from '@/lib/basic-auth';
import { isKnownDynamicPath } from '@/lib/navigation';

// 모든 화면·API 앞에서 공용 비밀번호를 확인한다 (FN-002). 로고·폰트 등 정적 파일은 통과
export function proxy(request: NextRequest) {
  const result = checkAccess(request.headers.get('authorization'), process.env.SITE_PASSWORD);
  if (result === 'ok') {
    // 동적 주소의 잘못된 값은 화면을 그리기 전에 404로 돌린다.
    // 부분 프리렌더(PPR)에서는 페이지 안의 notFound()가 상태 코드 200으로 나가기 때문 (TC-016)
    if (!isKnownDynamicPath(request.nextUrl.pathname)) {
      return NextResponse.rewrite(new URL('/__not-found', request.url));
    }
    return NextResponse.next();
  }

  if (result === 'misconfigured') {
    return new NextResponse(blockedPage('관리자 설정이 필요합니다.'), {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  return new NextResponse(blockedPage('삼코동 코칭 포털은 비밀번호가 필요합니다. 운영진에게 문의하세요.'), {
    status: 401,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'www-authenticate': 'Basic realm="SCD Coaching Portal", charset="UTF-8"',
    },
  });
}

// 비밀번호 창을 취소했을 때 보이는 단독 화면 (SCR-012). 앱 스타일을 쓰지 못하므로 최소 HTML만
function blockedPage(message: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>삼코동 코칭 포털</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:sans-serif">
<main style="text-align:center;padding:24px"><img src="/brand/samkodong-logo-original.svg" alt="삼코동 Samsung Coaching Club" height="56"><p>${message}</p></main></body></html>`;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|brand/|favicon.ico|robots.txt).*)'],
};
