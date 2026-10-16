// 구글 시트·드라이브 읽기 전용 조회 — 서비스 계정 JWT로 토큰을 받아 REST API 호출
// 범위는 spreadsheets.readonly, drive.metadata.readonly(파일 목록만)만 요청한다 (06.development-plan.md §6 최소 권한)
// ponytail: googleapis SDK 대신 node:crypto + fetch로 직접 서명. 드라이브 등 API가 늘어나면 SDK 도입 검토
import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.metadata.readonly'].join(' ');

type ServiceAccount = { client_email: string; private_key: string };

export class GoogleConfigError extends Error {}

function readServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new GoogleConfigError('GOOGLE_SERVICE_ACCOUNT_JSON 미설정');
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key) throw new Error();
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    throw new GoogleConfigError('GOOGLE_SERVICE_ACCOUNT_JSON 형식 오류');
  }
}

const base64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const account = readServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  )}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key);
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64url(signature)}`,
    }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`토큰 발급 실패 (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return token.value;
}

// 읽기 전용 GET 요청 (토큰 자동 첨부)
export async function googleGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { authorization: `Bearer ${await accessToken()}` }, cache: 'no-store' });
  if (!res.ok) throw new Error(`구글 API 조회 실패 (${res.status})`);
  return (await res.json()) as T;
}

// 시트 탭 전체를 행 배열로 읽는다. 첫 행이 열 이름
export async function readSheet(spreadsheetId: string, range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  return (await googleGet<{ values?: string[][] }>(url)).values ?? [];
}

export type DriveFile = { id: string; name: string; mimeType: string; modifiedTime: string; webViewLink: string };

// 폴더 바로 아래 파일 목록 (하위 폴더·휴지통 제외). 파일 내용은 읽지 않는다
export async function listFolder(folderId: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    orderBy: 'name',
    pageSize: '200',
  });
  return (await googleGet<{ files?: DriveFile[] }>(`https://www.googleapis.com/drive/v3/files?${params}`)).files ?? [];
}
