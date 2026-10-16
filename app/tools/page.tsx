import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { ToolHubFrame } from '@/components/ToolHubFrame';
import { TOOL_HUB_URL } from '@/lib/content';

export const metadata: Metadata = { title: '코칭 툴 나눔터' };

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="코칭 툴 나눔터" />
      <ToolHubFrame url={TOOL_HUB_URL} />
    </>
  );
}
