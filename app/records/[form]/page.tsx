import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card } from '@/components/GuideBlocks';
import { FormLauncher } from '@/components/FormLauncher';
import { PageHeader } from '@/components/PageHeader';
import { formById, type FormQuestion } from '@/lib/forms';
import { RECORD_FORMS, isRecordFormId, type RecordFormId } from '@/lib/navigation';

type Params = { form: string };

// 미리보기에서 처음 펼쳐 보여줄 문항 수 — 나머지는 [더 보기]로 접는다 (SCR-006 와이어프레임)
const VISIBLE_QUESTIONS = 4;

export function generateStaticParams(): Params[] {
  return Object.keys(RECORD_FORMS).map((form) => ({ form }));
}

async function resolve(params: Promise<Params>): Promise<RecordFormId> {
  const { form } = await params;
  if (!isRecordFormId(form)) notFound();
  return form;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: RECORD_FORMS[await resolve(params)].title };
}

export default async function RecordPage({ params }: { params: Promise<Params> }) {
  const id = await resolve(params);
  const info = RECORD_FORMS[id];
  const form = formById(id);
  const shareOnly = id === 'client-reflection';

  return (
    <>
      <PageHeader title={info.title} description={`작성자: ${info.author} · 작성 시점: ${info.timing}`} />

      <Card title="질의 항목 미리보기" source={form.updatedAt ? `최종 수정 ${form.updatedAt}` : undefined}>
        {form.questions.length === 0 ? (
          <p className="text-body">질의 항목이 아직 등록되지 않았습니다.</p>
        ) : (
          <>
            <p className="mb-1 font-semibold text-main">{form.formTitle}</p>
            <div className="mb-4 space-y-1 text-caption text-body">
              {form.description.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <QuestionPreview questions={form.questions.slice(0, VISIBLE_QUESTIONS)} start={1} />
            {form.questions.length > VISIBLE_QUESTIONS && (
              <details className="mt-2">
                <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary">
                  더 보기 ({form.questions.length - VISIBLE_QUESTIONS}개 문항)
                </summary>
                <QuestionPreview questions={form.questions.slice(VISIBLE_QUESTIONS)} start={VISIBLE_QUESTIONS + 1} />
              </details>
            )}
          </>
        )}
      </Card>

      <Card title={shareOnly ? '링크 전달' : '폼 열기'}>
        {shareOnly && (
          <p className="mb-4 text-body">
            고객에게 이메일·메시지·카카오톡 등으로 링크를 전달하면, 고객이 구글폼에서 직접 응답합니다. 링크에는 프로그램 ID와 고객 코드만 들어갑니다.
          </p>
        )}
        <FormLauncher formId={id} title={info.title} formUrl={form.formUrl} prefill={form.prefill} shareOnly={shareOnly} />
      </Card>
    </>
  );
}

function QuestionPreview({ questions, start }: { questions: FormQuestion[]; start: number }) {
  return (
    <ol start={start} className="list-decimal space-y-3 pl-6 text-body">
      {questions.map((q) => (
        <li key={q.title}>
          <span className="text-main">{q.title}</span>
          <span className="ml-2 text-caption text-muted">
            {q.kind}
            {q.required ? ' · 필수' : ' · 선택'}
          </span>
          {q.help && <p className="mt-1 text-caption text-body">{q.help}</p>}
          {q.options && <p className="mt-1 text-caption text-body">{q.options.join(' / ')}</p>}
        </li>
      ))}
    </ol>
  );
}
