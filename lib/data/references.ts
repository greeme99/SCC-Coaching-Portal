// 드라이브 '참조자료' 폴더 파일 → 참조 자료실 목록 (API-003, FN-009). 순수 함수
import type { DriveFile } from '@/lib/google/sheets';
import { parseDate } from '@/lib/data/programs';

export type ReferenceFile = { id: string; name: string; kind: string; modifiedDate: string; url: string };

// 형식 표시 — 구글 문서 형식과 자주 쓰는 파일 형식만 이름을 붙이고 나머지는 "파일"
const KIND_BY_MIME: Record<string, string> = {
  'application/vnd.google-apps.document': '구글 문서',
  'application/vnd.google-apps.spreadsheet': '구글 시트',
  'application/vnd.google-apps.presentation': '구글 슬라이드',
  'application/vnd.google-apps.form': '구글폼',
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT',
  'text/plain': '텍스트',
};

export function fileKind(mimeType: string): string {
  if (KIND_BY_MIME[mimeType]) return KIND_BY_MIME[mimeType];
  if (mimeType.startsWith('image/')) return '이미지';
  if (mimeType.startsWith('video/')) return '동영상';
  if (mimeType.startsWith('audio/')) return '오디오';
  return '파일';
}

export function toReferences(files: DriveFile[]): ReferenceFile[] {
  return files.map((f) => ({ id: f.id, name: f.name, kind: fileKind(f.mimeType), modifiedDate: parseDate(f.modifiedTime), url: f.webViewLink }));
}

// 이름 검색 — 공백·대소문자 무시, 여러 단어는 모두 포함해야 한다
export function searchReferences(files: ReferenceFile[], query: string): ReferenceFile[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return files.filter((f) => words.every((w) => f.name.toLowerCase().includes(w)));
}
