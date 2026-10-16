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
  // 구글폼 편집 주소 (관리자 구글 계정에서만 열림, 문항 수정용 기록)
  editUrl: string;
  prefill: PrefillEntries;
  // 응답이 쌓이는 응답 시트의 탭 이름 — 대시보드가 이 이름으로 읽는다
  responseSheet: string;
  description: string[];
  // 구글폼 제출 후 확인 메시지 (폼 생성 스크립트에서 사용)
  confirmation: string;
  questions: FormQuestion[];
};

export const FORMS = formsJson.forms as FormDefinition[];

export function formById(id: RecordFormId): FormDefinition {
  const form = FORMS.find((f) => f.id === id);
  if (!form) throw new Error(`forms.json에 ${id} 정의가 없습니다`);
  return form;
}
