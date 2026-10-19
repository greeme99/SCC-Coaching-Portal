import type { ReactNode } from 'react';

// 로그인 화면의 비밀번호 입력 폼. 브라우저 기본 폼 전송이라 자바스크립트 없이도 동작한다
// 폼은 주소 값(next·error)에 의존하지 않는 고정 영역이다 — 화면이 마저 그려질 때 입력 칸이 바뀌어
// 이미 친 비밀번호가 지워지지 않게 한다. 돌아갈 주소는 서버가 이 화면 주소(Referer)에서 읽는다
export function LoginForm({ errorSlot }: { errorSlot?: ReactNode }) {
  return (
    <form method="post" action="/api/login" className="mt-8">
      <label htmlFor="password" className="mb-2 block text-caption font-semibold text-main">
        공용 비밀번호를 입력해 주세요
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="비밀번호를 입력하세요"
        aria-describedby="password-error"
        className="min-h-12 w-full rounded-md border border-line bg-surface px-4 text-main"
      />
      {/* 오류 안내 자리: 항상 두고 안의 문구만 요청 시점에 채운다 */}
      <div id="password-error">{errorSlot}</div>
      <button
        type="submit"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-semibold text-on-primary transition hover:bg-primary-strong active:scale-[0.99]"
      >
        입장하기
      </button>
    </form>
  );
}

export function LoginError() {
  return (
    <p role="alert" className="mt-2 text-caption text-main">
      비밀번호가 맞지 않습니다. 다시 입력해 주세요.
    </p>
  );
}
