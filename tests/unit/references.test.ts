import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fileKind, searchReferences, toReferences } from '@/lib/data/references';
import { parseInline, parseMarkdown } from '@/lib/markdown';
import { isActiveLink } from '@/lib/navigation';

describe('참조 자료실 목록 (FN-009)', () => {
  const files = toReferences([
    { id: 'a', name: '운영 안내서.pdf', mimeType: 'application/pdf', modifiedTime: '2026-10-01T03:00:00.000Z', webViewLink: 'https://drive.google.com/a' },
    { id: 'b', name: '코치 교육 자료', mimeType: 'application/vnd.google-apps.presentation', modifiedTime: '2026-09-20T03:00:00.000Z', webViewLink: 'https://drive.google.com/b' },
  ]);
  it('형식·수정일·열기 주소로 바꾼다', () => {
    expect(files[0]).toEqual({ id: 'a', name: '운영 안내서.pdf', kind: 'PDF', modifiedDate: '2026-10-01', url: 'https://drive.google.com/a' });
    expect(files[1].kind).toBe('구글 슬라이드');
    expect(fileKind('image/png')).toBe('이미지');
    expect(fileKind('application/zip')).toBe('파일');
  });
  it('이름 검색은 대소문자·띄어쓰기와 무관하고 모든 단어를 포함해야 한다', () => {
    expect(searchReferences(files, '안내서').map((f) => f.id)).toEqual(['a']);
    expect(searchReferences(files, ' 코치  자료 ').map((f) => f.id)).toEqual(['b']);
    expect(searchReferences(files, 'PDF 코치')).toEqual([]);
    expect(searchReferences(files, '')).toHaveLength(2);
  });
  it('가이드북 화면에서도 참조 자료실 메뉴가 강조된다', () => {
    expect(isActiveLink('/references', '/references/guidebook')).toBe(true);
    expect(isActiveLink('/references', '/records/journal')).toBe(false);
  });
});

describe('가이드북 마크다운', () => {
  it('외부 출처 링크는 통째로 빼고 굵게만 남긴다 (RULE-007)', () => {
    expect(parseInline('**코칭은 과정이다.** [ppl-ai](https://example.com/x?a=1)')).toEqual([{ text: '코칭은 과정이다.', bold: true }]);
  });
  it('제목·표·목록·인용·구분선을 나눈다', () => {
    const blocks = parseMarkdown('# 제목\n\n| 항목 | 내용 |\n|---|---|\n| 가 | **나** |\n\n- 하나\n- 둘\n\n7. 일곱\n\n> 인용\n\n***\n본문 한 줄\n둘째 줄');
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'table', 'list', 'list', 'quote', 'hr', 'paragraph']);
    expect(blocks[1]).toEqual({ type: 'table', header: [[{ text: '항목', bold: false }], [{ text: '내용', bold: false }]], rows: [[[{ text: '가', bold: false }], [{ text: '나', bold: true }]]] });
    expect(blocks[3]).toMatchObject({ ordered: true, start: 7 });
  });
  it('실제 가이드북을 읽으면 외부 주소가 하나도 남지 않는다', () => {
    const blocks = parseMarkdown(readFileSync(new URL('../../docs/reference/coaching-program-guidebook.md', import.meta.url), 'utf8'));
    const json = JSON.stringify(blocks);
    expect(json).not.toMatch(/https?:\/\//);
    expect(blocks.filter((b) => b.type === 'heading').length).toBeGreaterThan(150);
    expect(blocks.filter((b) => b.type === 'table').length).toBeGreaterThan(50);
  });
});
