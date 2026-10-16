import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, GridTable, KeyValueTable, QuestionList, Quote } from '@/components/GuideBlocks';
import { STAGE_COMMON, TOOL_HUB_URL, TYPE_GUIDES, betweenAfter, toolsForStage } from '@/lib/content';
import { COACHING_TYPES, STAGES, isCoachingType, isStage, stageBadge, stageTitle } from '@/lib/navigation';

type Params = { type: string; stage: string };

// 유형 3 × 단계 7 = 21개 화면을 빌드 때 미리 만든다. 목록 밖 주소는 proxy.ts에서 404
export function generateStaticParams(): Params[] {
  return COACHING_TYPES.flatMap((type) => STAGES.map((stage) => ({ type, stage })));
}

async function resolve(params: Promise<Params>) {
  const { type, stage } = await params;
  if (!isCoachingType(type) || !isStage(stage)) notFound();
  return { type, stage };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { type, stage } = await resolve(params);
  return { title: `${TYPE_GUIDES[type].name} · ${stageTitle(stage)}` };
}

export default async function StagePage({ params }: { params: Promise<Params> }) {
  const { type, stage } = await resolve(params);
  const guide = TYPE_GUIDES[type];
  const typeStage = guide.stages[stage];
  const common = STAGE_COMMON[stage];
  const tools = toolsForStage(type, stage);
  const between = betweenAfter(stage);
  const extra = guide.extras[stage];
  const index = STAGES.indexOf(stage);
  const prev = STAGES[index - 1];
  const next = STAGES[index + 1];

  return (
    <>
      <PageHeader
        eyebrow={`${guide.name} › ${stageTitle(stage)}`}
        title={
          <span className="inline-flex items-center gap-3">
            <span aria-hidden className="grid size-8 place-items-center rounded-sm border border-primary bg-surface text-caption font-semibold text-primary">
              {stageBadge(stage)}
            </span>
            {typeStage.theme}
          </span>
        }
        description={common.purpose}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="핵심 질문" source={`${common.source} · ${guide.source}`}>
          <Quote>{typeStage.coreQuestion}</Quote>
          <div className="mt-4">
            <QuestionList items={common.questions} />
          </div>
        </Card>
        <div>
          <Card title="주요 산출물" source={guide.source}>
            <p className="text-body">{typeStage.outputs}</p>
            {typeStage.action && (
              <p className="mt-3 text-body">
                <span className="font-semibold text-main">멘토링 코칭 행동: </span>
                {typeStage.action}
              </p>
            )}
          </Card>
          {common.statement && (
            <Card title={common.statement.title} source={common.source}>
              <Quote>{common.statement.text}</Quote>
            </Card>
          )}
          {extra && (
            <Card title={extra.title} source={guide.source}>
              <Quote>{extra.text}</Quote>
            </Card>
          )}
        </div>
      </div>

      {guide.share && (
        <Card title="멘토 경험 공유 프로토콜: SHARE" source="가이드북 19.5">
          <GridTable columns={['단계', '의미', '멘토 발화 예시']} rows={guide.share} />
        </Card>
      )}

      {tools.length > 0 && (
        <Card title="이 회기 추천 도구" source="가이드북 27.15">
          <ul>
            {tools.map((tool) => (
              <li key={tool.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                <span className="min-w-0">
                  <span className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-caption ${tool.level === 'primary' ? 'bg-primary-light text-primary-strong' : 'bg-subtle text-body'}`}>
                    {tool.level === 'primary' ? '우선' : '보조'}
                  </span>
                  <span className="font-semibold text-main">{tool.name}</span>
                  <span className="text-body"> — {tool.purpose}</span>
                </span>
                <a
                  href={tool.hubUrl || TOOL_HUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-surface px-4 font-semibold text-main hover:bg-subtle"
                >
                  나눔터 <ExternalLink size={16} aria-hidden />
                  <span className="sr-only">(새 창)</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {common.sheet && (
        <Card title={common.sheet.title} source={common.source}>
          <KeyValueTable rows={common.sheet.rows} />
        </Card>
      )}

      {between && (
        <Card title={`다음 Between Session: ${between.name}`} source={between.source} id="between">
          <p className="mb-4 text-body">{between.purpose}</p>
          <KeyValueTable rows={between.rows} />
          {guide.betweenExamples && (
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-primary">{guide.name} Between Session 예시</summary>
              <div className="mt-3">
                <GridTable columns={guide.betweenExamples.columns} rows={guide.betweenExamples.rows} />
              </div>
            </details>
          )}
        </Card>
      )}

      <Card title={`${guide.name} 질문`} source={guide.source}>
        <details>
          <summary className="cursor-pointer font-semibold text-primary">질문 {guide.questions.length}개 보기</summary>
          <div className="mt-3">
            <QuestionList items={guide.questions} />
          </div>
        </details>
      </Card>

      <nav aria-label="회차 이동" className="mt-2 flex justify-between gap-4 font-semibold text-primary">
        {prev ? <Link href={`/coaching/${type}/${prev}`}>← {stageTitle(prev)}</Link> : <span />}
        {next && <Link href={`/coaching/${type}/${next}`}>{stageTitle(next)} →</Link>}
      </nav>
    </>
  );
}
