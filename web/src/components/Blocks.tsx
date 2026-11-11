import type { ReactNode } from 'react';
import { mediaUrl, type Blocks as BlocksData } from '@/lib/strapi';

/* Minimal renderer for the Strapi "Blocks" field (paragraphs, headings, lists, quotes, links, images, code). */

type Node = {
  type: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  level?: number;
  format?: 'ordered' | 'unordered';
  image?: { url: string; alternativeText?: string | null };
  children?: Node[];
};

/**
 * Links typed by editors: only http(s), mailto, tel, site-relative paths and #anchors are kept.
 * Anything else (javascript:, data:, vbscript: …) is dropped, so a compromised editor account can't plant scripts.
 */
export function safeHref(url: string | undefined): string | undefined {
  const u = (url ?? '').trim();
  // Browsers ignore tabs, newlines and control characters inside a scheme ("java\nscript:"), so check without them.
  const plain = u.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  if (!plain) return undefined;
  if (/^(https?:|mailto:|tel:)/i.test(plain)) return u;
  if (/^[\\/]{2}/.test(plain)) return undefined;
  if (/^(\/|#|\?)/.test(plain)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(plain)) return undefined;
  return u;
}

function renderInline(nodes: Node[] = []): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === 'link') {
      const href = safeHref(n.url);
      if (!href) return <span key={i}>{renderInline(n.children)}</span>;
      const external = /^https?:/i.test(href);
      return (
        <a key={i} href={href} className="cursor-pointer" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {renderInline(n.children)}
        </a>
      );
    }
    let el: ReactNode = n.text ?? '';
    if (n.code) el = <code>{el}</code>;
    if (n.bold) el = <strong>{el}</strong>;
    if (n.italic) el = <em>{el}</em>;
    if (n.underline) el = <u>{el}</u>;
    if (n.strikethrough) el = <s>{el}</s>;
    return <span key={i}>{el}</span>;
  });
}

function renderBlock(n: Node, i: number): ReactNode {
  switch (n.type) {
    case 'heading': {
      const level = Math.min(Math.max(n.level ?? 2, 2), 4);
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      return <Tag key={i}>{renderInline(n.children)}</Tag>;
    }
    case 'list': {
      const Tag = n.format === 'ordered' ? 'ol' : 'ul';
      return (
        <Tag key={i}>
          {n.children?.map((li, j) => (li.type === 'list' ? renderBlock(li, j) : <li key={j}>{renderInline(li.children)}</li>))}
        </Tag>
      );
    }
    case 'quote':
      return <blockquote key={i}>{renderInline(n.children)}</blockquote>;
    case 'code':
      return <pre key={i}><code>{n.children?.map((c) => c.text).join('')}</code></pre>;
    case 'image':
      return n.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={mediaUrl(n.image) ?? ''} alt={n.image.alternativeText ?? ''} loading="lazy" />
      ) : null;
    default:
      return <p key={i}>{renderInline(n.children)}</p>;
  }
}

export default function Blocks({ content }: { content?: BlocksData }) {
  if (!content?.length) return null;
  return <div className="prose-content">{(content as Node[]).map(renderBlock)}</div>;
}
