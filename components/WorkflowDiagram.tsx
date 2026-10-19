'use client';

// 워크플로우 그림 (FN-003, DEC-019·035): 데이터 배열로 SVG를 그린다. 넓은 화면은 지그재그 가로 흐름, 좁은 화면은 세로 흐름
// 단계를 누르면 아래 상세 칸에 질문·산출물이 바뀌어 보이고, 상세 칸의 버튼으로 해당 화면에 들어간다 (긴 목록 대신 한 단계씩)
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';

export type FlowNode = {
  label: string;
  href: string;
  description: string;
  question?: string;
  outputs?: string;
  dashed?: boolean;
};

const W = 128;
const H = 44;
const linkClass = 'mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-strong';
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

type SvgProps = {
  nodes: FlowNode[];
  perRow: number;
  nodeWidth: number;
  title: string;
  markerId: string;
  numbered?: boolean;
  selected: number;
  onSelect: (index: number) => void;
};

function nodeName(node: FlowNode, i: number, numbered?: boolean) {
  return numbered ? `${i + 1}. ${node.label}` : node.label;
}

function FlowSvg({ nodes, perRow, nodeWidth, title, markerId, numbered, selected, onSelect }: SvgProps) {
  const { positions, width, height } = layout(nodes.length, perRow, nodeWidth);
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(i);
    }
  };
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
      {nodes.map((node, i) => {
        const active = i === selected;
        // 선택: 진한 파랑 채움 + 흰 글자. Between(점선)은 실험 구간이라 선택 전엔 흰 바탕
        const fill = active ? 'fill-primary stroke-primary-strong' : node.dashed ? 'fill-surface stroke-muted' : 'fill-primary-light stroke-primary';
        const text = active ? 'fill-on-primary font-semibold' : node.dashed ? 'fill-body font-medium' : 'fill-main font-semibold';
        return (
          // 이름은 보이는 글자(번호 포함)로 시작해야 한다 (WCAG 2.5.3)
          <g
            key={node.label}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${nodeName(node, i, numbered)} — ${node.description}`}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => onKey(e, i)}
            className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-primary-strong focus-visible:[&>rect]:[stroke-width:3]"
          >
            <rect
              x={positions[i].x}
              y={positions[i].y}
              width={nodeWidth}
              height={H}
              rx={10}
              strokeWidth={1.5}
              strokeDasharray={node.dashed && !active ? '5 4' : undefined}
              className={`transition-colors ${fill}`}
            />
            <text x={positions[i].x + nodeWidth / 2} y={positions[i].y + H / 2 + 5} textAnchor="middle" className={`pointer-events-none text-[14px] ${text}`}>
              {nodeName(node, i, numbered)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// numbered: 그림의 단계에 순번을 붙인다. linkLabel: 상세 칸 이동 버튼 문구
export function WorkflowDiagram({
  id,
  title,
  nodes,
  numbered,
  linkLabel = '열기',
}: {
  id: string;
  title: string;
  nodes: FlowNode[];
  numbered?: boolean;
  linkLabel?: string;
}) {
  const [selected, setSelected] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const node = nodes[selected];
  // 휴대폰 세로 그림은 길어서, 단계를 누르면 상세 칸이 보이도록 살짝 내려 준다
  const onSelect = (i: number) => {
    setSelected(i);
    panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const svgProps = { nodes, title, numbered, selected, onSelect };
  const step = (delta: number) => setSelected((i) => Math.min(nodes.length - 1, Math.max(0, i + delta)));
  return (
    <figure>
      <figcaption className="mb-3 text-caption text-body">단계를 누르면 아래에 내용이 보입니다.</figcaption>
      <div className="hidden md:block">
        <FlowSvg {...svgProps} perRow={6} nodeWidth={W} markerId={`${id}-h`} />
      </div>
      <div className="mx-auto max-w-[260px] md:hidden">
        <FlowSvg {...svgProps} perRow={1} nodeWidth={240} markerId={`${id}-v`} />
      </div>

      {/* 선택한 단계의 상세 — 바뀔 때 화면 낭독기가 읽도록 polite 알림 */}
      <div ref={panel} aria-live="polite" className="mt-5 scroll-mb-4 rounded-md border border-line bg-subtle p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-h3 text-main">
            <span className="mr-2 text-caption font-semibold text-primary-strong">
              {selected + 1} / {nodes.length}
            </span>
            {node.label}
          </h3>
          <div className="flex gap-1">
            <button type="button" onClick={() => step(-1)} disabled={selected === 0} aria-label="이전 단계" className="grid size-11 place-items-center rounded-md text-body hover:bg-surface disabled:opacity-40">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" onClick={() => step(1)} disabled={selected === nodes.length - 1} aria-label="다음 단계" className="grid size-11 place-items-center rounded-md text-body hover:bg-surface disabled:opacity-40">
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>
        {node.question ? (
          <>
            <p className="mt-3 break-keep text-lg font-semibold text-main">{node.question}</p>
            {node.outputs && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-body">
                <span className="text-caption font-semibold">산출물</span>
                {node.outputs.split(', ').map((o) => (
                  <span key={o} className="rounded-full bg-surface px-3 py-1 text-caption text-main">
                    {o}
                  </span>
                ))}
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 break-keep text-body">{node.description}</p>
        )}
        {/* 같은 화면 안 묶음(#between 등)은 일반 링크 — 브라우저 주소 이동 이벤트로 접힌 묶음이 펼쳐진다 */}
        {node.href.includes('#') ? (
          <a href={node.href} className={linkClass}>
            {node.label} {linkLabel}
            <ArrowRight size={18} aria-hidden />
          </a>
        ) : (
          <Link href={node.href} className={linkClass}>
            {node.label} {linkLabel}
            <ArrowRight size={18} aria-hidden />
          </Link>
        )}
      </div>
    </figure>
  );
}
