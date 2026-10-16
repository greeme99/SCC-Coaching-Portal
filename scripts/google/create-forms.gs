/**
 * 삼코동 코칭 포털 — 구글폼 4종 생성 스크립트
 * ※ 자동 생성 파일. 직접 고치지 말고 content/forms.json을 고친 뒤 node scripts/google/build-forms-script.mjs 실행
 *
 * 사용법 (한 번만 실행)
 *  1. 응답을 모을 구글 시트를 연다 → 메뉴 [확장 프로그램] → [Apps Script]
 *  2. 편집기 내용을 지우고 이 파일 전체를 붙여넣은 뒤 저장
 *  3. 함수 createSamkodongForms 선택 → [실행] → 권한 승인 (내 구글 계정의 폼·시트·드라이브)
 *  4. 끝나면 시트에 forms_config 탭과 응답 탭 4개가 생긴다. forms_config 내용을 포털 content/forms.json에 반영한다
 *
 * 개인정보 (CLAUDE.md §7): 고객 이름 문항은 만들지 않고 고객 코드(clientCode)만 쓴다.
 * 이메일은 코치가 작성하는 폼에서만 수집하고, 피코치(고객) 폼에서는 수집하지 않는다.
 */

const CONFIG_SHEET = 'forms_config';
const RESPONSE_SHEETS = {
  journal: '응답_코칭일지',
  'final-report': '응답_완료보고서',
  'coach-reflection': '응답_코치종료소감',
  'client-reflection': '응답_피코치종료소감',
};
const COLLECT_EMAIL = { journal: true, 'final-report': true, 'coach-reflection': true, 'client-reflection': false };

// 키 문항 — 제목은 대시보드가 응답 시트 열 이름으로 찾으므로 영어 그대로 둔다 (03.IA §5)
const KEY_HELP = {
  programName: '코칭 프로그램 이름 — 포털에서 연 링크면 자동으로 채워져 있습니다.',
  programId: '프로그램 ID — 포털에서 연 링크면 자동으로 채워져 있습니다. (예: 2026-2-SNU-CAREER)',
  clientCode: '고객 코드 — 자동으로 채워져 있습니다. 고객 이름은 적지 않습니다.',
  sessionNo: '회차 번호(숫자) — 자동으로 채워져 있습니다.',
};
// 키 문항 제목. 프로그램 이름은 대시보드가 읽지 않으므로 사람이 보는 한글 제목을 쓴다
const KEY_TITLES = { programName: '코칭 프로그램' };
// 미리 채워진 링크에서 항목 ID를 찾기 위한 표식 값
const MARKERS = { programName: 'KEYPROGRAMNAME', programId: 'KEYPROGRAMID', clientCode: 'KEYCLIENTCODE', sessionNo: '98765' };

