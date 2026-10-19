// SCC Coaching Portal — 디자인 검토용 정적 시안 (운영 코드 아님)
// 프로그램·고객·제출 데이터는 모두 가짜 예시. 회차 주제·질문·추천 도구는 가이드북 5.1, 17.4, 18.3, 19.4, 27.15 기준.
'use strict';

const TYPES = {
  career: { name: '커리어 코칭', themes: ['연결·합의·방향 설정', '경험 자산과 현재 위치', '가치·강점·환경 조건', '미래 방향과 가설', '선택지·장애·실험', '자기주도 경력관리', '후속 점검'],
    questions: ['이 과정에서 무엇을 얻고 싶은가?', '나는 어떤 경험을 통해 무엇을 배워왔는가?', '나는 어떤 일·환경에서 나다워지는가?', '앞으로 더 많이 경험하고 싶은 일은 무엇인가?', '무엇이 나를 막고 무엇을 검증할 수 있는가?', '앞으로 나는 어떻게 탐색하고 조정할 것인가?', '무엇을 유지·수정·새로 선택할 것인가?'],
    outputs: ['참여 합의서, 사전성찰지', '경험 자산 목록', '커리어 방향성 문장', '커리어 가설·이정표', '탐색 행동·선택지 지도', '경력 자기관리 계획', '후속 성찰 기록'] },
  mentoring: { name: '멘토링 코칭', themes: ['관계·기대·경계·목표', '나의 이야기와 현재 위치', '가치·강점·성장 기준', '미래 방향과 자원', '선택지·행동·도움 요청', '성장 통합·자립·종료', '후속 점검'],
    questions: ['이 관계에서 무엇을 얻고 싶은가?', '나는 어떤 경험을 지나왔는가?', '나는 무엇을 중요하게 여기고 어떤 힘이 있는가?', '어떤 미래를 경험하고 싶고 무엇이 필요한가?', '무엇을 시도하고 누구의 도움을 구할 것인가?', '앞으로 어떻게 성장과 선택을 이어갈 것인가?', '무엇을 유지·수정·새로 선택할 것인가?'],
    outputs: ['멘토링 코칭 합의서', '멘티 자기이야기', '방향성 문장', '미래 방향·자원 지도', '행동·지원 계획', '지속 계획·관계 회고', '후속 성찰 기록'] },
  life: { name: '라이프 코칭', themes: ['연결·합의·방향 설정', '삶의 이야기와 현재 위치', '가치·강점·나다운 삶', '원하는 삶의 장면', '선택지·경계·실행', '통합·회복·지속', '후속 점검'],
    questions: ['이 과정에서 무엇을 얻고 싶은가?', '나는 지금 어떤 삶을 살고 있는가?', '나는 무엇을 지키며 어떤 사람으로 살고 싶은가?', '앞으로 더 많이 경험하고 싶은 삶은 무엇인가?', '무엇이 나를 멈추게 하며 무엇을 바꿀 수 있는가?', '나는 어떻게 나를 계속 돌보고 조정할 것인가?', '무엇을 유지·수정·새로 선택할 것인가?'],
    outputs: ['참여 합의서, 사전성찰지', '현재 삶의 지도', '라이프 방향성 문장', '미래 삶의 장면', '선택지·실행 계획', '회복·지속 계획', '후속 성찰 기록'] },
};
const STAGES = ['start', '1', '2', '3', '4', '5', 'follow-up'];
const STAGE_LABEL = { start: '시작 세션', 'follow-up': 'Follow-up' };
const STAGE_BADGE = { start: '0', 'follow-up': 'F' };
const BETWEEN = { 1: '일상 관찰', 2: '강점·가치 사용 실험', 3: '미래 검증 행동', 4: '실행·관찰·조정' };
const TOOLS = {
  start: [['Life Wheel', '우선'], ['감정·에너지 기록', '우선'], ['자기 이야기·외재화', '보조']],
  1: [['Life Curve', '우선'], ['자기 이야기·외재화', '우선'], ['감정 알아차림', '보조']],
  2: [['D-H-B', '우선'], ['가치·강점 탐색', '우선'], ['자기결정성 점검', '보조']],
  3: [['Future Life Story', '우선'], ['Mandarat', '보조']],
  4: [['BRAVE', '우선'], ['선택지 지도', '우선'], ['Mandarat', '보조']],
  5: [['Self-Coaching 카드', '우선'], ['회복 자원 지도', '우선'], ['Life Wheel 재점검', '보조']],
  'follow-up': [['자기코칭 루틴', '우선'], ['Life Wheel 비교', '보조']],
};
const HUB_URL = 'https://mkgreeme-web.github.io/CT-Sharing_Hub/';

