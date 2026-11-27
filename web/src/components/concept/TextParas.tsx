import './text-paras.css';

/** A CMS text field written as paragraphs separated by a blank line (home page «why us» text, notes under numbers). */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '').split(/\r?\n\s*\r?\n/).map((x) => x.trim()).filter(Boolean);
}

export default function TextParas({ text, className }: { text: string | null | undefined; className: string }) {
  const paras = paragraphs(text);
  if (!paras.length) return null;
  return (
    <div className={`paras ${className}`}>
      {paras.map((x, i) => <p key={i}>{x}</p>)}
    </div>
  );
}
