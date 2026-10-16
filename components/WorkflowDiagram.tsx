// 워크플로우 그림 (FN-003, DEC-019): 데이터 배열로 SVG를 그린다. 넓은 화면은 지그재그 가로 흐름, 좁은 화면은 세로 흐름
// 그림 아래 같은 내용의 단계 목록을 함께 둬서 화면 낭독기 사용자도 같은 정보를 얻는다

export type FlowNode = { label: string; href: string; description: string; dashed?: boolean };

const W = 128;
const H = 44;
const GAP = 28;
const PAD = 8;

function layout(count: number, perRow: number, nodeWidth: number) {
  const positions = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / perRow);
    const col = row % 2 === 0 ? i % perRow : perRow - 1 - (i % perRow); // 줄마다 방향을 바꿔 흐름이 이어지게
    return { x: PAD + col * (nodeWidth + GAP), y: PAD + row * (H + GAP) };
  });
  const rows = Math.ceil(count / perRow);
  const columns = Math.min(perRow, count);
  return {
    positions,
    width: PAD * 2 + columns * nodeWidth + (columns - 1) * GAP,
    height: PAD * 2 + rows * H + (rows - 1) * GAP,
  };
}

function FlowSvg({ nodes, perRow, nodeWidth, title, markerId, numbered }: { nodes: FlowNode[]; perRow: number; nodeWidth: number; title: string; markerId: string; numbered?: boolean }) {
  const { positions, width, height } = layout(nodes.length, perRow, nodeWidth);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${title}: ${nodes.map((n) => n.label).join(', ')}`} className="block h-auto w-full">
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="fill-muted" />
        </marker>
      </defs>
      {positions.slice(1).map((p, i) => {
        const a = positions[i];
        const sameRow = a.y === p.y;
        const forward = p.x > a.x;
        const x1 = sameRow ? (forward ? a.x + nodeWidth : a.x) : a.x + nodeWidth / 2;
        const y1 = sameRow ? a.y + H / 2 : a.y + H;
        const x2 = sameRow ? (forward ? p.x : p.x + nodeWidth) : p.x + nodeWidth / 2;
        const y2 = sameRow ? p.y + H / 2 : p.y;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2} className="stroke-muted" markerEnd={`url(#${markerId})`} />;
      })}
      {nodes.map((node, i) => (
        // 링크 이름은 보이는 글자(번호 포함)로 시작해야 한다 (WCAG 2.5.3)
        <a key={node.label} href={node.href} aria-label={`${numbered ? `${i + 1}. ` : ''}${node.label} — ${node.description}`}>
          <rect
            x={positions[i].x}
            y={positions[i].y}
            width={nodeWidth}
            height={H}
            rx={10}
            strokeWidth={1.5}
            strokeDasharray={node.dashed ? '5 4' : undefined}
            className={node.dashed ? 'fill-surface stroke-muted' : 'fill-primary-light stroke-primary'}
          />
          <text
            x={positions[i].x + nodeWidth / 2}
            y={positions[i].y + H / 2 + 5}
            textAnchor="middle"
            className={`text-[14px] ${node.dashed ? 'fill-body font-medium' : 'fill-main font-semibold'}`}
          >
            {numbered ? `${i + 1}. ${node.label}` : node.label}
          </text>
        </a>
      ))}
    </svg>
  );
}

// numbered: 그림의 단계에 순번을 붙인다 (아래 목록은 ol 순번을 그대로 쓴다)
export function WorkflowDiagram({ id, title, nodes, numbered }: { id: string; title: string; nodes: FlowNode[]; numbered?: boolean }) {
  return (
    <figure>
      <div className="hidden md:block">
        <FlowSvg nodes={nodes} perRow={6} nodeWidth={W} title={title} markerId={`${id}-h`} numbered={numbered} />
      </div>
      <div className="mx-auto max-w-[260px] md:hidden">
        <FlowSvg nodes={nodes} perRow={1} nodeWidth={240} title={title} markerId={`${id}-v`} numbered={numbered} />
      </div>
      <figcaption className="sr-only">{title}</figcaption>
      <ol className="mt-4 list-decimal space-y-1 pl-6 text-body">
        {nodes.map((n) => (
          <li key={n.label}>
            <a href={n.href} className="font-semibold text-main hover:text-primary">
              {n.label}
            </a>{' '}
            — {n.description}
          </li>
        ))}
      </ol>
    </figure>
  );
}
