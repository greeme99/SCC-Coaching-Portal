// 구글 시트 6개 탭을 한 번에 읽어 5분 메모리 캐시 (API-001·002 공용)
// RULE-006: 메모리 캐시(최대 5분)만 허용. 파일·다른 저장소에 복제하지 않는다
// ponytail: 서버 인스턴스마다 따로 캐시된다. 인스턴스가 많아지면 응답마다 조회 시각이 다를 수 있음
import { GoogleConfigError, readSheet } from '@/lib/google/sheets';
import { formById } from '@/lib/forms';
import type { ResponseRows } from '@/lib/data/progress';

const CACHE_MS = 300_000;

// 응답 시트 탭 이름 — content/forms.json의 responseSheet (create-forms.gs가 만든 forms_config 탭과 같은 값)
const RESPONSE_FORMS: (keyof ResponseRows)[] = ['journal', 'final-report', 'coach-reflection', 'client-reflection'];
export const RESPONSE_TABS = Object.fromEntries(RESPONSE_FORMS.map((id) => [id, formById(id).responseSheet])) as Record<keyof ResponseRows, string>;

export type SheetData = { programRows: string[][]; rosterRows: string[][]; responses: ResponseRows; fetchedAt: string };

let cache: { data: SheetData; storedAt: number } | null = null;

export class UpstreamError extends Error {
  constructor(public readonly stale: SheetData | null) {
    super('구글 시트 조회 실패');
  }
}

// 설정이 없으면 GoogleConfigError, 조회 실패면 UpstreamError(마지막 성공 결과 포함)
export async function loadSheets(): Promise<SheetData> {
  if (cache && Date.now() - cache.storedAt < CACHE_MS) return cache.data;

  const programsId = process.env.SHEET_PROGRAMS_ID;
  const rosterId = process.env.SHEET_ROSTER_ID;
  const responsesId = process.env.SHEET_RESPONSES_ID;
  if (!programsId || !rosterId || !responsesId) throw new GoogleConfigError('시트 ID 미설정');

  try {
    const tabs = Object.entries(RESPONSE_TABS) as [keyof ResponseRows, string][];
    const [programRows, rosterRows, ...responseRows] = await Promise.all([
      readSheet(programsId, 'programs'),
      readSheet(rosterId, 'roster'),
      ...tabs.map(([, tab]) => readSheet(responsesId, tab)),
    ]);
    const responses = Object.fromEntries(tabs.map(([form], i) => [form, responseRows[i]])) as ResponseRows;
    cache = { data: { programRows, rosterRows, responses, fetchedAt: new Date().toISOString() }, storedAt: Date.now() };
    return cache.data;
  } catch (error) {
    if (error instanceof GoogleConfigError) throw error;
    console.error('[sheets] 조회 실패', error);
    throw new UpstreamError(cache?.data ?? null);
  }
}

export const errorBody = (code: string, message: string) => ({ error: { code, message } });
