// API-001 GET /api/programs — 프로그램 목록 + 고객 코드·회기 수 + 카드 합계 (읽기 전용)
// 접근 비밀번호는 proxy.ts가 먼저 확인한다
import { connection } from 'next/server';
import { buildProgramList } from '@/lib/data/programs';
import { programStats, todayInSeoul } from '@/lib/data/progress';
import { UpstreamError, errorBody, loadSheets, type SheetData } from '@/lib/data/source';
import { GoogleConfigError } from '@/lib/google/sheets';

function body(data: SheetData) {
  const { programs, invalidCount } = buildProgramList(data.programRows, data.rosterRows);
  const today = todayInSeoul();
  return {
    programs: programs.map((p) => ({ ...p, stats: programStats(p, data.rosterRows, data.responses.journal, today) })),
    invalidCount,
    fetchedAt: data.fetchedAt,
  };
}

export async function GET() {
  // 요청 시점에 실행 — 빌드 중 미리 렌더링하지 않는다 (cacheComponents)
  await connection();
  try {
    return Response.json(body(await loadSheets()));
  } catch (error) {
    if (error instanceof GoogleConfigError) {
      return Response.json(errorBody('MISCONFIGURED', '구글 시트 연결 설정이 없습니다'), { status: 503 });
    }
    // 마지막 성공 결과가 있으면 함께 돌려준다 (06.development-plan.md §5)
    const stale = error instanceof UpstreamError && error.stale;
    return Response.json({ ...errorBody('UPSTREAM_ERROR', '구글 시트를 불러오지 못했습니다'), ...(stale && body(stale)) }, { status: 502 });
  }
}
