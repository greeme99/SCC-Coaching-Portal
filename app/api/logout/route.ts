// POST /api/logout — 세션 쿠키를 지우고 입장 화면으로 보낸다 (DEC-032)
// 쿠키가 이미 없더라도 같은 결과가 되도록 proxy에서 비밀번호 확인 없이 통과시킨다
import { SESSION_COOKIE, redirectTo } from '@/lib/basic-auth';

export function POST() {
  const response = redirectTo('/login', 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
