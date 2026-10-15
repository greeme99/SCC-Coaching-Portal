import type { Metadata } from 'next';
import { PageHeader, PhaseNotice } from '@/components/PageHeader';

export const metadata: Metadata = { title: '참조 자료실' };

export default function ReferencesPage() {
  return (
    <>
      <PageHeader title="참조 자료실" description="운영진이 구글 드라이브에 올린 참고 자료를 찾아 엽니다." />
      <PhaseNotice phase={3}>코칭 프로그램 가이드북을 맨 위에 고정하고, 드라이브 &apos;참조자료&apos; 폴더의 파일 목록을 보여줍니다.</PhaseNotice>
    </>
  );
}
