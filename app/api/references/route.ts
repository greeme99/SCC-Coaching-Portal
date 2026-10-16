// API-003 GET /api/references — 드라이브 '참조자료' 폴더 파일 목록 (읽기 전용, 파일 내용은 읽지 않음)
import { connection } from 'next/server';
import { toReferences, type ReferenceFile } from '@/lib/data/references';
import { errorBody } from '@/lib/data/source';
import { GoogleConfigError, listFolder } from '@/lib/google/sheets';

const CACHE_MS = 300_000;

// RULE-006: 메모리 캐시(최대 5분)만. 파일을 올리면 5분 안에 보인다 (NFR-005)
let cache: { files: ReferenceFile[]; fetchedAt: string; storedAt: number } | null = null;

export async function GET() {
  await connection();
  if (cache && Date.now() - cache.storedAt < CACHE_MS) return Response.json({ files: cache.files, fetchedAt: cache.fetchedAt });

  const folderId = process.env.DRIVE_REFERENCES_FOLDER_ID;
  try {
    if (!folderId) throw new GoogleConfigError('참조자료 폴더 ID 미설정');
    cache = { files: toReferences(await listFolder(folderId)), fetchedAt: new Date().toISOString(), storedAt: Date.now() };
    return Response.json({ files: cache.files, fetchedAt: cache.fetchedAt });
  } catch (error) {
    if (error instanceof GoogleConfigError) {
      return Response.json(errorBody('MISCONFIGURED', '구글 드라이브 연결 설정이 없습니다'), { status: 503 });
    }
    console.error('[API-003] 드라이브 조회 실패', error);
    return Response.json(
      { ...errorBody('UPSTREAM_ERROR', '구글 드라이브를 불러오지 못했습니다'), ...(cache && { files: cache.files, fetchedAt: cache.fetchedAt }) },
      { status: 502 },
    );
  }
}
