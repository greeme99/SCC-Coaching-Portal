import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JOURNEY, STAGE_COMMON, TOOLS, TYPE_GUIDES, betweenAfter, toolsForStage, type Tool } from '@/lib/content';
import { COACHING_TYPES, STAGES } from '@/lib/navigation';

// 가이드북 원문과 대조할 때 공백·줄바꿈 차이와 강조 표시(**)는 무시한다
const normalize = (s: string) => s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
const guidebook = normalize(readFileSync(new URL('../../docs/reference/coaching-program-guidebook.md', import.meta.url), 'utf8'));

describe('회차 콘텐츠 구조 (TC-014)', () => {
  it.each(COACHING_TYPES)('%s: 7단계 모두 주제·핵심 질문·산출물이 있다', (type) => {
    for (const stage of STAGES) {
      const s = TYPE_GUIDES[type].stages[stage];
      expect(s.theme, `${type}/${stage}`).toBeTruthy();
      expect(s.coreQuestion).toBeTruthy();
      expect(s.outputs).toBeTruthy();
    }
  });
  it('공통 회차 내용이 7단계 모두 있다', () => {
    for (const stage of STAGES) expect(STAGE_COMMON[stage].questions.length).toBeGreaterThan(0);
  });
  it('1~4회기 뒤에만 Between Session이 있다', () => {
    expect(STAGES.filter((s) => betweenAfter(s))).toEqual(['1', '2', '3', '4']);
  });
});

describe('가이드북 원문 일치 (TC-015, RULE-007)', () => {
  const texts: [string, string][] = [];
  for (const stage of STAGES) {
    const common = STAGE_COMMON[stage];
    common.questions.forEach((q) => texts.push([`공통 ${stage} 질문`, q]));
    if (stage !== 'follow-up') texts.push([`공통 ${stage} 목적`, common.purpose]);
  }
  for (const type of COACHING_TYPES) {
    const guide = TYPE_GUIDES[type];
    texts.push([`${type} 목적`, guide.purpose]);
    guide.questions.forEach((q) => texts.push([`${type} 질문`, q]));
    for (const stage of STAGES) texts.push([`${type} ${stage} 핵심 질문`, guide.stages[stage].coreQuestion]);
  }
  JOURNEY.steps.forEach((s) => texts.push([`여정 ${s.label}`, s.question]));

  it.each(texts)('%s', (_label, text) => {
    expect(guidebook).toContain(normalize(text));
  });
});

describe('추천 도구 (FR-005)', () => {
  it('가이드북 12종이 모두 등록되어 있다', () => {
    expect(TOOLS).toHaveLength(12);
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(12);
  });
  it('우선 도구가 보조 도구보다 먼저 나온다', () => {
    const levels = toolsForStage('career', 'start').map((t) => t.level);
    expect(levels).toEqual([...levels].sort((a, b) => (a === b ? 0 : a === 'primary' ? -1 : 1)));
    expect(toolsForStage('career', '2')[0].name).toBe('D-H-B');
  });
  it('유형이 지정된 도구는 그 유형에만 나온다', () => {
    const lifeOnly: Tool = { ...TOOLS[0], id: 'x', types: ['life'], stages: [{ stage: '2', level: 'primary' }] };
    expect(toolsForStage('life', '2', [lifeOnly])).toHaveLength(1);
    expect(toolsForStage('career', '2', [lifeOnly])).toHaveLength(0);
  });
  it('TC-017 목록에 도구를 추가하면 코드 수정 없이 해당 회차에 나온다', () => {
    const added: Tool = { ...TOOLS[0], id: 'new-tool', name: '새 도구', types: [], stages: [{ stage: '3', level: 'secondary' }] };
    expect(toolsForStage('mentoring', '3', [...TOOLS, added]).map((t) => t.id)).toContain('new-tool');
  });
  it('TC-018 추천 도구가 없으면 빈 목록', () => {
    expect(toolsForStage('career', '2', [])).toEqual([]);
  });
});