function createSamkodongForms() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('구글 시트의 [확장 프로그램 → Apps Script]에서 실행하세요.');
  // 두 번 실행하면 폼이 중복으로 생기므로 막는다
  if (ss.getSheetByName(CONFIG_SHEET)) throw new Error('forms_config 탭이 이미 있습니다. 다시 만들려면 기존 폼과 탭을 먼저 정리하세요.');

  const parents = DriveApp.getFileById(ss.getId()).getParents();
  const folder = parents.hasNext() ? parents.next() : null;
  const rows = [['id', 'title', 'formUrl', 'editUrl', 'prefill_programName', 'prefill_programId', 'prefill_clientCode', 'prefill_sessionNo', 'responseSheet']];

  FORMS.forEach(function (def) {
    const form = FormApp.create(def.formTitle);
    form.setDescription(def.description.join('\n'));
    form.setConfirmationMessage(def.confirmation);
    form.setCollectEmail(COLLECT_EMAIL[def.id]);

    form.addSectionHeaderItem().setTitle('기본 정보 (포털 링크로 자동 입력)');
    const keyItems = {};
    def.keys.forEach(function (key) {
      // 프로그램 이름은 안내용이라 필수가 아니다 (포털 밖에서 연 폼도 제출할 수 있게)
      const item = form.addTextItem().setTitle(KEY_TITLES[key] || key).setHelpText(KEY_HELP[key]).setRequired(key !== 'programName');
      if (key === 'sessionNo') item.setValidation(FormApp.createTextValidation().requireWholeNumber().build());
      keyItems[key] = item;
    });

    let section = '';
    def.questions.forEach(function (q) {
      if (q.section !== section) {
        form.addSectionHeaderItem().setTitle(q.section);
        section = q.section;
      }
      let item;
      if (q.kind === '장문형') item = form.addParagraphTextItem();
      else if (q.kind === '날짜') item = form.addDateItem();
      else if (q.kind === '객관식') {
        item = form.addMultipleChoiceItem();
        // "기타 …" 선택지는 구글폼의 [기타] 직접 입력 칸으로 만든다
        const other = q.options.filter(function (o) { return o.indexOf('기타') === 0; });
        item.setChoiceValues(q.options.filter(function (o) { return o.indexOf('기타') !== 0; }));
        if (other.length) item.showOtherOption(true);
      } else item = form.addTextItem();
      item.setTitle(q.title);
      item.setRequired(q.required);
      if (q.help) item.setHelpText(q.help);
    });

    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    if (folder) DriveApp.getFileById(form.getId()).moveTo(folder);

    // 응답 탭 이름을 고정한다 — 대시보드가 이 이름으로 읽는다
    SpreadsheetApp.flush();
    const sheet = SpreadsheetApp.openById(ss.getId()).getSheets().filter(function (s) {
      const url = s.getFormUrl();
      return url && FormApp.openByUrl(url).getId() === form.getId();
    })[0];
    if (sheet) sheet.setName(RESPONSE_SHEETS[def.id]);

    rows.push([
      def.id,
      def.formTitle,
      form.getPublishedUrl(),
      form.getEditUrl(),
      entryId(form, keyItems, 'programName'),
      entryId(form, keyItems, 'programId'),
      entryId(form, keyItems, 'clientCode'),
      entryId(form, keyItems, 'sessionNo'),
      sheet ? sheet.getName() : '',
    ]);
  });

  const config = ss.insertSheet(CONFIG_SHEET, 0);
  config.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  config.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  config.setFrozenRows(1);
  Logger.log('완료: forms_config 탭을 확인하세요.');
}

// 이미 만든 폼 4개에 '코칭 프로그램' 칸을 추가한다 (2026-10 추가, 한 번만 실행)
// forms_config 탭의 편집 주소로 폼을 열고, 맨 위(기본 정보 제목 바로 아래)에 넣은 뒤 항목 ID를 prefill_programName 열에 적는다
function addProgramNameItems() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = ss && ss.getSheetByName(CONFIG_SHEET);
  if (!config) throw new Error('응답 시트의 [확장 프로그램 → Apps Script]에서 실행하세요. forms_config 탭이 필요합니다.');
  const values = config.getDataRange().getValues();
  const header = values[0];
  let col = header.indexOf('prefill_programName');
  if (col < 0) {
    col = header.length;
    config.getRange(1, col + 1).setValue('prefill_programName').setFontWeight('bold');
  }
  const editCol = header.indexOf('editUrl');
  for (let r = 1; r < values.length; r++) {
    const form = FormApp.openByUrl(values[r][editCol]);
    // 두 번 실행해도 칸이 중복으로 생기지 않게 한다
    // getItems는 일반 Item을, addTextItem은 TextItem을 돌려주므로 TextItem으로 맞춘다
    const existing = form.getItems(FormApp.ItemType.TEXT).filter(function (i) { return i.getTitle() === KEY_TITLES.programName; })[0];
    const item = existing
      ? existing.asTextItem()
      : form.addTextItem().setTitle(KEY_TITLES.programName).setHelpText(KEY_HELP.programName).setRequired(false);
    if (!existing) form.moveItem(item.getIndex(), 1);
    const id = entryId(form, { programName: item }, 'programName');
    config.getRange(r + 1, col + 1).setValue(id);
    Logger.log(values[r][0] + ' → ' + id);
  }
  Logger.log('완료: forms_config 탭의 prefill_programName 열을 확인하세요.');
}

// 미리 채워진 링크를 만들어 "entry.숫자"를 읽는다. 키 문항이 없는 폼은 빈 값
function entryId(form, keyItems, key) {
  if (!keyItems[key]) return '';
  const url = form.createResponse().withItemResponse(keyItems[key].createResponse(MARKERS[key])).toPrefilledUrl();
  const match = new RegExp('(entry\\.\\d+)=' + MARKERS[key]).exec(url);
  return match ? match[1] : '';
}

