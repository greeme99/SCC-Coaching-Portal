import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { Card, GridTable, QuestionList } from '@/components/GuideBlocks';
import { WorkflowDiagram, type FlowNode } from '@/components/WorkflowDiagram';
import { BETWEEN_PRINCIPLES, COACH_WORKFLOW, JOURNEY, OVERVIEW } from '@/lib/content';

export const metadata: Metadata = { title: '프로그램 개요' };

// 그림 1의 단계는 커리어 코칭 회차 화면으로 연결한다 (02.PRD-FS FN-003)
const journeyNodes: FlowNode[] = JOURNEY.steps.map((step) => ({
  label: step.label,
  href: step.stage ? `/coaching/career/${step.stage}` : `/coaching/career/${step.between}#between`,
  description: `${step.question} · ${step.outputs}`,
  dashed: Boolean(step.between),
}));

const workflowNodes: FlowNode[] = COACH_WORKFLOW.steps.map((step) => ({
  label: step.label,
  href: step.href,
  description: step.description,
}));

export default function OverviewPage() {
  const { definition, philosophy, specs, commonQuestions } = OVERVIEW;
  return (
    <>
      <PageHeader
        title="프로그램 개요"
        description="회기 수는 프로그램마다 다릅니다. 아래 흐름은 가이드북의 5회기 기본 구조입니다."
      />

      <Card title="코칭 프로그램이란" source={definition.source}>
        <p className="mb-4 text-body">{definition.text}</p>
        <p className="mb-2 text-body">{definition.questionsIntro}</p>
        <QuestionList items={definition.questions} />
      </Card>

      <Card title="그림 1. 코칭 여정" source={JOURNEY.source}>
        <WorkflowDiagram id="journey" title="코칭 여정" nodes={journeyNodes} />
      </Card>

      <Card title="그림 2. 코치 업무 절차">
        <WorkflowDiagram id="coach-workflow" title="코치 업무 절차" nodes={workflowNodes} numbered />
      </Card>

      <Card title="운영 기본 사양" source={specs.source}>
        <GridTable columns={specs.columns} rows={specs.rows} />
      </Card>

      <Card title="핵심 철학" source={philosophy.source}>
        <ol className="list-decimal space-y-2 pl-6 text-body">
          {philosophy.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </Card>

      <Card title="Between Session 운영 원칙" source="가이드북 5.2" id="between">
        <QuestionList items={BETWEEN_PRINCIPLES} />
      </Card>

      <Card title="회기 공통 질문" source={commonQuestions.source}>
        <div className="grid gap-6 lg:grid-cols-2">
          {commonQuestions.groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-h3 text-main">{group.title}</h3>
              <QuestionList items={group.items} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
