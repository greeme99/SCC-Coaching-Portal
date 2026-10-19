// 입장 화면 그림 (DEC-031, 랜딩 C안 '여정'): 겹겹의 산 사이 굽은 길이 시작 세션 → 회기 → 마무리 → Follow-up 깃발을 지나
// 북극성('더 나은 나')으로 향한다. 사람은 그리지 않는다. 색은 토큰 + 투명도만 쓴다 (design:lint)
const PATH =
  'M140 560 C 260 520 380 520 470 486 C 580 446 520 420 650 404 C 780 388 760 352 880 336 C 1000 320 990 290 1080 270 C 1130 258 1150 240 1168 210';

const FLAGS = [
  { x: 470, y: 486, name: '시작 세션', note: '연결 · 합의' },
  { x: 650, y: 404, name: '회기', note: '탐색 · 발견' },
  { x: 880, y: 336, name: '마무리', note: '통합 · 지속 계획' },
  { x: 1080, y: 270, name: 'Follow-up', note: '유지 · 새로운 선택' },
];

export function JourneyIllustration() {
  return (
    <svg
      viewBox="0 0 1440 560"
      role="img"
      aria-label="겹겹의 산 사이로 굽은 길이 시작 세션, 회기, 마무리, Follow-up 깃발을 지나 산 위의 북극성으로 이어지는 풍경"
      // 휴대폰에서는 오른쪽(길의 끝·북극성)을 크게 보여주고, 글자가 너무 작아지는 이름표는 숨긴다
      className="block h-auto w-full min-w-[720px] shrink-0"
    >
      <path d="M1168 70 L1176 104 L1210 112 L1176 120 L1168 154 L1160 120 L1126 112 L1160 104 Z" fill="var(--color-brand-star)" />
      <g className="max-sm:hidden">
        <text x="1228" y="108" fontSize="20" fontWeight="700" fill="var(--color-text-main)">
          더 나은 나
        </text>
        <text x="1228" y="134" fontSize="15" fill="var(--color-text-body)">
          북극성
        </text>
      </g>

      {/* 먼 산 → 가까운 산: 대표 파랑의 투명도를 겹쳐 깊이를 만든다 */}
      <path d="M0 330 L160 230 L300 300 L470 170 L640 280 L800 150 L980 250 L1168 172 L1320 260 L1440 220 L1440 560 L0 560 Z" fill="var(--color-primary-light)" />
      <path d="M0 400 L200 300 L360 370 L560 260 L760 360 L940 280 L1100 330 L1168 300 L1300 360 L1440 320 L1440 560 L0 560 Z" fill="var(--color-primary)" fillOpacity="0.14" />
      <path d="M0 470 L240 380 L460 440 L700 360 L920 430 L1140 380 L1440 430 L1440 560 L0 560 Z" fill="var(--color-primary)" fillOpacity="0.24" />
      <path d="M0 520 L300 460 L620 500 L900 450 L1200 490 L1440 470 L1440 560 L0 560 Z" fill="var(--color-primary-hover)" fillOpacity="0.42" />

      <path d={PATH} fill="none" stroke="var(--color-bg-surface)" strokeWidth="18" strokeLinecap="round" />
      <path d={PATH} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />

      {FLAGS.map((f) => (
        <g key={f.name}>
          <line x1={f.x} y1={f.y} x2={f.x} y2={f.y - 50} stroke="var(--color-text-main)" strokeWidth="2" />
          <polygon points={`${f.x},${f.y - 50} ${f.x + 28},${f.y - 42} ${f.x},${f.y - 34}`} fill="var(--color-primary)" />
          <g className="max-sm:hidden">
            <text x={f.x - 14} y={f.y - 78} fontSize="14" fill="var(--color-text-body)" textAnchor="end">
              {f.note}
            </text>
            <text x={f.x - 14} y={f.y - 58} fontSize="17" fontWeight="700" fill="var(--color-text-main)" textAnchor="end">
              {f.name}
            </text>
          </g>
        </g>
      ))}
    </svg>
  );
}
