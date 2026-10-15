import type { Metadata } from 'next';
import { PageHeader, PhaseNotice } from '@/components/PageHeader';

export const metadata: Metadata = { title: '코칭 툴 나눔터' };

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="코칭 툴 나눔터" description="코칭 도구 상세와 워크시트를 모아 둔 나눔터를 이 화면에서 엽니다." />
      <PhaseNotice phase={3}>나눔터 사이트를 화면 안에 보여주고 [새 창에서 열기] 버튼을 제공합니다.</PhaseNotice>
    </>
  );
}
