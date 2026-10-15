// 구글폼 정의 로더 — content/forms.json (질의 항목은 docs/forms/ 원문)
import formsJson from '@/content/forms.json';
import type { RecordFormId } from '@/lib/navigation';
import type { PrefillEntries } from '@/lib/prefill';

export type FormQuestion = {
  section: string;
  title: string;
  kind: string;
  required: boolean;
  help?: string;
  options?: string[];
};

export type FormDefinition = {
  id: RecordFormId;
  formTitle: string;
  source: string;
  updatedAt: string;
  formUrl: string;
  prefill: PrefillEntries;
  description: string[];
  questions: FormQuestion[];
};

export const FORMS = formsJson.forms as FormDefinition[];

export function formById(id: RecordFormId): FormDefinition {
  const form = FORMS.find((f) => f.id === id);
  if (!form) throw new Error(`forms.json에 ${id} 정의가 없습니다`);
  return form;
}
