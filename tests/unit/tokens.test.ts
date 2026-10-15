import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// TC-006: 다크 테마 블록이 라이트 테마의 모든 토큰을 정의한다 (FR-013)
const css = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');
const block = (selector: string) => css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)));
const names = (text: string) => new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

describe('디자인 토큰', () => {
  it('TC-006 다크 토큰이 라이트 토큰과 같은 이름을 모두 가진다', () => {
    const light = names(block(':root'));
    const dark = names(block('[data-theme="dark"]'));
    expect(light.size).toBeGreaterThan(10);
    expect([...light].filter((n) => !dark.has(n))).toEqual([]);
  });
  it('경고색 토큰을 정의하지 않는다 (RULE-001)', () => {
    expect(css).not.toMatch(/--color-(danger|warning)/);
  });
});