// 가짜 예시 데이터
const PROGRAMS = [
  { id: '2026-2-DEMO-CAREER', name: '예시 커리어 코칭', type: 'career', status: '운영중', period: '09.01 ~ 12.15', clients: 3, sessions: 5, done: 5, planned: 15, next: '10.18' },
  { id: '2026-2-DEMO-MENTORING', name: '예시 멘토링 코칭', type: 'mentoring', status: '운영중', period: '09.15 ~ 12.20', clients: 2, sessions: 5, done: 2, planned: 10, next: '10.21' },
  { id: '2026-1-DEMO-LIFE', name: '예시 라이프 코칭', type: 'life', status: '종료', period: '03.02 ~ 06.20', clients: 1, sessions: 5, done: 5, planned: 5, next: '—' },
];
const PROGRESS = {
  '2026-2-DEMO-CAREER': [
    { code: 'C01', cells: ['09.10', '09.24', 'overdue', '', '', '', '', ''] },
    { code: 'C02', cells: ['09.11', 'overdue', '', '', '', '', '', ''] },
    { code: 'C03', cells: ['09.12', '09.26', '10.08', '', '', '', '', ''] },
  ],
};
const FORMS = {
  journal: { title: '코칭일지', author: '코치', timing: '매 회기 종료 후', session: true, share: false,
    questions: ['고객이 선택한 의제', '고객의 기대 결과', '가치·강점 신호', '핵심 자각', '선택한 행동과 관찰 기준', '다음 회기 연결점', '코치 자기성찰'] },
  'final-report': { title: '종료 리포트', author: '코치', timing: '마지막 회기 후', session: false, share: false,
    questions: ['개인 자기성찰 질문 카드 (현재 인식·감정·중요성·자원·선택·행동·학습·조정)', '30·60·90일 지속 계획 (유지할 행동·새로 시도할 행동·예상 장애·조정 방법·점검 질문)'] },
  'coach-reflection': { title: '코치 종료소감', author: '코치', timing: '종료 리포트 제출 후', session: false, share: false,
    questions: ['과정 전체에서 고객이 스스로 의제와 행동을 선택했는가?', '조언하고 싶어진 순간과 그때 선택권을 지켰는가?', '다음 코칭에서 더 잘 듣고 싶은 것은 무엇인가?'] },
  'client-reflection': { title: '피코치 종료소감', author: '고객', timing: '종료 리포트 제출 후', session: false, share: true,
    questions: ['나는 프로그램 시작 전보다 나 자신을 더 잘 이해하게 되었다', '나는 중요한 선택에서 나의 기준을 더 의식하게 되었다', '나는 행동이 잘되지 않아도 그 경험에서 배울 수 있다', '나는 앞으로도 나의 변화와 행동을 성찰할 의향이 있다'] },
};
const REFERENCES = [
  { name: '예시 운영 안내서.pdf', kind: 'PDF', date: '2026-10-01' },
  { name: '예시 코치 교육 자료.pptx', kind: 'PPT', date: '2026-09-20' },
];

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stageTitle = (stage) => STAGE_LABEL[stage] || `${stage}회기`;

