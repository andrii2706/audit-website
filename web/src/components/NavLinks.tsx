'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Desktop navigation links with the current section highlighted (aria-current="page"). */
export default function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname() ?? '';
  return (
    <>
      {items.map((n) => {
        const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className="relative cursor-pointer rounded-full px-2.5 py-2.5 whitespace-nowrap transition-colors hover:bg-bg aria-[current=page]:bg-bg aria-[current=page]:text-accent-ink"
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
