// DESIGN.md §6 디자인 린트: 토큰 파일 밖 색상 하드코딩, Tailwind 기본 팔레트 클래스, 정렬 기호 누락을 찾는다
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TARGETS = ['app', 'components', 'lib'];
const ALLOW = new Set(['styles/tokens.css']); // 색상 정의를 허용하는 유일한 파일
const EXT = /\.(tsx?|css|mjs|js)$/;

const RULES = [
  { name: '색상 코드 직접 사용 (CSS 변수 사용)', re: /#[0-9a-fA-F]{3,8}\b(?![-\w])/g },
  { name: 'rgb/hsl 직접 사용 (CSS 변수 사용)', re: /\b(?:rgba?|hsla?)\(/g },
  {
    name: 'Tailwind 기본 팔레트 클래스 (토큰 유틸리티 사용)',
    re: /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)(?:-\d{2,3})?\b/g,
  },
  { name: '경고색 토큰 사용 금지 (RULE-001)', re: /--color-(?:danger|warning)\b/g },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : EXT.test(name) ? [path] : [];
  });
}

const problems = [];
for (const target of TARGETS) {
  for (const file of walk(join(ROOT, target))) {
    const rel = relative(ROOT, file);
    if (ALLOW.has(rel)) continue;
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      for (const rule of RULES) {
        for (const match of line.matchAll(rule.re)) problems.push(`${rel}:${i + 1}  ${rule.name}: ${match[0]}`);
      }
    });
    // 정렬 가능한 표(aria-sort)는 정렬 기호를 함께 표시해야 한다 (DESIGN.md §4-3)
    if (text.includes('aria-sort') && !/[⇅▲▼]/.test(text)) problems.push(`${rel}  정렬 기호(⇅ ▲ ▼) 누락`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\ndesign:lint 실패 — ${problems.length}건`);
  process.exit(1);
}
console.log('design:lint 통과');
