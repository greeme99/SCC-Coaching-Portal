// 구글폼 prefill 링크 생성 (FN-006 ⑤). 브라우저·서버 공용 순수 함수
// 고객 이름·이메일은 받지 않는다 — 링크에는 프로그램 이름·ID·고객 코드·회차만 들어간다 (RULE-008)

// programName: 공용 폼이라 제목에 프로그램 이름을 넣을 수 없어, 폼 맨 위 '코칭 프로그램' 칸에 이름을 채운다
export type PrefillKey = 'programName' | 'programId' | 'clientCode' | 'sessionNo';
export type PrefillEntries = Partial<Record<PrefillKey, string>>;
export type PrefillValues = Partial<Record<PrefillKey, string>>;

// 항목 ID가 등록된 키만 돌려준다. 비어 있으면 그 값은 링크에 넣지 않는다
export function configuredKeys(entries: PrefillEntries): PrefillKey[] {
  return (Object.keys(entries) as PrefillKey[]).filter((key) => Boolean(entries[key]?.trim()));
}

// 항목 ID는 "entry.123" 또는 "123" 어느 쪽으로 적어도 같은 링크가 되게 한다
function entryParam(id: string): string {
  const trimmed = id.trim();
  return trimmed.startsWith('entry.') ? trimmed : `entry.${trimmed}`;
}

export function buildPrefillUrl(formUrl: string, entries: PrefillEntries, values: PrefillValues): string {
  const url = new URL(formUrl);
  const keys = configuredKeys(entries).filter((key) => values[key]?.trim());
  if (keys.length === 0) return url.toString();
  url.searchParams.set('usp', 'pp_url');
  for (const key of keys) url.searchParams.set(entryParam(entries[key]!), values[key]!.trim());
  return url.toString();
}

// 추가 회차 상한 — 오타(예: 300)를 막기 위한 값. 실제 운영 회차는 이보다 훨씬 적다
export const MAX_SESSION_NO = 99;

// 코칭일지 "추가 회차" 입력 검사. 프로그램 회기 수를 넘는 정수만 받는다 (1 ~ 회기 수는 목록에서 고른다)
// 올바르면 정규화한 번호 문자열, 아니면 null
export function parseExtraSession(input: string, sessionCount: number): string | null {
  const value = input.trim();
  if (!/^\d+$/.test(value)) return null;
  const no = Number(value);
  return no > sessionCount && no <= MAX_SESSION_NO ? String(no) : null;
}
