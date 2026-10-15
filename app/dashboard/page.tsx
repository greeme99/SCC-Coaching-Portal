import type { Metadata } from 'next';
import { PageHeader, PhaseNotice } from '@/components/PageHeader';

export const metadata: Metadata = { title: '프로그램 현황' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="프로그램 현황" description="운영 중인 코칭 프로그램과 기록 제출 현황을 확인합니다." />
      <PhaseNotice phase={4}>구글 시트의 프로그램 목록·참여자 명단·구글폼 응답을 읽어 프로그램 카드와 진행 현황표를 보여줍니다.</PhaseNotice>
    </>
  );
}
