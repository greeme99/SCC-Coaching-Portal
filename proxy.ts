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
  return new NextResponse(blockedPage('삼코동 코칭 포털은 비밀번호가 필요합니다. 운영진에게 문의하세요.', inAppHelp(request)), {
    status: 401,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'www-authenticate': 'Basic realm="SCD Coaching Portal", charset="UTF-8"',
    },
  });
}

// 카카오톡 등 앱 안 브라우저(인앱 브라우저)는 Basic 인증 비밀번호 창을 띄우지 못하고 이 화면만 보여준다.
// 카카오톡은 외부 브라우저로 여는 주소(kakaotalk://web/openExternal)를 지원하므로 자동으로 넘기고, 그 밖의 앱은 안내만 한다
// ponytail: 카카오톡만 자동 전환, 다른 인앱 브라우저가 문제되면 해당 앱의 외부 열기 방식을 추가
function inAppHelp(request: NextRequest): string {
  const ua = request.headers.get('user-agent') ?? '';
  if (/KAKAOTALK/i.test(ua)) {
    const external = `kakaotalk://web/openExternal?url=${encodeURIComponent(request.url)}`;
    return `<p><a href="${escapeHtml(external)}" style="display:inline-block;padding:12px 20px;font-weight:700">외부 브라우저로 열기</a></p>
<script>location.href=${JSON.stringify(external)}</script>`;
  }
  if (/Android|iPhone|iPad/i.test(ua)) {
    return '<p style="font-size:14px">메신저·SNS 앱 안에서 열면 비밀번호 창이 뜨지 않을 수 있습니다.<br>메뉴(⋮)에서 \'다른 브라우저로 열기\'를 선택해 크롬·삼성 인터넷·사파리에서 열어 주세요.</p>';
  }
  return '';
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// 비밀번호 창을 취소했을 때 보이는 단독 화면 (SCR-012). 앱 스타일을 쓰지 못하므로 최소 HTML만
function blockedPage(message: string, extra = ''): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>삼코동 코칭 포털</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:sans-serif">
<main style="text-align:center;padding:24px"><img src="/brand/samkodong-logo-original.svg" alt="삼코동 Samsung Coaching Club" height="56"><p>${message}</p>${extra}</main></body></html>`;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|brand/|favicon.ico|robots.txt).*)'],
};
