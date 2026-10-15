import type { Metadata } from 'next';
import { PageHeader, PhaseNotice } from '@/components/PageHeader';

export const metadata: Metadata = { title: '프로그램 개요' };

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="프로그램 개요"
        description="고객이 자신의 경험·가치·강점을 탐색하고, 스스로 선택한 작은 행동으로 배우도록 돕는 고객 주도형 다회기 코칭 프로그램입니다."
      />
      <PhaseNotice phase={2}>프로그램 설명과 워크플로우 그림 2종(코칭 여정, 코치 업무 절차)을 보여줍니다.</PhaseNotice>
    </>
  );
}
