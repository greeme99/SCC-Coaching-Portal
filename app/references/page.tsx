import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { ReferenceList } from '@/components/ReferenceList';

export const metadata: Metadata = { title: '참조 자료실' };

export default function ReferencesPage() {
  return (
    <>
      <PageHeader title="참조 자료실" description="코칭 프로그램 가이드북과 운영진이 구글 드라이브 '참조자료' 폴더에 올린 자료를 찾아 엽니다." />
      <ReferenceList />
    </>
  );
}
