import { describe, expect, it } from 'vitest';
import {
  COACHING_TYPES,
  NAV_GROUPS,
  STAGES,
  coachingTypeFromPath,
  isActiveLink,
  isCoachingType,
  isKnownDynamicPath,
  isRecordFormId,
  isStage,
  stageBadge,
  stageTitle,
} from '@/lib/navigation';

describe('사이드 메뉴 구조 (DEC-011)', () => {
  it('묶음 순서가 확정안과 같다', () => {
    expect(NAV_GROUPS.map((g) => g.title)).toEqual(['프로그램', '코칭 모델', '일지·소감', '대시보드', '코치 도구', '자료']);
  });
  it('코칭 모델은 3유형 × 7단계', () => {
    expect(COACHING_TYPES).toHaveLength(3);
    expect(STAGES).toHaveLength(7);
  });
});

describe('회차 표기', () => {
  it('제목과 배지', () => {
    expect(stageTitle('start')).toBe('시작 세션');
    expect(stageTitle('3')).toBe('3회기');
    expect(stageTitle('follow-up')).toBe('Follow-up');
    expect(stageBadge('start')).toBe('0');
    expect(stageBadge('follow-up')).toBe('F');
  });
});

describe('주소 판정', () => {
  it('대시보드는 하위 주소에서도 강조', () => {
    expect(isActiveLink('/dashboard', '/dashboard')).toBe(true);
    expect(isActiveLink('/dashboard', '/dashboard/2026-2-DEMO-CAREER')).toBe(true);
    expect(isActiveLink('/tools', '/tools/x')).toBe(false);
  });
  it('현재 코칭 유형', () => {
    expect(coachingTypeFromPath('/coaching/mentoring/3')).toBe('mentoring');
    expect(coachingTypeFromPath('/coaching/finance/3')).toBeNull();
    expect(coachingTypeFromPath('/dashboard')).toBeNull();
  });
  it('유효하지 않은 값 거부 (TC-016)', () => {
    expect(isCoachingType('finance')).toBe(false);
    expect(isStage('9')).toBe(false);
    expect(isRecordFormId('toString')).toBe(false);
    expect(isRecordFormId('journal')).toBe(true);
  });
});

describe('isKnownDynamicPath', () => {
  it.each([
    ['/coaching/career/2', true],
    ['/coaching/life/follow-up', true],
    ['/coaching/finance/2', false],
    ['/coaching/career/9', false],
    ['/records/journal', true],
    ['/records/unknown', false],
    ['/dashboard', true],
    ['/dashboard/2026-2-DEMO-CAREER', true],
  ])('%s → %s', (path, expected) => {
    expect(isKnownDynamicPath(path)).toBe(expected);
  });
});
