// API-001 GET /api/programs — 프로그램 목록 + 프로그램별 고객 코드·회기 수 (읽기 전용)
// 접근 비밀번호는 proxy.ts가 먼저 확인한다
// ponytail: Phase 3은 폼 선택 영역에 필요한 값만 담는다. 제출 합계는 Phase 4(대시보드)에서 추가
import { connection } from 'next/server';
import { buildProgramList, type ProgramList } from '@/lib/data/programs';
import { GoogleConfigError, readSheet } from '@/lib/google/sheets';

const CACHE_MS = 300_000;

// RULE-006: 메모리 캐시(최대 5분)만 허용. 파일·다른 저장소에 복제하지 않는다
// ponytail: 서버 인스턴스마다 따로 캐시된다. 인스턴스가 많아지면 응답마다 조회 시각이 다를 수 있음
let cache: { data: ProgramList; fetchedAt: string; storedAt: number } | null = null;

const errorBody = (code: string, message: string) => ({ error: { code, message } });

export async function GET() {
  // 요청 시점에 실행 — 빌드 중 미리 렌더링하지 않는다 (cacheComponents)
  await connection();

  if (cache && Date.now() - cache.storedAt < CACHE_MS) {
    return Response.json({ ...cache.data, fetchedAt: cache.fetchedAt });
  }

  const programsId = process.env.SHEET_PROGRAMS_ID;
  const rosterId = process.env.SHEET_ROSTER_ID;
  try {
    if (!programsId || !rosterId) throw new GoogleConfigError('시트 ID 미설정');
    const [programRows, rosterRows] = await Promise.all([readSheet(programsId, 'programs'), readSheet(rosterId, 'roster')]);
    cache = { data: buildProgramList(programRows, rosterRows), fetchedAt: new Date().toISOString(), storedAt: Date.now() };
    return Response.json({ ...cache.data, fetchedAt: cache.fetchedAt });
  } catch (error) {
    if (error instanceof GoogleConfigError) {
      return Response.json(errorBody('MISCONFIGURED', '구글 시트 연결 설정이 없습니다'), { status: 503 });
    }
    console.error('[API-001] 시트 조회 실패', error);
    // 마지막 성공 결과가 있으면 함께 돌려준다 (06.development-plan.md §5)
    return Response.json(
      { ...errorBody('UPSTREAM_ERROR', '구글 시트를 불러오지 못했습니다'), ...(cache && { ...cache.data, fetchedAt: cache.fetchedAt }) },
      { status: 502 },
    );
  }
}
