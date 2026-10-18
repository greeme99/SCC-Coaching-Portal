// 로그인 화면의 비밀번호 입력 폼. 브라우저 기본 폼 전송이라 자바스크립트 없이도 동작한다
export function LoginForm({ next, error }: { next: string; error: boolean }) {
  return (
    <form method="post" action="/api/login" className="mt-8">
      <input type="hidden" name="next" value={next} />
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
        aria-invalid={error || undefined}
        aria-describedby={error ? 'password-error' : undefined}
        className="min-h-12 w-full rounded-md border border-line bg-surface px-4 text-main"
      />
      {error && (
        <p id="password-error" role="alert" className="mt-2 text-caption text-main">
          비밀번호가 맞지 않습니다. 다시 입력해 주세요.
        </p>
      )}
      <button
        type="submit"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-semibold text-on-primary transition hover:bg-primary-strong active:scale-[0.99]"
      >
        입장하기
      </button>
    </form>
  );
}
