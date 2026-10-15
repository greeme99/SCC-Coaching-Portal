# 구글폼 양식 원본

**Summary:** 운영팀이 제공한 구글폼 양식 원문을 보관한다. 앱의 질의 항목 미리보기(`forms.json`, Phase 3)는 이 원문을 기준으로 만든다. 양식 원문은 수정하지 않는다.

| # | 폼 (CLAUDE.md §5) | 파일 | 상태 |
|---|---|---|---|
| ① | 코칭일지 | `01.coaching-journal.md` | 원문 등록 |
| ② | 종료 리포트 (코칭 완료 보고서) | `02.final-report.md` | 원문 등록 |
| ③ | 코치 종료소감 | `03.coach-final-survey.md` | 원문 등록 |
| ④ | 피코치 종료소감 | `04.client-final-survey.md` | 원문 등록 |

## 원문과 실제 구글폼의 차이

**Summary:** 실제 폼은 원문 그대로 만들되, 개인정보 원칙(CLAUDE.md §7)과 완료 판정(§5.2) 때문에 아래만 다르게 만든다.

| 구분 | 원문 | 실제 폼 |
|---|---|---|
| 고객 성함 | ① 2번, ② 2번 "고객(…) 성함" | 만들지 않음. 대신 `clientCode`(고객 코드) 문항 |
| 키 문항 | 없음 | 모든 폼 맨 앞에 `programId`·`clientCode`, 코칭일지는 `sessionNo`(정수) 추가. 포털 링크로 자동 입력 |
| 이메일 수집 | ①②③④ 수집 | 코치용 ①②③만 수집. 피코치용 ④는 수집하지 않음 |
| "기타" 선택지 | "기타 (…)" 선택지 | 구글폼 [기타] 직접 입력 칸 |
| 척도 문항 | ③④ 3~11번 | 그대로. 앱 대시보드에는 **제출 여부만** 표시하고 점수·순위는 보여주지 않는다 (§6) |
| 코칭일지 3번 회차 | 1~5회차 + 기타 | 그대로 둠. 완료 판정은 `sessionNo`로 한다 |

## 구글폼 만들기 (Apps Script, 한 번만)

**Summary:** 응답을 모을 구글 시트에서 `scripts/google/create-forms.gs`를 한 번 실행하면 폼 4개, 응답 탭 4개, `forms_config` 탭이 생긴다. `forms_config` 값을 `content/forms.json`에 옮기면 포털과 연결된다.

1. 응답용 구글 시트(코칭설문.일지.리포트)를 연다 → [확장 프로그램] → [Apps Script]
2. 편집기 내용을 지우고 `scripts/google/create-forms.gs` 전체를 붙여넣고 저장한다
3. 함수 `createSamkodongForms`를 고르고 [실행] → 권한 승인 (내 계정의 폼·시트·드라이브)
4. 시트에 생기는 탭

| 탭 | 내용 | 민감도 |
|---|---|---|
| `forms_config` | 폼 주소·편집 주소·prefill 항목 ID·응답 탭 이름 | 비민감 |
| `응답_코칭일지`, `응답_완료보고서`, `응답_코치종료소감`, `응답_피코치종료소감` | 구글폼 응답 | 민감 |

5. `forms_config` 값을 `content/forms.json`의 `formUrl`·`prefill`에 옮긴다 (Claude에게 요청 가능)

- 문항을 바꿀 때는 `content/forms.json`을 고치고 `node scripts/google/build-forms-script.mjs`로 스크립트를 다시 만든다. 이미 만든 폼은 구글폼 화면에서 직접 고친다 (스크립트를 다시 실행하면 폼이 새로 생긴다).
- 이 시트에는 응답(민감)만 둔다. `programs`·`roster` 시트는 별도 파일로 만든다 (데이터 혼합 금지, CLAUDE.md §6).

## 앱에 연결하는 방법

**Summary:** 실제 구글폼을 만든 뒤 `content/forms.json`에 폼 주소와 미리 채우기 항목 ID를 적으면 일지·소감 화면이 그 폼으로 연결된다.

1. (스크립트를 쓰지 않고 직접 만든 경우) 구글폼을 만들고 **보내기 → 링크**의 주소(`https://docs.google.com/forms/d/e/.../viewform`)를 해당 폼의 `formUrl`에 적는다.
2. 폼에 `programId`, `clientCode` 문항(코칭일지는 `sessionNo`도)을 단답형으로 추가한다. 응답 시트의 열 이름이 이 제목이 되며 대시보드가 이 열로 제출 여부를 판정한다 (`03.IA` §5).
3. 구글폼 메뉴 **⋮ → 미리 채워진 링크 가져오기**에서 세 문항에 아무 값이나 넣고 링크를 만든다. 링크의 `entry.숫자`를 `prefill`의 해당 키에 적는다.
4. 문항 문구를 바꾸면 `forms.json`의 `questions`와 이 폴더의 원문을 함께 고친다. `npm test`가 두 내용을 대조한다.
5. 프로그램 목록은 구글 시트의 `programs`·`roster` 탭에서 읽는다. 서버 환경변수 `GOOGLE_SERVICE_ACCOUNT_JSON`, `SHEET_PROGRAMS_ID`, `SHEET_ROSTER_ID`가 필요하며, 서비스 계정에는 두 시트의 **보기 권한**만 준다.

- 프로그램마다 다른 폼을 쓰려면 `programs` 시트의 `formUrl_journal` 등의 열에 그 폼 주소를 적는다. 앱은 공용 폼의 prefill 항목 ID를 그대로 쓰므로, 별도 폼에서도 미리 채워진 링크로 `entry.숫자`가 같은지 확인한다. 다르면 값이 채워지지 않는다.
