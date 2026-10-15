import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader, PhaseNotice } from '@/components/PageHeader';
import { RECORD_FORMS, isRecordFormId } from '@/lib/navigation';

type Params = { form: string };

export function generateStaticParams(): Params[] {
  return Object.keys(RECORD_FORMS).map((form) => ({ form }));
}

async function resolve(params: Promise<Params>) {
  const { form } = await params;
  if (!isRecordFormId(form)) notFound();
  return RECORD_FORMS[form];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: (await resolve(params)).title };
}

export default async function RecordPage({ params }: { params: Promise<Params> }) {
  const form = await resolve(params);
  return (
    <>
      <PageHeader title={form.title} description={`작성자: ${form.author} · 작성 시점: ${form.timing}`} />
      <PhaseNotice phase={3}>질의 항목 미리보기와, 프로그램·고객 코드를 미리 채운 구글폼 링크를 제공합니다.</PhaseNotice>
    </>
  );
}
