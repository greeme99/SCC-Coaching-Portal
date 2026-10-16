// API-002 GET /api/programs/{programId}/progress — 고객 × 기록 제출 현황 (읽기 전용)
// 응답 내용·이름·이메일은 담지 않는다 (RULE-003, RULE-008)
import { connection } from 'next/server';
import { buildProgramList, normalizeKey } from '@/lib/data/programs';
import { buildProgress, todayInSeoul } from '@/lib/data/progress';
import { UpstreamError, errorBody, loadSheets, type SheetData } from '@/lib/data/source';
import { GoogleConfigError } from '@/lib/google/sheets';

function body(data: SheetData, programId: string) {
  const program = buildProgramList(data.programRows, data.rosterRows).programs.find((p) => p.programId === programId);
  if (!program) return null;
  // 현황표에 필요한 프로그램 정보만 담는다 (고객 코드 목록·전용 폼 주소 제외)
  const { programId: id, name, org, type, sessionCount, startDate, endDate, status } = program;
  return { program: { programId: id, name, org, type, sessionCount, startDate, endDate, status }, ...buildProgress(program, data.rosterRows, data.responses, todayInSeoul()), fetchedAt: data.fetchedAt };
}

export async function GET(_request: Request, { params }: { params: Promise<{ programId: string }> }) {
  await connection();
  const programId = normalizeKey(decodeURIComponent((await params).programId));
  try {
    const result = body(await loadSheets(), programId);
    return result ? Response.json(result) : Response.json(errorBody('NOT_FOUND', '프로그램을 찾을 수 없습니다'), { status: 404 });
  } catch (error) {
    if (error instanceof GoogleConfigError) {
      return Response.json(errorBody('MISCONFIGURED', '구글 시트 연결 설정이 없습니다'), { status: 503 });
    }
    const stale = error instanceof UpstreamError && error.stale && body(error.stale, programId);
    return Response.json({ ...errorBody('UPSTREAM_ERROR', '구글 시트를 불러오지 못했습니다'), ...(stale || {}) }, { status: 502 });
  }
}
