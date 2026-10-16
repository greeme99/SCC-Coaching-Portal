// content/forms.json → scripts/google/create-forms.gs 생성
// 문항의 원본은 forms.json 하나로 두고, 구글폼 생성 스크립트는 이 파일로 만들어 둘이 어긋나지 않게 한다
// 실행: node scripts/google/build-forms-script.mjs  (tests/unit/forms.test.ts가 최신 상태인지 검사)
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

export function buildScript(formsJson) {
  const forms = formsJson.forms.map(({ id, formTitle, description, confirmation, prefill, questions }) => ({
    id,
    formTitle,
    description,
    confirmation,
    keys: Object.keys(prefill),
    questions,
  }));
  return `${HEADER}\nconst FORMS = ${JSON.stringify(forms, null, 2)};\n`;
}

const HEADER = `/**
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
    form.setDescription(def.description.join('\\n'));
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
    let item = form.getItems(FormApp.ItemType.TEXT).filter(function (i) { return i.getTitle() === KEY_TITLES.programName; })[0];
    if (!item) {
      item = form.addTextItem().setTitle(KEY_TITLES.programName).setHelpText(KEY_HELP.programName).setRequired(false);
      form.moveItem(item.getIndex(), 1);
    }
    const id = entryId(form, { programName: item.asTextItem() }, 'programName');
    config.getRange(r + 1, col + 1).setValue(id);
    Logger.log(values[r][0] + ' → ' + id);
  }
  Logger.log('완료: forms_config 탭의 prefill_programName 열을 확인하세요.');
}

// 미리 채워진 링크를 만들어 "entry.숫자"를 읽는다. 키 문항이 없는 폼은 빈 값
function entryId(form, keyItems, key) {
  if (!keyItems[key]) return '';
  const url = form.createResponse().withItemResponse(keyItems[key].createResponse(MARKERS[key])).toPrefilledUrl();
  const match = new RegExp('(entry\\\\.\\\\d+)=' + MARKERS[key]).exec(url);
  return match ? match[1] : '';
}
`;

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const formsJson = JSON.parse(readFileSync(new URL('content/forms.json', root), 'utf8'));
  writeFileSync(new URL('scripts/google/create-forms.gs', root), buildScript(formsJson));
  console.log('scripts/google/create-forms.gs 생성');
}
