import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { Card, QuestionList } from '@/components/GuideBlocks';
import { Disclosure } from '@/components/Disclosure';
import { WorkflowDiagram, type FlowNode } from '@/components/WorkflowDiagram';
import { BETWEEN_PRINCIPLES, COACH_WORKFLOW, JOURNEY, OVERVIEW } from '@/lib/content';

export const metadata: Metadata = { title: '프로그램 개요' };

// 그림 1의 단계는 커리어 코칭 회차 화면으로 연결한다 (02.PRD-FS FN-003)
const journeyNodes: FlowNode[] = JOURNEY.steps.map((step) => ({
  label: step.label,
  href: step.stage ? `/coaching/career/${step.stage}` : `/coaching/career/${step.between}#between`,
  description: `${step.question} · ${step.outputs}`,
  question: step.question,
  outputs: step.outputs,
  dashed: Boolean(step.between),
}));

const workflowNodes: FlowNode[] = COACH_WORKFLOW.steps.map((step) => ({
  label: step.label,
  href: step.href,
  description: step.description,
}));

// 프로그램 개요 (SCR-004, DEC-035): 한눈에 보는 요약 → 눌러 보는 여정 그림 → 펼쳐 보는 원문 순서로 짧게 구성한다
export default function OverviewPage() {
  const { definition, philosophy, specs, commonQuestions } = OVERVIEW;
  const commonCount = commonQuestions.groups.reduce((sum, g) => sum + g.items.length, 0);
  return (
    <>
      <PageHeader
        title="프로그램 개요"
        description="회기 수는 프로그램마다 다릅니다. 아래 흐름은 가이드북의 5회기 기본 구조입니다."
      />

      <Card title="코칭 프로그램이란" source={definition.source}>
        <p className="break-keep text-lg leading-relaxed text-main">{definition.text}</p>

        {/* 운영 기본 사양: 표 대신 항목별 카드 — 권장 기준을 크게, 운영 유의점은 작게 */}
        <div className="mt-6 flex items-baseline justify-between gap-2">
          <h3 className="text-h3 text-main">운영 기본 사양</h3>
          <span className="text-caption text-body">{specs.source}</span>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {specs.rows.map(([item, standard, note]) => (
            <div key={item} className="rounded-md bg-subtle p-3 sm:p-4">
              <dt className="text-caption font-semibold text-body">{item}</dt>
              <dd className="mt-1 break-keep font-semibold text-main">{standard}</dd>
              <dd className="mt-1 break-keep text-caption text-body">{note}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="그림 1. 코칭 여정" source={JOURNEY.source}>
        <WorkflowDiagram id="journey" title="코칭 여정" nodes={journeyNodes} linkLabel="가이드 열기" />
      </Card>

      <Card title="그림 2. 코치 업무 절차">
        <WorkflowDiagram id="coach-workflow" title="코치 업무 절차" nodes={workflowNodes} numbered linkLabel="바로 가기" />
      </Card>

      {/* 가이드북 원문은 모두 남기되 접어 둔다 — 필요한 묶음만 펼쳐 읽는다 */}
      <Card title="더 읽어보기">
        <Disclosure title={definition.questionsIntro} meta={`${definition.questions.length}개 질문 · ${definition.source}`}>
          <QuestionList items={definition.questions} />
        </Disclosure>
        <Disclosure title="핵심 철학" meta={`${philosophy.items.length}가지 · ${philosophy.source}`}>
          <ol className="list-decimal space-y-2 pl-5 text-body">
            {philosophy.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </Disclosure>
        <Disclosure id="between" title="Between Session 운영 원칙" meta={`${BETWEEN_PRINCIPLES.length}가지 · 가이드북 5.2`}>
          <QuestionList items={BETWEEN_PRINCIPLES} />
        </Disclosure>
        <Disclosure title="회기 공통 질문" meta={`${commonCount}개 질문 · ${commonQuestions.source}`}>
          <div className="grid gap-6 lg:grid-cols-2">
            {commonQuestions.groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-2 font-semibold text-main">{group.title}</h3>
                <QuestionList items={group.items} />
              </div>
            ))}
          </div>
        </Disclosure>
      </Card>
    </>
  );
}