const FORMS = [
  {
    "id": "journal",
    "formTitle": "삼코동 [OO 코칭 프로그램] 회차별 코칭 일지",
    "description": [
      "[OO 코칭 프로그램]의 고객(멘티)과 진행하신 소중한 코칭 세션을 기록해 주세요.",
      "작성해 주신 일지는 프로그램 진행 현황 파악 및 코칭 시간 인증을 위해서만 활용됩니다.",
      "(※ 코칭 윤리 규정에 따라, 고객의 민감한 개인정보나 구체적인 비밀 사항은 제외하고 코칭의 흐름과 주제 위주로 작성 부탁드립니다.)"
    ],
    "confirmation": "오늘도 고객의 성장을 위해 정성껏 코칭을 진행해 주신 코치님께 진심으로 감사드립니다. - 삼코동 운영팀 드림 -",
    "keys": [
      "programName",
      "programId",
      "clientCode",
      "sessionNo"
    ],
    "questions": [
      {
        "section": "기본 정보 및 세션 개요",
        "title": "코치(멘토) 성함",
        "kind": "단답형",
        "required": true
      },
      {
        "section": "기본 정보 및 세션 개요",
        "title": "진행하신 코칭 회차를 선택해 주세요.",
        "kind": "객관식",
        "required": true,
        "options": [
          "1회차 (사전 오리엔테이션 및 라포 형성 포함)",
          "2회차",
          "3회차",
          "4회차",
          "5회차 (최종 마무리 및 성과 리뷰)",
          "기타 (추가 진행 회차 등)"
        ]
      },
      {
        "section": "기본 정보 및 세션 개요",
        "title": "코칭 진행 일시 및 소요 시간",
        "kind": "단답형",
        "required": true,
        "help": "진행하신 날짜, 시작 시간, 총 소요 시간을 기록해 주세요. (예: 2026년 10월 01일 16:00~17:00 / 60분)"
      },
      {
        "section": "기본 정보 및 세션 개요",
        "title": "코칭 진행 방식",
        "kind": "객관식",
        "required": true,
        "options": [
          "대면 (오프라인 미팅)",
          "비대면 - 화상 (Zoom, Google Meet 등)",
          "비대면 - 전화 (음성 통화)",
          "기타: [ 직접 입력 ]"
        ]
      },
      {
        "section": "코칭 세션 주요 내용",
        "title": "오늘 세션의 핵심 코칭 주제(Goal) 및 주요 대화 내용",
        "kind": "장문형",
        "required": true,
        "help": "고객이 다룬 주요 이슈, 새롭게 발견한 통찰(Awareness) 등을 간략히 요약해 주세요."
      },
      {
        "section": "코칭 세션 주요 내용",
        "title": "고객(멘티)이 도출한 실행 과제 (Action Plan) 및 성찰 과제",
        "kind": "장문형",
        "required": true,
        "help": "다음 회차 전까지 고객이 스스로 실천하기로 결정한 구체적인 행동이나 생각할 거리를 적어주세요."
      },
      {
        "section": "코치 성찰 및 향후 일정",
        "title": "코칭 에세이 / 코치 성찰 노트 (Self-Reflection)",
        "kind": "장문형",
        "required": true,
        "help": "이번 세션을 진행하며 코치로서 느낀 점, 잘된 점, 코칭 역량 측면에서의 배움이나 소감을 자유롭게 나눠 주세요."
      },
      {
        "section": "코치 성찰 및 향후 일정",
        "title": "다음 코칭 예정 일시",
        "kind": "단답형",
        "required": true,
        "help": "다음 회차 일정을 조율하신 경우 날짜와 시간을 적어주세요. (예: 2026년 10월 10일 18시 / 미정인 경우 '일정 조율 중', 마지막 회차인 경우 '종료'로 기입)"
      },
      {
        "section": "코치 성찰 및 향후 일정",
        "title": "삼코동 운영팀에게 전달 및 요청 사항",
        "kind": "장문형",
        "required": false,
        "help": "일정 변경 이슈, 고객 특이사항, 포탈 시스템 및 운영 관련 건의사항 등이 있으신 경우에만 작성해 주세요."
      }
    ]
  },
  {
    "id": "final-report",
    "formTitle": "삼코동 [OO 코칭 프로그램] 코칭 완료 보고서",
    "description": [
      "[OO 코칭 프로그램]의 전 과정을 성공적으로 마무리해 주신 코치님께 깊이 감사드립니다.",
      "본 보고서는 코칭 프로그램의 최종 완료를 확인하고, 고객(멘티)과 코치님의 의미 있는 변화와 성장을 기록하기 위해 작성됩니다.",
      "(※ 코칭 윤리 규정에 따라, 고객의 민감한 개인정보나 비밀유지(Confidentiality)가 필요한 세부 대화 내용은 제외하고 핵심 주제와 성장 변화 위주로 작성해 주시기 바랍니다.)"
    ],
    "confirmation": "코칭 완료 보고서가 정상적으로 제출되었습니다. 처음부터 끝까지 고객의 성장을 위해 헌신해 주신 코치님의 노고에 진심으로 감사드립니다. - 삼코동 운영팀 드림 -",
    "keys": [
      "programName",
      "programId",
      "clientCode"
    ],
    "questions": [
      {
        "section": "섹션 1. 기본 정보 및 코칭 회기 집계",
        "title": "코치(멘토) 성함",
        "kind": "단답형",
        "required": true
      },
      {
        "section": "섹션 1. 기본 정보 및 코칭 회기 집계",
        "title": "전체 코칭 진행 기간",
        "kind": "단답형",
        "required": true,
        "help": "첫 회기 시작일부터 마지막 회기 종료일까지의 기간을 입력해 주세요. (예: 2026. 05. 10. ~ 2026. 08. 30.)"
      },
      {
        "section": "섹션 1. 기본 정보 및 코칭 회기 집계",
        "title": "[비대면] 코칭 진행 횟수 (전화, 화상 등)",
        "kind": "객관식",
        "required": true,
        "help": "비대면으로 진행한 회기 수를 숫자로만 적어주세요. (해당 없을 시 '0' 입력)",
        "options": [
          "0회",
          "1회",
          "2회",
          "3회",
          "4회",
          "5회",
          "기타(직접 입력)"
        ]
      },
      {
        "section": "섹션 1. 기본 정보 및 코칭 회기 집계",
        "title": "[대면] 코칭 진행 횟수",
        "kind": "객관식",
        "required": true,
        "help": "오프라인 대면으로 진행한 회기 수를 숫자로만 적어주세요. (해당 없을 시 '0' 입력)",
        "options": [
          "0회",
          "1회",
          "2회",
          "3회",
          "4회",
          "5회",
          "기타(직접 입력)"
        ]
      },
      {
        "section": "섹션 1. 기본 정보 및 코칭 회기 집계",
        "title": "[합계] 총 코칭 진행 회기 및 총 소요 시간",
        "kind": "단답형",
        "required": true,
        "help": "비대면과 대면을 합산한 총 회기 수와 총 코칭 시간을 적어주세요. (예: 총 5회기 / 총 5시간)"
      },
      {
        "section": "섹션 2. 코칭 종합 내용 및 성과",
        "title": "코칭 주요 내용 (코칭 목표, 주요 과정, 성공 기여 요인 등)",
        "kind": "장문형",
        "required": true,
        "help": "고객과 합의했던 전체 코칭 목표(Goal), 회기별 주요 진행 흐름, 그리고 목표 달성에 긍정적인 영향을 미친 핵심 기여 요인(라포 형성, 사용된 코칭 도구 등)을 종합적으로 서술해 주세요."
      },
      {
        "section": "섹션 2. 코칭 종합 내용 및 성과",
        "title": "고객(피코치/멘티)의 변화와 성장",
        "kind": "장문형",
        "required": true,
        "help": "코칭 시작 전과 비교하여 고객에게 나타난 관점 및 인식의 전환(Awareness), 태도 및 행동의 변화, 실질적인 목표 달성 성과 등을 구체적으로 작성해 주세요."
      },
      {
        "section": "섹션 2. 코칭 종합 내용 및 성과",
        "title": "코치(멘토)의 변화와 성장",
        "kind": "장문형",
        "required": true,
        "help": "이번 코칭 여정을 함께하며 코치님 스스로 느낀 보람, 새롭게 얻은 코칭적 통찰, 코칭 역량(경청, 질문, 프레즌스 등) 측면에서의 성장을 자유롭게 나누어 주세요."
      },
      {
        "section": "섹션 3. 향후 계획 및 최종 제출 확인",
        "title": "코칭 종결 후 계획 및 제언",
        "kind": "장문형",
        "required": true,
        "help": "코칭 종료 후 고객이 스스로 성장을 이어가기 위해 수립한 사후 실행 계획(Follow-up Plan)이나, 향후 삼코동 코칭 프로그램의 발전을 위한 코치님의 제언을 적어주세요."
      },
      {
        "section": "섹션 3. 향후 계획 및 최종 제출 확인",
        "title": "보고서 제출일자",
        "kind": "날짜",
        "required": true
      },
      {
        "section": "섹션 3. 향후 계획 및 최종 제출 확인",
        "title": "작성자 확인 및 전자 서명",
        "kind": "단답형",
        "required": true,
        "help": "위와 같이 [OO 코칭 프로그램]의 코칭 완료 보고서를 제출하며, 작성된 내용이 사실과 같음을 확인합니다. 아래에 코치님의 성함을 다시 한번 기입하여 서명을 갈음합니다. (예: 홍길동 (서명))"
      }
    ]
  },
  {
    "id": "coach-reflection",
    "formTitle": "삼코동 [OO 코칭 프로그램] 종료 설문 (코치/멘토용)",
    "description": [
      "[OO 코칭 프로그램]에 진심을 다해 참여해주신 코치님들께 깊이 감사드립니다.",
      "코칭 종료에 따라, 이번 프로젝트의 성과를 돌아보고 향후 더 나은 코칭 프로그램을 만들어가기 위해 코치님들의 고견을 듣고자 합니다.",
      "1 = 매우 그렇다(매우 만족) / 2 = 그렇다(만족) / 3 = 보통이다 / 4 = 그렇지 않다(불만족) / 5 = 전혀 그렇지 않다(매우 불만족)"
    ],
    "confirmation": "함께해주신 삼코동 코치님 덕분에 의미 있는 프로그램이 되었습니다. 진심으로 감사드립니다. - 삼코동 운영팀 드림 -",
    "keys": [
      "programName",
      "programId",
      "clientCode"
    ],
    "questions": [
      {
        "section": "기본 정보 및 동의",
        "title": "본 설문 결과의 프로그램 개선 및 통계 활용에 대한 동의 여부",
        "kind": "객관식",
        "required": true,
        "options": [
          "동의한다",
          "동의하지 않는다"
        ]
      },
      {
        "section": "기본 정보 및 동의",
        "title": "진행하신 총 코칭 횟수 및 방식을 적어주세요. (예: 총 5회 / 비대면 4회, 대면 1회)",
        "kind": "단답형",
        "required": true
      },
      {
        "section": "프로그램 운영 및 사전 지원 만족도",
        "title": "배정된 코칭 횟수 및 전체 진행 기간은 고객(멘티)의 코칭 목표를 달성하기에 적절하였다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 만족한다",
          "만족한다",
          "보통이다",
          "만족하지 않는다",
          "매우 만족하지 않는다"
        ]
      },
      {
        "section": "프로그램 운영 및 사전 지원 만족도",
        "title": "코칭 대화 시작 전 시행된 사전 오리엔테이션은 프로그램을 이해하고 코칭을 진행하는 데 도움이 되었다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "프로그램 운영 및 사전 지원 만족도",
        "title": "삼코동 코칭 포탈의 가이드, 코칭 도구 및 참조자료는 실제 코칭을 진행하는 데 적절하고 도움이 되었다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "프로그램 운영 및 사전 지원 만족도",
        "title": "코칭 신청서 배정, 코칭 일지 작성, 운영팀의 소통 및 대응 등 프로그램의 전반적인 운영에 만족한다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "코칭 과정 및 효과성 자가 평가",
        "title": "나의 고객(멘티)은 코칭에 적극적으로 참여하였으며, 코치와 신뢰감 있는 관계(라포, Rapport)가 원활히 형성되었다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "코칭 과정 및 효과성 자가 평가",
        "title": "나의 고객(멘티)은 이번 멘토링(코칭)을 통해 스스로의 이슈를 명확히 깨닫고 실질적으로 성장했다고 생각한다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "코칭 과정 및 효과성 자가 평가",
        "title": "나는 이번 [OO 코칭 프로그램]에 참여하며 코치로서의 역량과 전문성이 한층 성장했음을 느낀다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "향후 의향 및 종합 의견",
        "title": "향후 유사한 코칭 프로그램이 개설된다면 코치로 재신청(재참여)할 의향이 있다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "향후 의향 및 종합 의견",
        "title": "주변의 동료 코치들에게 본 코칭 프로그램 참여를 추천할 의향이 있다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "향후 의향 및 종합 의견",
        "title": "[OO 코칭 프로그램] 관련하여 좋았던 점이나 향후 개선되었으면 하는 부분(포탈 시스템, 운영 방식 등)에 대해 자유롭게 말씀해주십시오.",
        "kind": "장문형",
        "required": true
      }
    ]
  },
  {
    "id": "client-reflection",
    "formTitle": "삼코동 [OO 코칭 프로그램] 종료 설문 (멘티/고객용)",
    "description": [
      "[OO 코칭 프로그램]에 끝까지 적극적으로 참여해주신 멘티(고객) 여러분께 진심으로 감사드립니다.",
      "코칭 종료에 따라, 여러분의 성장을 돌아보고 향후 더 나은 프로그램을 만들어가기 위해 소중한 의견을 듣고자 합니다.",
      "1 = 매우 그렇다(매우 만족) / 2 = 그렇다(만족) / 3 = 보통이다 / 4 = 그렇지 않다(불만족) / 5 = 전혀 그렇지 않다(매우 불만족)"
    ],
    "confirmation": "끝까지 성실하게 응답해주셔서 감사합니다. 여러분의 성장을 늘 응원합니다! - 삼코동 운영팀 드림 -",
    "keys": [
      "programName",
      "programId",
      "clientCode"
    ],
    "questions": [
      {
        "section": "기본 정보 및 동의",
        "title": "본 설문 결과의 프로그램 개선 및 통계 활용에 대한 동의 여부",
        "kind": "객관식",
        "required": true,
        "options": [
          "동의한다",
          "동의하지 않는다"
        ]
      },
      {
        "section": "기본 정보 및 동의",
        "title": "참여하신 총 코칭 횟수 및 진행 방식을 적어주세요. (예: 총 5회 / 비대면 4회, 대면 1회)",
        "kind": "단답형",
        "required": true
      },
      {
        "section": "프로그램 운영 및 사전 준비 만족도",
        "title": "배정된 코칭 횟수 및 전체 진행 기간은 목표를 달성하기에 적절하였다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 만족한다",
          "만족한다",
          "보통이다",
          "만족하지 않는다",
          "매우 만족하지 않는다"
        ]
      },
      {
        "section": "프로그램 운영 및 사전 준비 만족도",
        "title": "코칭 시작 전 시행된 사전 오리엔테이션은 코칭을 이해하고 준비하는 데 도움이 되었다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "프로그램 운영 및 사전 준비 만족도",
        "title": "삼코동 코칭 포탈의 가이드, 사전/사후 워크시트 및 참조자료는 코칭에 참여하는 데 도움이 되었다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "프로그램 운영 및 사전 준비 만족도",
        "title": "코칭 신청, 코치 매칭, 일정 조율, 문의 대응 등 프로그램에 대한 전반적인 운영에 만족한다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "코칭 과정 및 효과성 평가",
        "title": "담당 코치(멘토)는 신뢰감 있는 분위기(라포, Rapport)를 형성하고 나의 이야기를 경청해 주었다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "코칭 과정 및 효과성 평가",
        "title": "나는 이번 코칭(멘토링)을 통해 스스로의 이슈를 명확히 깨닫고 실질적인 실행 계획(Action Plan)을 수립할 수 있었다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "코칭 과정 및 효과성 평가",
        "title": "나는 이번 [OO 코칭 프로그램]을 통해 당초 기대했던 목표를 달성하고 개인적/직무적으로 성장했음을 느낀다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "향후 의향 및 종합 의견",
        "title": "향후 유사한 코칭 프로그램이 개설된다면 재참여할 의향이 있다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "향후 의향 및 종합 의견",
        "title": "주변 동료나 지인에게 본 코칭 프로그램을 추천할 의향이 있다.",
        "kind": "객관식",
        "required": true,
        "options": [
          "매우 그렇다",
          "그렇다",
          "보통이다",
          "그렇지 않다",
          "전혀 그렇지 않다"
        ]
      },
      {
        "section": "향후 의향 및 종합 의견",
        "title": "[OO 코칭 프로그램]을 통해 가장 좋았던 점이나, 향후 개선되었으면 하는 부분(또는 담당 코치님께 전하고 싶은 감사 인사)을 자유롭게 말씀해주십시오.",
        "kind": "장문형",
        "required": true
      }
    ]
  }
];
