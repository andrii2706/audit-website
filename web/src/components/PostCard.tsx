import Image from 'next/image';
import Link from 'next/link';
import { mediaUrl, type Article } from '@/lib/strapi';

export default function PostCard({ post }: { post: Article }) {
  const cover = mediaUrl(post.cover ?? null);
  const meta = [post.kind, post.readingMinutes ? `${post.readingMinutes} хв` : null].filter(Boolean).join(' · ');
  return (
    <Link href={`/korysne/${post.slug}`} className="post card-h">
      <div className="post__cover">
        {cover && <Image src={cover} alt={post.cover?.alternativeText ?? ''} fill sizes="(max-width: 700px) 100vw, 400px" />}
      </div>
      <div className="post__body">
        {meta && <span className="post__meta">{meta}</span>}
        <span className="post__title">{post.title}</span>
      </div>
    </Link>
  );
}
