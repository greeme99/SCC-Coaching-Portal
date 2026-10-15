// 가이드 콘텐츠 로더 — content/*.json (가이드북 원문, RULE-007)
import careerJson from '@/content/types/career.json';
import lifeJson from '@/content/types/life.json';
import mentoringJson from '@/content/types/mentoring.json';
import stagesJson from '@/content/stages.json';
import toolsJson from '@/content/tools.json';
import journeyJson from '@/content/journey.json';
import workflowJson from '@/content/coach-workflow.json';
import overviewJson from '@/content/overview.json';
import type { CoachingType, Stage } from '@/lib/navigation';

export type Row = [string, string];
export type Sheet = { title: string; rows: Row[] };

export type StageCommon = {
  source: string;
  purpose: string;
  questions: string[];
  sheet?: Sheet;
  statement?: { title: string; text: string };
};
export type BetweenCommon = { source: string; name: string; purpose: string; rows: Row[] };

export type TypeStage = { theme: string; coreQuestion: string; outputs: string; action?: string };
export type TypeGuide = {
  type: CoachingType;
  name: string;
  source: string;
  purpose: string;
  stages: Record<Stage, TypeStage>;
  questions: string[];
  betweenExamples: { columns: string[]; rows: string[][] } | null;
  share?: [string, string, string][];
  extras: Partial<Record<Stage, { title: string; text: string }>>;
};

export type Tool = {
  id: string;
  name: string;
  purpose: string;
  timing: string;
  stages: { stage: Stage; level: 'primary' | 'secondary' }[];
  types: CoachingType[];
  hubUrl: string;
};

export const TYPE_GUIDES = {
  career: careerJson,
  mentoring: mentoringJson,
  life: lifeJson,
} as unknown as Record<CoachingType, TypeGuide>;

const stagesData = stagesJson as unknown as {
  stages: Record<Stage, StageCommon>;
  between: Record<string, BetweenCommon>;
  betweenPrinciples: string[];
};
export const STAGE_COMMON = stagesData.stages;
export const BETWEEN = stagesData.between;
export const BETWEEN_PRINCIPLES = stagesData.betweenPrinciples;

export const TOOLS = (toolsJson as unknown as { tools: Tool[] }).tools;
export const TOOL_HUB_URL = toolsJson.hubUrl;

export type JourneyStep = { label: string; question: string; outputs: string; stage?: Stage; between?: string };
export const JOURNEY = journeyJson as unknown as { source: string; steps: JourneyStep[] };
export const COACH_WORKFLOW = workflowJson as { steps: { label: string; description: string; href: string }[] };
export const OVERVIEW = overviewJson;

// 회차별 추천 도구 (FN-004, FR-005). tools.json에 항목을 추가하면 코드 수정 없이 표시된다
export function toolsForStage(type: CoachingType, stage: Stage, tools: Tool[] = TOOLS) {
  return tools.flatMap((tool) => {
    if (tool.types.length && !tool.types.includes(type)) return [];
    const match = tool.stages.find((s) => s.stage === stage);
    return match ? [{ ...tool, level: match.level }] : [];
  }).sort((a, b) => (a.level === b.level ? 0 : a.level === 'primary' ? -1 : 1));
}

// 1~4회기 뒤에 이어지는 Between Session
export function betweenAfter(stage: Stage): BetweenCommon | null {
  return BETWEEN[stage] ?? null;
}
