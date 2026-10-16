import type { Metadata } from 'next';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { parseMarkdown, type Block, type Inline } from '@/lib/markdown';

export const metadata: Metadata = { title: '코칭 프로그램 가이드북' };

// 참조 자료실의 고정 자료 (FN-009). 저장소의 가이드북 원문을 빌드할 때 읽어 정적 화면으로 만든다
const SOURCE = 'docs/reference/coaching-program-guidebook.md';

export default function GuidebookPage() {
  const blocks = parseMarkdown(readFileSync(join(process.cwd(), SOURCE), 'utf8'));
  return (
    <>
      <Link href="/references" className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary">
        <ArrowLeft size={18} aria-hidden /> 참조 자료실
      </Link>
      <PageHeader title="코칭 프로그램 가이드북" description="고객 주도형 5회기 코칭 프로그램 종합 가이드 (기본 자료). 원문의 외부 출처 링크는 표시하지 않습니다." />
      <article className="rounded-lg bg-surface p-6 shadow-card">
        {blocks.map((block, i) => (
          <MarkdownBlock key={i} block={block} />
        ))}
      </article>
    </>
  );
}

function Text({ inline }: { inline: Inline }) {
  return inline.map((part, i) => (part.bold ? <strong key={i} className="font-semibold text-main">{part.text}</strong> : part.text));
}

function MarkdownBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading': {
      // 화면 제목(h1) 아래이므로 한 단계씩 내린다
      const level = Math.min(block.level + 1, 4);
      const className = { 2: 'mt-10 text-h2 text-main', 3: 'mt-8 text-h3 text-main', 4: 'mt-6 font-semibold text-main' }[level];
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      return (
        <Tag className={`mb-3 first:mt-0 ${className}`}>
          <Text inline={block.text} />
        </Tag>
      );
    }
    case 'paragraph':
      return (
        <p className="mb-4 text-body">
          {block.lines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              <Text inline={line} />
            </span>
          ))}
        </p>
      );
    case 'list': {
      const items = block.items.map((item, i) => (
        <li key={i}>
          <Text inline={item} />
        </li>
      ));
      return block.ordered ? (
        <ol start={block.start} className="mb-4 list-decimal space-y-1 pl-6 text-body">
          {items}
        </ol>
      ) : (
        <ul className="mb-4 list-disc space-y-1 pl-6 text-body">{items}</ul>
      );
    }
    case 'quote':
      return (
        <blockquote className="mb-4 rounded-md border-l-4 border-primary bg-primary-light px-4 py-3 text-main">
          {block.lines.map((line, i) => (
            <p key={i}>
              <Text inline={line} />
            </p>
          ))}
        </blockquote>
      );
    case 'table':
      return (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="bg-subtle">
                {block.header.map((cell, i) => (
                  <th key={i} scope="col" className="px-3 py-3 align-top text-caption font-semibold text-body">
                    <Text inline={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-line">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-3 align-top text-body">
                      <Text inline={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr className="my-8 border-line" />;
  }
}