// ---------- 사이드바 ----------
function renderCoachingNav() {
  $('#coachingNav').innerHTML = Object.entries(TYPES).map(([key, t]) => `
    <button class="type-toggle" type="button" aria-expanded="false" aria-controls="stages-${key}" data-type="${key}">
      <span class="dot" aria-hidden="true"></span>${t.name}<span class="chev" aria-hidden="true">›</span>
    </button>
    <ul class="stage-list" id="stages-${key}" hidden>
      ${STAGES.map((s, i) => `<li><a class="nav-item" href="#/coaching/${key}/${s}" data-match="/coaching/${key}/${s}">
        <span class="stage-badge" aria-hidden="true">${STAGE_BADGE[s] || s}</span><span class="nav-label" title="${stageTitle(s)} · ${t.themes[i]}">${stageTitle(s)} · ${t.themes[i]}</span></a></li>`).join('')}
    </ul>`).join('');
  document.querySelectorAll('.type-toggle').forEach((btn) => btn.addEventListener('click', () => setTypeOpen(btn.dataset.type, btn.getAttribute('aria-expanded') !== 'true')));
}
function setTypeOpen(type, open) {
  const btn = document.querySelector(`.type-toggle[data-type="${type}"]`);
  btn.setAttribute('aria-expanded', String(open));
  $(`#stages-${type}`).hidden = !open;
}
function updateNav(path) {
  document.querySelectorAll('.nav-item').forEach((a) => {
    const m = a.dataset.match;
    const active = m === path || (m === '/dashboard' && path.startsWith('/dashboard'));
    if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const m = path.match(/^\/coaching\/(\w+)\//);
  Object.keys(TYPES).forEach((t) => setTypeOpen(t, m ? m[1] === t : t === 'career'));
}

const isNarrow = () => window.matchMedia('(max-width: 1023px)').matches;
function setSidebar(open, focus) {
  document.body.classList.toggle('sidebar-closed', !open);
  const btn = $('#menuBtn');
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  $('#scrim').hidden = !(open && isNarrow());
  $('#sidebar').inert = !open;
  if (open && isNarrow() && focus) $('#sidebar .nav-item').focus();
}
$('#menuBtn').addEventListener('click', () => setSidebar(document.body.classList.contains('sidebar-closed'), true));
$('#scrim').addEventListener('click', () => { setSidebar(false); $('#menuBtn').focus(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isNarrow() && !document.body.classList.contains('sidebar-closed')) { setSidebar(false); $('#menuBtn').focus(); }
  // 서랍 메뉴가 열린 동안 Tab 초점을 메뉴 안에 가둔다
  if (e.key === 'Tab' && isNarrow() && !document.body.classList.contains('sidebar-closed')) {
    const items = [$('#menuBtn'), ...document.querySelectorAll('#sidebar a, #sidebar button')].filter((el) => el.offsetParent !== null);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// ---------- 화면 ----------
function viewDashboard() {
  return `<div class="page-head"><div><h1>프로그램 현황</h1><p class="meta">예시 데이터 · 마지막 갱신 09:00</p></div></div>
    <div class="filters" role="group" aria-label="필터">
      <label class="field">상태<select><option>운영중</option><option>전체</option><option>준비</option><option>종료</option></select></label>
      <label class="field">연도<select><option>2026</option><option>2027</option></select></label>
      <label class="field">차수<select><option>전체</option><option>1차</option><option>2차</option></select></label>
      <label class="field">유형<select><option>전체</option><option>커리어</option><option>멘토링</option><option>라이프</option></select></label>
    </div>
    <div class="grid">${PROGRAMS.map((p) => `
      <a class="card" href="#/dashboard/${p.id}" aria-label="${esc(p.name)}, ${p.status}, ${p.period}, 진행 현황 보기">
        <h3>${esc(p.name)}</h3>
        <span class="badge ${p.status === '운영중' ? 'active' : ''}">${TYPES[p.type].name} · ${p.status}</span>
        <p class="meta">${p.period} · 고객 ${p.clients}명</p>
        <div class="stat">${p.done} <span class="meta">/ ${p.planned} 코칭일지</span></div>
        <div class="card-row"><span class="meta">다음 일정 ${p.next}</span><span class="arrow-btn" aria-hidden="true">→</span></div>
      </a>`).join('')}</div>`;
}

let sortState = { col: -1, dir: 'ascending' };
function viewProgress(id) {
  const p = PROGRAMS.find((x) => x.id === id);
  if (!p) return viewNotFound();
  const rows = (PROGRESS[id] || []).slice();
  const cols = ['1회', '2회', '3회', '4회', '5회', '종료 리포트', '코치 소감', '피코치 소감'];
  if (sortState.col >= 0) {
    rows.sort((a, b) => {
      const va = sortState.col === 0 ? a.code : a.cells[sortState.col - 1];
      const vb = sortState.col === 0 ? b.code : b.cells[sortState.col - 1];
      return (va > vb ? 1 : va < vb ? -1 : 0) * (sortState.dir === 'ascending' ? 1 : -1);
    });
  }
  const head = ['고객', ...cols].map((c, i) => {
    const active = sortState.col === i;
    const sort = active ? sortState.dir : 'none';
    return `<th scope="col"><button class="sort-btn" type="button" data-col="${i}" aria-sort="${sort}">${c}<span class="sort-ind" aria-hidden="true">${active ? (sortState.dir === 'ascending' ? '▲' : '▼') : '⇅'}</span></button></th>`;
  }).join('');
  const cell = (v, label) => {
    if (v === 'overdue') return `<td><span class="cell-wait" aria-label="${label}, 예정일 지남">○</span></td>`;
    if (v) return `<td><span class="cell-done" aria-label="${label}, 제출, ${v}">✓<small>${v}</small></span></td>`;
    return `<td><span class="cell-wait" aria-label="${label}, 예정">·</span></td>`;
  };
  const body = rows.length ? rows.map((r) => `<tr><td>${r.code}</td>${r.cells.map((v, i) => cell(v, `${r.code} ${cols[i]}`)).join('')}</tr>`).join('')
    : `<tr><td colspan="9">등록된 참여자가 없습니다. roster 시트에 고객을 추가하세요.</td></tr>`;
  return `<p class="breadcrumb"><a href="#/dashboard">← 프로그램 현황</a></p>
    <div class="page-head"><div><h1>${esc(p.name)}</h1><p class="meta">${p.id} · ${p.status} · ${p.period} · 예시 데이터</p></div><p class="meta">마지막 갱신 09:00</p></div>
    ${rows.length ? '<p class="notice">안내: 명단에 없는 응답 1건이 있습니다. 구글폼의 고객 코드를 확인해 주세요.</p>' : ''}
    <div class="table-wrap card" style="padding:0"><table>
      <caption>✓ 제출 · ○ 예정일 지남 · · 예정. 응답 내용은 표시하지 않습니다.</caption>
      <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function flowSvg(nodes, vertical) {
  const w = vertical ? 240 : 128, h = 44, gap = 28, perRow = vertical ? 1 : 6;
  const pos = nodes.map((_, i) => {
    const row = Math.floor(i / perRow), colRaw = i % perRow;
    const col = row % 2 === 0 ? colRaw : perRow - 1 - colRaw; // 지그재그 배치
    return { x: 8 + col * (w + gap), y: 8 + row * (h + gap) };
  });
  const rows = Math.ceil(nodes.length / perRow);
  const width = 16 + perRow * w + (perRow - 1) * gap, height = 16 + rows * h + (rows - 1) * gap;
  const edges = pos.slice(1).map((p, i) => {
    const a = pos[i];
    const sameRow = a.y === p.y;
    const x1 = sameRow ? (p.x > a.x ? a.x + w : a.x) : a.x + w / 2, y1 = sameRow ? a.y + h / 2 : a.y + h;
    const x2 = sameRow ? (p.x > a.x ? p.x : p.x + w) : p.x + w / 2, y2 = sameRow ? p.y + h / 2 : p.y;
    return `<line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arr)"/>`;
  }).join('');
  const boxes = nodes.map((n, i) => `<a href="${n.href}"><g class="node ${n.between ? 'between' : ''}">
    <rect x="${pos[i].x}" y="${pos[i].y}" width="${w}" height="${h}" rx="10"/>
    <text x="${pos[i].x + w / 2}" y="${pos[i].y + h / 2 + 5}" text-anchor="middle">${esc(n.label)}</text></g></a>`).join('');
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${nodes.map((n) => n.label).join(', ')}">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" style="fill:var(--color-text-muted)"/></marker></defs>
    ${edges}${boxes}</svg>`;
}
function viewOverview() {
  const journey = [];
  STAGES.forEach((s, i) => {
    journey.push({ label: stageTitle(s), href: `#/coaching/career/${s}`, desc: TYPES.career.questions[i] });
    if (BETWEEN[s]) journey.push({ label: `Between ${s}`, href: `#/coaching/career/${s}`, between: true, desc: BETWEEN[s] });
  });
  const work = [
    { label: '① 세션 준비', href: '#/coaching/career/1', desc: '회차 가이드에서 목적·질문·추천 도구 확인' },
    { label: '② 세션 진행', href: '#/tools', desc: '질문과 추천 도구 활용 (코칭 툴 나눔터)' },
    { label: '③ 코칭일지', href: '#/records/journal', desc: '회기 종료 후 구글폼으로 작성' },
    { label: '④ Between 안내', href: '#/coaching/career/1', desc: '고객이 선택한 관찰·실험 확인' },
    { label: '⑤ 종료 리포트', href: '#/records/final-report', desc: '마지막 회기 후 구글폼으로 작성' },
    { label: '⑥ 종료소감', href: '#/records/client-reflection', desc: '코치 종료소감 작성, 피코치 링크 전달' },
    { label: '⑦ 진행 확인', href: '#/dashboard', desc: '대시보드에서 제출 현황 확인' },
  ];
  const block = (title, nodes) => `<section class="card flow" aria-labelledby="${title}">
    <h2 id="${title}">${title}</h2>
    <div class="flow-horizontal">${flowSvg(nodes, false)}</div>
    <div class="flow-vertical">${flowSvg(nodes, true)}</div>
    <ol class="steps">${nodes.map((n) => `<li><strong>${esc(n.label)}</strong> — ${esc(n.desc)}</li>`).join('')}</ol></section>`;
  return `<h1>프로그램 개요</h1>
    <p class="lead">고객이 자신의 경험·가치·강점을 탐색하고, 스스로 선택한 작은 행동으로 배우도록 돕는 고객 주도형 다회기 코칭 프로그램입니다. 회기 수는 프로그램마다 다르며, 아래는 5회기 예시입니다.</p>
    ${block('그림 1. 코칭 여정', journey)}${block('그림 2. 코치 업무 절차', work)}`;
}

function viewStage(type, stage) {
  const t = TYPES[type], i = STAGES.indexOf(stage);
  if (!t || i < 0) return viewNotFound();
  const prev = STAGES[i - 1], next = STAGES[i + 1];
  const tools = TOOLS[stage] || [];
  return `<p class="breadcrumb">${t.name} › ${stageTitle(stage)}</p>
    <h1><span class="stage-badge" aria-hidden="true" style="display:inline-grid;vertical-align:middle;margin-right:8px">${STAGE_BADGE[stage] || stage}</span>${t.themes[i]}</h1>
    <p class="lead">가이드북 원문이 들어갈 자리입니다. (시안에는 회기 설계 표의 주제·질문·산출물만 표시)</p>
    <div class="grid-2">
      <section class="card"><h2>핵심 질문</h2><ul class="qlist"><li>“${t.questions[i]}”</li></ul></section>
      <section class="card"><h2>주요 산출물</h2><ul class="qlist"><li>${t.outputs[i]}</li></ul></section>
    </div>
    ${tools.length ? `<section class="card" style="margin-top:24px"><h2>이 회기 추천 도구</h2>
      ${tools.map(([n, lv]) => `<div class="tool-row"><span><span class="badge ${lv === '우선' ? 'active' : ''}">${lv}</span> ${n}</span><a class="btn secondary" href="${HUB_URL}" target="_blank" rel="noopener">나눔터 ↗<span class="sr-only" style="position:absolute;left:-999px">(새 창)</span></a></div>`).join('')}</section>` : ''}
    ${BETWEEN[stage] ? `<section class="card"><h2>다음 Between Session: ${BETWEEN[stage]}</h2><p>고객이 기록·관찰·행동의 주제를 선택합니다. 미실행도 다음 회기의 탐색 자료입니다.</p></section>` : ''}
    <nav class="pager" aria-label="회차 이동">${prev ? `<a href="#/coaching/${type}/${prev}">← ${stageTitle(prev)}</a>` : '<span></span>'}${next ? `<a href="#/coaching/${type}/${next}">${stageTitle(next)} →</a>` : ''}</nav>`;
}

function viewRecord(id) {
  const f = FORMS[id];
  if (!f) return viewNotFound();
  return `<h1>${f.title}</h1><p class="meta">작성자: ${f.author} · 작성 시점: ${f.timing}</p>
    <section class="card" style="margin-top:16px"><h2>질의 항목 미리보기</h2><p class="meta">최종 수정 2026-10-15 · 초안 문항 (운영진 확정 전)</p>
      <ol class="qlist">${f.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ol></section>
    <section class="card"><h2>${f.share ? '피코치에게 링크 전달' : '구글폼 열기'}</h2>
      <div class="form-row">
        <label class="field">프로그램<select id="selProgram"><option value="">선택</option>${PROGRAMS.map((p) => `<option>${p.id}</option>`).join('')}</select></label>
        <label class="field">고객 코드<select id="selClient"><option value="">선택</option><option>C01</option><option>C02</option><option>C03</option></select></label>
        ${f.session ? '<label class="field">회차<select id="selSession"><option value="">선택</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>' : ''}
        ${f.share ? '<button class="btn" id="actionBtn" type="button" aria-disabled="true">링크 복사</button><button class="btn secondary" type="button" id="shareBtn" aria-disabled="true">공유</button>'
                  : '<button class="btn" id="actionBtn" type="button" aria-disabled="true">구글폼 열기 ↗</button>'}
      </div>
      <p class="hint" id="actionHint">프로그램${f.session ? ', 고객 코드, 회차' : '과 고객 코드'}를 선택하세요.</p>
      <p class="hint" id="linkOut"></p>
    </section>`;
}
function bindRecord(id) {
  const f = FORMS[id];
  const sels = ['#selProgram', '#selClient', '#selSession'].map((s) => $(s)).filter(Boolean);
  const btns = [$('#actionBtn'), $('#shareBtn')].filter(Boolean);
  const link = () => {
    const [p, c, s] = sels.map((el) => encodeURIComponent(el.value));
    return `https://forms.example/demo-${id}/viewform?usp=pp_url&entry.1=${p}&entry.2=${c}${s ? `&entry.3=${s}` : ''}`;
  };
  const ready = () => sels.every((el) => el.value);
  sels.forEach((el) => el.addEventListener('change', () => {
    btns.forEach((b) => b.setAttribute('aria-disabled', String(!ready())));
    $('#actionHint').textContent = ready() ? '시안: 실제 폼 대신 생성된 링크를 아래에 보여줍니다.' : $('#actionHint').textContent;
  }));
  btns.forEach((b) => b.addEventListener('click', () => {
    if (!ready()) { $('#actionHint').focus?.(); return; }
    $('#linkOut').textContent = link();
    toast(f.share ? (b.id === 'shareBtn' ? '시안: 공유 창 대신 링크를 표시했습니다' : '링크를 복사했습니다 (시안)') : '시안: 새 창 대신 링크를 표시했습니다');
  }));
}

function viewTools() {
  return `<div class="page-head"><h1>코칭 툴 나눔터</h1><a class="btn" href="${HUB_URL}" target="_blank" rel="noopener">새 창에서 열기 ↗</a></div>
    <div class="iframe-placeholder"><div><h2>나눔터 사이트 삽입 영역</h2>
    <p>운영 화면에서는 이 자리에 ${HUB_URL} 가 iframe으로 표시됩니다.<br>시안은 외부 의존성을 두지 않아 자리만 표시합니다.</p></div></div>`;
}
function viewReferences() {
  return `<div class="page-head"><h1>참조 자료실</h1><label class="field">자료 이름 검색<input type="search" placeholder="예: 안내서"></label></div>
    <section class="card"><div class="tool-row"><span><span class="badge active">기본 자료</span> 코칭 프로그램 가이드북</span><a class="btn secondary" href="#/references">열기 ↗</a></div></section>
    <div class="table-wrap card" style="padding:0"><table><caption>관리자가 구글 드라이브 '참조자료' 폴더에 올린 파일 (예시 데이터) · 마지막 갱신 09:00</caption>
      <thead><tr><th scope="col"><button class="sort-btn" type="button" aria-sort="none">이름<span class="sort-ind" aria-hidden="true">⇅</span></button></th><th scope="col">형식</th><th scope="col"><button class="sort-btn" type="button" aria-sort="descending">수정일<span class="sort-ind" aria-hidden="true">▼</span></button></th><th scope="col">열기</th></tr></thead>
      <tbody>${REFERENCES.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.kind}</td><td>${r.date}</td><td><a href="#/references">열기 ↗</a></td></tr>`).join('')}</tbody></table></div>`;
}
function viewNotFound() {
  return `<h1>요청한 화면을 찾을 수 없습니다</h1><p><a class="btn" href="#/dashboard">프로그램 현황으로</a></p>`;
}

// ---------- 라우팅 ----------
function route() {
  const path = (location.hash.replace(/^#/, '') || '/dashboard');
  let html; let bind = null; let m;
  if (path === '/dashboard') html = viewDashboard();
  else if ((m = path.match(/^\/dashboard\/([\w-]+)$/))) { html = viewProgress(m[1]); bind = () => bindSort(m[1]); }
  else if (path === '/program/overview') html = viewOverview();
  else if ((m = path.match(/^\/coaching\/(\w+)\/([\w-]+)$/))) html = viewStage(m[1], m[2]);
  else if ((m = path.match(/^\/records\/([\w-]+)$/))) { html = viewRecord(m[1]); if (FORMS[m[1]]) bind = () => bindRecord(m[1]); }
  else if (path === '/tools') html = viewTools();
  else if (path === '/references') html = viewReferences();
  else html = viewNotFound();
  $('#view').innerHTML = html;
  if (bind) bind();
  updateNav(path);
  if (isNarrow()) setSidebar(false);
  window.scrollTo(0, 0);
}
function bindSort(id) {
  document.querySelectorAll('.sort-btn[data-col]').forEach((b) => b.addEventListener('click', () => {
    const col = Number(b.dataset.col);
    sortState = { col, dir: sortState.col === col && sortState.dir === 'ascending' ? 'descending' : 'ascending' };
    $('#view').innerHTML = viewProgress(id);
    bindSort(id);
    document.querySelector(`.sort-btn[data-col="${col}"]`).focus();
  }));
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 3000);
}

renderCoachingNav();
setSidebar(!isNarrow());
window.addEventListener('hashchange', route);
route();
