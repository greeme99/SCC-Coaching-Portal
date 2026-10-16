// 가이드북 마크다운 → 블록 목록. 가이드북이 쓰는 문법(제목·표·목록·인용·구분선·굵게)만 다룬다
// ponytail: 범용 파서가 아님. 가이드북에 새 문법(이미지·코드 블록 등)이 생기면 marked 같은 라이브러리로 교체
// RULE-007: 원문의 외부 출처 링크는 옮기지 않는다 — [출처](https://…) 표기는 통째로 뺀다

export type Inline = { text: string; bold: boolean }[];
export type Block =
  | { type: 'heading'; level: number; text: Inline }
  | { type: 'paragraph'; lines: Inline[] }
  | { type: 'list'; ordered: boolean; start: number; items: Inline[] }
  | { type: 'quote'; lines: Inline[] }
  | { type: 'table'; header: Inline[]; rows: Inline[][] }
  | { type: 'hr' };

const LINK = /\s*\[[^\]]*\]\(https?:\/\/[^)]*\)/g;

// 굵게(**…**)만 나눈다. 짝이 맞지 않는 ** 는 글자로 둔다
export function parseInline(raw: string): Inline {
  const text = raw.replace(LINK, '').trim();
  const parts = text.split(/\*\*(.+?)\*\*/);
  return parts.map((part, i) => ({ text: part, bold: i % 2 === 1 })).filter((p) => p.text);
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => parseInline(c));

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  // 같은 종류 줄이 이어지는 동안 모은다
  const take = (test: (line: string) => boolean) => {
    const out: string[] = [];
    while (i < lines.length && test(lines[i].trim())) out.push(lines[i++].trim());
    return out;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
    } else if (/^(\*\*\*|---|___)$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
    } else if (line.startsWith('#')) {
      const level = line.length - line.replace(/^#+/, '').length;
      const text = parseInline(line.replace(/^#+/, ''));
      if (text.length) blocks.push({ type: 'heading', level, text });
      i++;
    } else if (line.startsWith('|')) {
      const rows = take((l) => l.startsWith('|')).filter((l) => !/^\|[\s:|-]+\|?$/.test(l));
      const [header = [], ...body] = rows.map(cells);
      blocks.push({ type: 'table', header, rows: body });
    } else if (/^[-*] /.test(line)) {
      blocks.push({ type: 'list', ordered: false, start: 1, items: take((l) => /^[-*] /.test(l)).map((l) => parseInline(l.slice(2))) });
    } else if (/^\d+\. /.test(line)) {
      blocks.push({ type: 'list', ordered: true, start: parseInt(line, 10), items: take((l) => /^\d+\. /.test(l)).map((l) => parseInline(l.replace(/^\d+\. /, ''))) });
    } else if (line.startsWith('>')) {
      blocks.push({ type: 'quote', lines: take((l) => l.startsWith('>')).map((l) => parseInline(l.replace(/^>\s?/, ''))).filter((l) => l.length) });
    } else {
      const para = take((l) => Boolean(l) && !/^(#|\||>|[-*] |\d+\. |\*\*\*$|---$)/.test(l));
      if (para.length === 0) {
        // 어느 규칙에도 맞지 않는 줄 — 건너뛰어 무한 반복을 막는다
        i++;
        continue;
      }
      const parsed = para.map(parseInline).filter((l) => l.length);
      if (parsed.length) blocks.push({ type: 'paragraph', lines: parsed });
    }
  }
  return blocks;
}
