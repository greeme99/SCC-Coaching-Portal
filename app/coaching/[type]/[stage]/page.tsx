import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, PhaseNotice } from '@/components/PageHeader';
import {
  COACHING_TYPES,
  COACHING_TYPE_INFO,
  STAGES,
  isCoachingType,
  isStage,
  stageBadge,
  stageTitle,
} from '@/lib/navigation';

type Params = { type: string; stage: string };

// 유형 3 × 단계 7 = 21개 화면을 빌드 때 미리 만든다. 목록 밖 주소는 404
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
  return { title: `${COACHING_TYPE_INFO[type].name} · ${stageTitle(stage)}` };
}

export default async function StagePage({ params }: { params: Promise<Params> }) {
  const { type, stage } = await resolve(params);
  const info = COACHING_TYPE_INFO[type];
  const index = STAGES.indexOf(stage);
  const prev = STAGES[index - 1];
  const next = STAGES[index + 1];

  return (
    <>
      <PageHeader
        eyebrow={`${info.name} › ${stageTitle(stage)}`}
        title={
          <span className="inline-flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-sm border border-primary bg-surface text-caption font-semibold text-primary"
            >
              {stageBadge(stage)}
            </span>
            {info.themes[stage]}
          </span>
        }
      />
      <PhaseNotice phase={2}>
        이 회차의 목적·핵심 질문·주요 산출물·Between Session 안내와 추천 도구를 가이드북 원문으로 보여줍니다.
      </PhaseNotice>
      <nav aria-label="회차 이동" className="mt-6 flex justify-between gap-4 font-semibold text-primary">
        {prev ? <Link href={`/coaching/${type}/${prev}`}>← {stageTitle(prev)}</Link> : <span />}
        {next && <Link href={`/coaching/${type}/${next}`}>{stageTitle(next)} →</Link>}
      </nav>
    </>
  );
}
