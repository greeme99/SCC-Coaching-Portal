// 구글폼 prefill 링크 생성 (FN-006 ⑤). 브라우저·서버 공용 순수 함수
// 이름·이메일은 받지 않는다 — 링크에는 프로그램 ID·고객 코드·회차만 들어간다 (RULE-008)

export type PrefillKey = 'programId' | 'clientCode' | 'sessionNo';
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
